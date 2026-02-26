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
    sqid varchar(36) NOT NULL UNIQUE,
    created_at timestamp without time zone NOT NULL DEFAULT now(),
    updated_at timestamp without time zone,
    title varchar(150) NOT NULL CHECK (title <> ''),
    description varchar(2000),
    -- TODO: this should be `status task_status NOT NULL DEFAULT 'BACKLOG'`
    status task_status DEFAULT 'BACKLOG'::task_status,
    story_id uuid REFERENCES stories(id),
    bucket_id uuid REFERENCES buckets(id),
    edited boolean NOT NULL DEFAULT false,
    bulk_task boolean NOT NULL DEFAULT false,
    CHECK (story_id IS NULL OR bucket_id IS NULL)
);

CREATE INDEX IF NOT EXISTS tasks_sqid_index ON tasks (sqid);

-- Prevent duplicate task creation within a short time window
-- This constraint prevents double-click submissions by ensuring no two tasks
-- with the same title, description, and story_id are created within the same second
CREATE UNIQUE INDEX IF NOT EXISTS idx_tasks_duplicate_prevention
ON tasks (title, description, story_id, status, date_trunc('second', created_at));