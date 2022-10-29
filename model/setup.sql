-- Table: public.tasks

CREATE TYPE task_status AS ENUM  ('BACKLOG', 'DOING', 'DONE', 'DEPRIORITIZED', 'ARCHIVE', 'DUPLICATE', 'DEADLINE PASSED');

CREATE TYPE story_status AS ENUM ('BACKLOG', 'DOING', 'DONE', 'DEPRIORITIZED', 'ARCHIVE', 'DUPLICATE', 'DEADLINE PASSED');

CREATE TABLE IF NOT EXISTS public.sprints
(
		id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
		created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
		updated_at timestamp without time zone,
		title character varying(150) NOT NULL,
		start_date date NOT NULL,
		end_date date NOT NULL,
		edited boolean NOT NULL DEFAULT false,
		CONSTRAINT sprint_start_date_before_end_date CHECK (start_date < end_date)
);

CREATE TABLE IF NOT EXISTS public.stories
(
		id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
		created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
		updated_at timestamp without time zone,
		title character varying(150) NOT NULL,
		description character varying(2000),
		status story_status DEFAULT 'BACKLOG'::story_status,
		sprint_id uuid,
		edited boolean NOT NULL DEFAULT false,
		CONSTRAINT fk_sprint_id FOREIGN KEY(sprint_id) REFERENCES sprints(id),
		CONSTRAINT title_not_empty CHECK (title <> ''),
		UNIQUE (title, sprint_id)
);

CREATE TABLE IF NOT EXISTS public.tasks
(
		id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
		created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
		updated_at timestamp without time zone,
		title character varying(150) NOT NULL,
		description character varying(2000),
		status task_status DEFAULT 'BACKLOG'::task_status,
		story_id uuid,
		edited boolean NOT NULL DEFAULT false,
		CONSTRAINT fk_story_id FOREIGN KEY(story_id) REFERENCES stories(id),
		CONSTRAINT title_not_empty CHECK (title <> '')
);

CREATE TABLE IF NOT EXISTS public.tags
(
		id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
		created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
		updated_at timestamp without time zone,
		title character varying(30) NOT NULL,
		description character varying(2000),
		is_parent boolean NOT NULL DEFAULT false,
		edited boolean NOT NULL DEFAULT false,
		CONSTRAINT title_not_empty CHECK (title <> '')
);

CREATE TABLE IF NOT EXISTS public.tag_assignments
(
		id INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
		created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
		tag_id uuid NOT NULL,
		story_id uuid NOT NULL,
		CONSTRAINT fk_tag_id FOREIGN KEY(tag_id) REFERENCES tags(id),
		CONSTRAINT fk_story_id FOREIGN KEY(story_id) REFERENCES stories(id),
		UNIQUE (tag_id, story_id)
);

CREATE TABLE IF NOT EXISTS public.comments
(
		id INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
		task_id uuid NOT NULL,
		created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
		updated_at timestamp without time zone,
		text character varying(2000) NOT NULL,
		edited boolean NOT NULL DEFAULT false,
		CONSTRAINT fk_task_id FOREIGN KEY(task_id) REFERENCES tasks(id),
		CONSTRAINT text_not_empty CHECK (text <> '')
);

CREATE TABLE IF NOT EXISTS public.config
(
		id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
		created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
		key character varying(50) NOT NULL UNIQUE,
		value character varying(1000) NOT NULL
);

INSERT INTO config (key, value) VALUES
	('server_name', 'TODO-APP-SERVER'),
	('sprint_duration_seconds', EXTRACT(EPOCH FROM '2 weeks'::interval)),
	('sprint_title_max_len', '150'),
	('story_title_max_len', '150'),
	('task_title_max_len', '150'),
	('story_desc_max_len', '2000'),
	('task_desc_max_len', '2000'),
	('comment_max_len', '2000'),
	('tag_title_max_len', '30'),
	('tag_desc_max_len', '2000');


INSERT INTO stories (updated_at, title, description, sprint_id) VALUES
	(CURRENT_TIMESTAMP, 'Dummy Story', 'Catchall Story so that foreign key story_id for tasks is not null', NULL);


-- INSERT INTO tasks (updated_at, title, description) VALUES
-- (CURRENT_TIMESTAMP, 'Sample Task', 'Create the rest of the TODO app');

-- TABLESPACE pg_default;

-- ALTER TABLE IF EXISTS public.tasks
--		OWNER to postgres;
