// @ts-check

const [COMMAND, ARG1] = process.argv.splice(2);

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
	console.log(`creating "${name}"...`);
}

/**
 * Running migrations
 */
async function migrate() {
	console.log(`running migration...`);
}

export {};
