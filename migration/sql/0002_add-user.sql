create table user_account (
	id bigserial primary key,
	full_name varchar not null,
	created_at timestamptz not null default now()
);

alter table todo add column user_id int8 references user_account (id);

-- sample data
do $$
declare
	first_user_id int8;
begin
	insert into user_account (full_name) values
		('Habib Mustofa')
	returning id into first_user_id;

	update todo set user_id = first_user_id
	where true; -- update all
end $$;
