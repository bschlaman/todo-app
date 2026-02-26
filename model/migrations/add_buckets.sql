-- Create the buckets table
CREATE TYPE bucket_status AS ENUM (
    'ACTIVE',
    'INACTIVE',
    'ARCHIVED'
);

CREATE TABLE IF NOT EXISTS public.buckets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    sqid varchar(36) NOT NULL UNIQUE,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz,
    title varchar(150) NOT NULL CHECK (title <> ''),
    description varchar(2000),
    status bucket_status NOT NULL DEFAULT 'ACTIVE',
    edited boolean NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS buckets_sqid_index ON buckets (sqid);

-- Add bucket_id to tasks
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS bucket_id uuid REFERENCES buckets(id);

-- A task may have a story parent OR a bucket parent, but not both
ALTER TABLE tasks ADD CONSTRAINT task_single_parent
    CHECK (story_id IS NULL OR bucket_id IS NULL);

-- Add new event_action values for bucket CRUD
ALTER TYPE event_action ADD VALUE IF NOT EXISTS 'GetBuckets';
ALTER TYPE event_action ADD VALUE IF NOT EXISTS 'CreateBucket';
ALTER TYPE event_action ADD VALUE IF NOT EXISTS 'GetBucketTagAssignments';
ALTER TYPE event_action ADD VALUE IF NOT EXISTS 'CreateBucketTagAssignment';
ALTER TYPE event_action ADD VALUE IF NOT EXISTS 'DestroyBucketTagAssignmentByID';

-- Tag assignments for buckets (mirrors tag_assignments for stories)
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
