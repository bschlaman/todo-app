CREATE TABLE IF NOT EXISTS public.sessions
(
		id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
		created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
		updated_at timestamp without time zone NOT NULL,
		caller_id character varying(150) NOT NULL,
		session_id uuid NOT NULL,
		session_created_at timestamp without time zone NOT NULL,
		session_last_accessed timestamp without time zone NOT NULL
);
