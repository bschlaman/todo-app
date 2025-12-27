CREATE TYPE task_status AS ENUM (
    'BACKLOG',
    'DOING',
    'DONE',
    'DEPRIORITIZED',
    'ARCHIVE',
    'DUPLICATE',
    'DEADLINE PASSED'
);

CREATE TABLE IF NOT EXISTS public.tasks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    sqid character varying(36) NOT NULL UNIQUE,
    created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone,
    title character varying(150) NOT NULL,
    description character varying(2000),
    status task_status DEFAULT 'BACKLOG'::task_status,
    story_id uuid,
    edited boolean NOT NULL DEFAULT false,
    bulk_task boolean NOT NULL DEFAULT false,
    CONSTRAINT fk_story_id FOREIGN KEY(story_id) REFERENCES stories(id),
    CONSTRAINT title_not_empty CHECK (title <> '')
);

CREATE INDEX tasks_sqid_index ON tasks (sqid);

-- Prevent duplicate task creation within a short time window
-- This constraint prevents double-click submissions by ensuring no two tasks
-- with the same title, description, and story_id are created within the same second
CREATE UNIQUE INDEX idx_tasks_duplicate_prevention
ON tasks (title, description, story_id, status, DATE_TRUNC('second', created_at));
