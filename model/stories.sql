CREATE TYPE story_status AS ENUM (
    'BACKLOG',
    'DOING',
    'DONE',
    'DEPRIORITIZED',
    'ARCHIVE',
    'DUPLICATE',
    'DEADLINE PASSED'
);

CREATE TABLE IF NOT EXISTS public.stories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    sqid character varying(36) NOT NULL UNIQUE,
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

CREATE INDEX stories_sqid_index ON stories (sqid);

-- Prevent duplicate story creation within a short time window
-- This constraint prevents double-click submissions by ensuring no two stories
-- with the same title, description, and sprint_id are created within the same second
CREATE UNIQUE INDEX idx_stories_duplicate_prevention
ON stories (title, description, sprint_id, status, DATE_TRUNC('second', created_at));
