// @ts-check
import { execSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { platform } from 'node:os';

const [COMMAND, ARG1] = process.argv.splice(2);
const SQL_DIR = new URL('sql', import.meta.url);

switch (COMMAND) {
	case 'create':
		create(ARG1);
		break;
	case 'migrate':
		await migrate();
		break;
	default:
		console.error(`invalid command: "${COMMAND}"`);
		process.exit(1);
}

if (!existsSync(SQL_DIR)) mkdirSync(SQL_DIR);

/**
 * Create new migration file with given name
 *
 * @param {string} name Migration name
 */
function create(name) {
	if (!name) {
		console.error(`invalid arg: migration name is required`);
		process.exit(1);
	}

	const redirectStdout = platform() === 'win32' ? `> NUL 2>&1` : `> /dev/null 2>&1`;

	/** @type {Set<string>} */
	const existingFiles = new Set();

	/** @param {string} command */
	function execFmt(command) {
		const output = execSync(command);
		return output.toString().trim().split('\n');
	}

	/** @param {string} branch */
	function pushBranchFiles(branch) {
		for (const file of execFmt(`git diff ${branch} --name-only ./migration/sql/`)) {
			if (!file || !file.endsWith('.sql')) continue;
			existingFiles.add(file.replace('migration/sql/', ''));
		}
	}

	// check local files
	console.log(`~ checking migration file on local directory...`);
	for (const file of readdirSync(SQL_DIR)) {
		if (!file.endsWith('.sql')) continue;
		existingFiles.add(file);
	}

	// check local branches
	console.log(`~ checking migration file on local branches...`);
	for (const branch of execFmt(`git for-each-ref --format="%(refname:short)" refs/heads/`)) {
		pushBranchFiles(branch);
	}

	// check remote branches
	console.log(`~ checking migration file on remotes branches...`);
	execSync(`git fetch --all ${redirectStdout}`);
	for (const ref of execFmt(`git for-each-ref --format="%(refname:short)" refs/remotes/*/*`)) {
		const [remote, branch] = ref.split('/');
		if (!branch) continue;

		const tempBranch = `temp__${branch}__${randomUUID().slice(0, 8)}`;
		execSync(`git fetch ${remote} ${branch}:${tempBranch} ${redirectStdout}`);
		pushBranchFiles(tempBranch);
		execSync(`git branch -D ${tempBranch} ${redirectStdout}`);
	}

	// create migration file
	const migrationFiles = [...existingFiles].filter(Boolean);
	const lastMigrationId = Number(migrationFiles.sort().at(-1)?.substring(0, 4) || '0000');
	const migrationName = `${String(lastMigrationId + 1).padStart(4, '0')}_${name}.sql`;
	const newMigrationFile = new URL(`${SQL_DIR}/${migrationName}`);

	writeFileSync(newMigrationFile, `select now();\n`);
	console.log(`> created: "${migrationName}"`);
}

/**
 * Running migrations
 */
async function migrate() {
	// we may no need vite to be installed on production env
	const vite = await import('vite')?.catch((e) => console.warn('> migration:', e?.message));
	const { default: postgres } = await import('postgres');

	const DB_URI = vite?.loadEnv?.('production', '.', '')?.DB_URI || process.env.DB_URI;
	if (!DB_URI) throw new Error('"DB_URI" must be connection string');

	const sql = postgres(DB_URI, { onnotice: (n) => console.info(`> ${n.message}`) });

	await sql`
		create table if not exists _migration (
			id varchar not null primary key,
			executed_at timestamptz not null default now()
		)
	`;

	await sql.begin(async (sql) => {
		await sql`
			lock table _migration
			in access exclusive mode
		`;

		// check latest migration
		const [latest] = await sql`
			select id, executed_at from _migration
			order by executed_at desc limit 1
		`;

		// log latest migration info
		if (latest) {
			console.info(
				`~ latest migration: "${latest.id}" at "${latest.executed_at.toLocaleString()}"`
			);
		} else {
			console.info(`~ no previous migration found`);
		}

		const existingMigrations = await sql`
			select id from _migration
			order by executed_at
		`.then((r) => r.map((m) => /** @type {string} */ (m.id)));

		const sqlFiles = readdirSync(SQL_DIR).sort();
		let totalExecution = 0;

		// run sql migration files
		for (const file of sqlFiles) {
			if (!/^\d{4}/.test(file)) throw new Error('file must be starts with 4 digits');
			if (!file.endsWith('.sql')) throw new Error('file extension must be .sql');
			if (existingMigrations.includes(file)) continue;

			console.log(`~ running migration "${file}"...`);
			await sql.file(new URL(`${SQL_DIR}/${file}`));
			await sql`insert into _migration (id) values (${file})`;
			totalExecution++;
		}

		console.log(`> ${totalExecution} of ${sqlFiles.length} migrations executed`);
	});

	await sql.end();
}
