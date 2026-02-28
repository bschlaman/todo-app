CREATE TABLE IF NOT EXISTS public.config (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
	key character varying(50) NOT NULL UNIQUE,
	value character varying(1000) NOT NULL
);

INSERT INTO config (key, value)
VALUES ('server_name', 'TODO-APP-SERVER'),
	(
		'sprint_duration_seconds',
		EXTRACT(
			EPOCH
			FROM '2 weeks'::interval
		)
	),
	('sprint_title_max_len', '150'),
	('story_title_max_len', '150'),
	('task_title_max_len', '150'),
	('story_desc_max_len', '2000'),
	('task_desc_max_len', '2000'),
	('comment_max_len', '8000'),
	('tag_title_max_len', '30'),
	('tag_desc_max_len', '2000'),
	('bucket_title_max_len', '150'),
	('bucket_desc_max_len', '2000');