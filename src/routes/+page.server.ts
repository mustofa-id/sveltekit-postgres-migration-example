import { sql } from '$lib';

export async function load() {
	const todoList = await sql`
		select
			t.id,
			t.description,
			t.created_at,
			t.completed_at
		from todo t
		order by t.created_at
	`;
	return { todoList };
}
