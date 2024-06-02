interface Todo {
	id: string;
	description: string;
	created_at: string;
	completed_at: string | null;
	user: User;
}

interface User {
	id: string;
	full_name: string;
	created_at: string;
}
