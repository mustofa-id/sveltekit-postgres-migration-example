import { sql } from '$lib';

export async function load() {
	const todoList: Todo[] = await sql`
		select
			t.id,
			t.description,
			t.created_at,
			t.completed_at,
			to_jsonb(u.*) user
		from todo t
		left join user_account u on u.id = t.user_id
		order by t.created_at
	`;
	return { todoList };
}
