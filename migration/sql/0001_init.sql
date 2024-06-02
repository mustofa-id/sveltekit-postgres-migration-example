create table todo (
	id bigserial primary key,
	description text,
	created_at timestamptz not null default now(),
	completed_at timestamptz
);

-- sample data
insert into todo (description) values
	('Buy milk'),
	('Drop off dry cleaning'),
	('Pay electricity bill');
