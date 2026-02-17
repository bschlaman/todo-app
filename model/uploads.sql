CREATE TYPE upload_type AS ENUM (
  'IMAGE'
);

CREATE TABLE IF NOT EXISTS public.uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  caller_id character varying(150) NOT NULL CHECK (length(btrim(caller_id)) > 0),
  uploader_ip inet,
  client_filename text CHECK (client_filename IS NULL OR length(btrim(client_filename)) > 0),

  upload_type upload_type NOT NULL
);

CREATE TABLE IF NOT EXISTS public.upload_artifacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  upload_id uuid NOT NULL UNIQUE REFERENCES public.uploads(id) ON DELETE CASCADE,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  storage_key text NOT NULL UNIQUE CHECK (length(btrim(storage_key)) > 0),
  public_url text NOT NULL CHECK (length(btrim(public_url)) > 0),

  pixel_width integer NOT NULL CHECK (pixel_width > 0),
  pixel_height integer NOT NULL CHECK (pixel_height > 0),
  byte_size bigint NOT NULL CHECK (byte_size >= 0),
  mime_type text NOT NULL CHECK (mime_type ~ '^[^/]+/[^/]+$'),

  sha256_hex text NOT NULL CHECK (sha256_hex ~ '^[0-9a-f]{64}$')
);

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

DROP TRIGGER IF EXISTS trg_upload_artifacts_set_updated_at ON public.upload_artifacts;
CREATE TRIGGER trg_upload_artifacts_set_updated_at
BEFORE UPDATE ON public.upload_artifacts
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();
