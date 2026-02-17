CREATE TYPE upload_type AS ENUM (
	'IMAGE'
);

-- SOURCE = what the client uploaded
-- RENDITION = any derived artifact: optimized, resized, thumbnail, etc.
CREATE TYPE upload_file_role AS ENUM (
  'SOURCE',
  'RENDITION'
);

-- Optional: name common rendition "purposes"
CREATE TYPE upload_rendition_purpose AS ENUM (
  'ORIGINAL_QUALITY',  -- e.g., re-encoded but same dimensions/quality target
  'DISPLAY',           -- e.g., web-optimized
  'THUMBNAIL',         -- small preview
  'BLURHASH',          -- if you store derived preview artifacts as files
  'OTHER'
);


CREATE TABLE IF NOT EXISTS public.uploads
(
		id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
		created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
		updated_at timestamp without time zone,
		caller_id character varying(150) NOT NULL,
		upload_type upload_type NOT NULL,
		url character varying(150) NOT NULL,
		client_filename character varying(150),
		original_filesize size NOT NULL,
		transformed_filesize size NOT NULL,
		original_filetype character varying(150) NOT NULL,
		transformed_filetype character varying(150) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- "who" initiated the upload; keep text if you don't have a users table yet.
  caller_id character varying(150) NOT NULL CHECK (length(btrim(caller_id)) > 0),

  uploader_ip inet,

  upload_kind upload_kind NOT NULL DEFAULT 'IMAGE',
  status upload_status NOT NULL DEFAULT 'PENDING',

  -- soft delete
  deleted_at timestamptz,

  -- Optional: client-provided filename (never trust it for anything security-sensitive)
  client_filename text CHECK (client_filename IS NULL OR length(btrim(client_filename)) > 0),


  -- Basic sanity: if deleted_at is set, status should be DELETED (enforced both ways)
  CONSTRAINT uploads_deleted_status_consistency
    CHECK (
      (deleted_at IS NULL AND status <> 'DELETED')
      OR
      (deleted_at IS NOT NULL AND status = 'DELETED')
    )
);


-- --- Files table: each stored object (source + renditions) ---------

CREATE TABLE IF NOT EXISTS public.upload_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  upload_id uuid NOT NULL REFERENCES public.uploads(id) ON DELETE CASCADE,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  role upload_file_role NOT NULL,

  -- For SOURCE rows, purpose should be NULL.
  -- For RENDITION rows, purpose describes what kind of derivative it is.
  purpose upload_rendition_purpose,

  -- Where the bytes live. Prefer storing a durable storage key.
  -- (You can regenerate a public URL later, rotate CDNs, etc.)
  storage_key text NOT NULL CHECK (length(btrim(storage_key)) > 0),

  -- Optional public URL (signed or unsigned). Use TEXT; URLs can be long.
  public_url text,
  CONSTRAINT public_url_format_check
    CHECK (
      public_url IS NULL OR
      public_url ~* '^https?://'
    ),

  -- File properties
  byte_size bigint NOT NULL CHECK (byte_size >= 0),
  mime_type text NOT NULL CHECK (mime_type ~ '^[^/]+/[^/]+$'), -- e.g. image/png

  -- Image metadata (nullable if not extracted)
  pixel_width integer CHECK (pixel_width IS NULL OR pixel_width > 0),
  pixel_height integer CHECK (pixel_height IS NULL OR pixel_height > 0),

  -- Content hash for integrity/dedup (store raw bytes of sha256: 32 bytes)
  sha256 bytea,
  CONSTRAINT sha256_length_check
    CHECK (sha256 IS NULL OR octet_length(sha256) = 32),


  -- Role/purpose consistency:
  CONSTRAINT role_purpose_consistency
    CHECK (
      (role = 'SOURCE' AND purpose IS NULL)
      OR
      (role = 'RENDITION')
    )
);

-- Ensure each upload has at most one SOURCE file.
CREATE UNIQUE INDEX IF NOT EXISTS upload_files_one_source_per_upload
  ON public.upload_files (upload_id)
  WHERE role = 'SOURCE';

-- Prevent duplicate rendition purposes for the same upload (optional but common).
CREATE UNIQUE INDEX IF NOT EXISTS upload_files_unique_purpose_per_upload
  ON public.upload_files (upload_id, purpose)
  WHERE role = 'RENDITION' AND purpose IS NOT NULL;


-- --- updated_at trigger -------------------------------------------

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_uploads_set_updated_at ON public.uploads;
CREATE TRIGGER trg_uploads_set_updated_at
BEFORE UPDATE ON public.uploads
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_upload_files_set_updated_at ON public.upload_files;
CREATE TRIGGER trg_upload_files_set_updated_at
BEFORE UPDATE ON public.upload_files
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();