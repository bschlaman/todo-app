-- Stores relationships between tasks and stories

CREATE TYPE relationship AS ENUM (
	'CONTINUED_BY' -- story_b is story_a continued in the new sprint
);

CREATE TABLE IF NOT EXISTS public.story_relationships (
    id INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    story_id_a uuid NOT NULL,
    story_id_b uuid NOT NULL,
    relation relationship NOT NULL,
    CONSTRAINT fk_story_id_a FOREIGN KEY(story_id_a) REFERENCES stories(id) ON DELETE CASCADE,
    CONSTRAINT fk_story_id_b FOREIGN KEY(story_id_b) REFERENCES stories(id) ON DELETE CASCADE,
    UNIQUE(story_id_a, story_id_b, relation)
);
