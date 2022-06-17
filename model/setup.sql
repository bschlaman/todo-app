-- Table: public.tasks

DROP TABLE IF EXISTS public.tasks;

DROP TYPE task_status;
CREATE TYPE task_status AS ENUM ('BACKLOG', 'DOING', 'DONE', 'DEPRIORITIZED');

CREATE TABLE IF NOT EXISTS public.tasks
(
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone,
		title character varying(24) NOT NULL,
		description character varying(240),
    status task_status DEFAULT 'BACKLOG'::word_pair_status
);

INSERT INTO tasks (updated_at, title, description) VALUES
(CURRENT_TIMESTAMP,	'Sample Task', 'Create the rest of the TODO app');

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.tasks
    OWNER to postgres;
