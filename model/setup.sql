-- Table: public.tasks

DROP TABLE IF EXISTS public.tasks;

DROP TYPE task_status;
CREATE TYPE task_status AS ENUM ('BACKLOG', 'DOING', 'DONE', 'DEPRIORITIZED');

CREATE TABLE IF NOT EXISTS public.tasks
(
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone,
		title character varying(50) NOT NULL,
		description character varying(240),
    status task_status DEFAULT 'BACKLOG'::task_status,
		CONSTRAINT title_empty CHECK (title <> ''),
		CONSTRAINT description_empty CHECK (description <> '')
);

CREATE TABLE IF NOT EXISTS public.comments
(
    id INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
		task_id uuid NOT NULL,
    created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone,
		text character varying(1000) NOT NULL,
    edited boolean NOT NULL DEFAULT false,
		CONSTRAINT fk_task FOREIGN KEY(task_id) REFERENCES tasks(id),
		CONSTRAINT text_empty CHECK (text <> '')
);


INSERT INTO tasks (updated_at, title, description) VALUES
(CURRENT_TIMESTAMP,	'Sample Task', 'Create the rest of the TODO app');

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.tasks
    OWNER to postgres;
