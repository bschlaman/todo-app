-- Table: public.tasks

CREATE TYPE task_status AS ENUM ('BACKLOG', 'DOING', 'DONE', 'DEPRIORITIZED', 'ARCHIVE');

CREATE TYPE story_status AS ENUM ('BACKLOG', 'DOING', 'DONE', 'DEPRIORITIZED', 'ARCHIVE');

CREATE TABLE IF NOT EXISTS public.sprints
(
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone,
    title character varying(50) NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    CONSTRAINT sprint_start_date_before_end_date CHECK (start_date < end_date)
);

CREATE TABLE IF NOT EXISTS public.stories
(
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone,
    title character varying(50) NOT NULL,
    description character varying(240),
    status story_status DEFAULT 'BACKLOG'::story_status,
    sprint_id uuid,
    CONSTRAINT fk_sprint_id FOREIGN KEY(sprint_id) REFERENCES sprints(id),
    CONSTRAINT title_not_empty CHECK (title <> '')
);

CREATE TABLE IF NOT EXISTS public.tasks
(
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone,
    title character varying(50) NOT NULL,
    description character varying(240),
    status task_status DEFAULT 'BACKLOG'::task_status,
    story_id uuid,
    CONSTRAINT fk_story_id FOREIGN KEY(story_id) REFERENCES stories(id),
    CONSTRAINT title_not_empty CHECK (title <> '')
);

CREATE TABLE IF NOT EXISTS public.comments
(
    id INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    task_id uuid NOT NULL,
    created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone,
    text character varying(1000) NOT NULL,
    edited boolean NOT NULL DEFAULT false,
    CONSTRAINT fk_task_id FOREIGN KEY(task_id) REFERENCES tasks(id),
    CONSTRAINT text_not_empty CHECK (text <> '')
);

CREATE TABLE IF NOT EXISTS public.config
(
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    key character varying(50) NOT NULL,
    value character varying(1000) NOT NULL
);

INSERT INTO config (key, value) VALUES
	('sprint_duration_seconds', EXTRACT(EPOCH FROM '2 weeks'::interval)),
	('server_name', 'TODO-APP-SERVER');


INSERT INTO stories (updated_at, title, description, sprint_id) VALUES
	(CURRENT_TIMESTAMP, 'Dummy Story', 'Catchall Story so that foreign key story_id for tasks is not null', NULL);


-- INSERT INTO tasks (updated_at, title, description) VALUES
-- (CURRENT_TIMESTAMP,  'Sample Task', 'Create the rest of the TODO app');

-- TABLESPACE pg_default;

-- ALTER TABLE IF EXISTS public.tasks
--     OWNER to postgres;
