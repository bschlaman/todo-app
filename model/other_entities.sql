CREATE TABLE IF NOT EXISTS public.sprints
(
		id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
		created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
		updated_at timestamp without time zone,
		title character varying(150) UNIQUE NOT NULL,
		start_date date NOT NULL,
		end_date date NOT NULL,
		edited boolean NOT NULL DEFAULT false,
		CONSTRAINT sprint_start_date_before_end_date CHECK (start_date < end_date)
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

-- TODO: rename to story_tag_assignments
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

CREATE TABLE IF NOT EXISTS public.bucket_tag_assignments
(
		id INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
		created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
		tag_id uuid NOT NULL,
		bucket_id uuid NOT NULL,
		CONSTRAINT fk_tag_id FOREIGN KEY(tag_id) REFERENCES tags(id),
		CONSTRAINT fk_bucket_id FOREIGN KEY(bucket_id) REFERENCES buckets(id),
		UNIQUE (tag_id, bucket_id)
);

CREATE TABLE IF NOT EXISTS public.comments
(
		id INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
		task_id uuid NOT NULL,
		created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
		updated_at timestamp without time zone,
		text character varying(8000) NOT NULL,
		edited boolean NOT NULL DEFAULT false,
		CONSTRAINT fk_task_id FOREIGN KEY(task_id) REFERENCES tasks(id),
		CONSTRAINT text_not_empty CHECK (text <> '')
);
-- Index on task_id to speed up joins and lookups by task,
-- since PostgreSQL does not automatically index foreign key columns
CREATE INDEX IF NOT EXISTS idx_comments_task_id ON comments(task_id);
