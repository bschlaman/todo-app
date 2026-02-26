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