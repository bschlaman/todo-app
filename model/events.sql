CREATE TYPE event_action AS ENUM (
	'AppStartup',
	'Echo',
	'EchoDelay',
	'Login',
	'CheckSession',
	'GetConfig',
	'GetTasks',
	'GetTaskById',
	'PutTask',
	'PutStory',
	'CreateTask',
	'CreateComment',
	'GetCommentsByTaskId',
	'GetStories',
	'GetStoryById',
	'CreateStory',
	'GetSprints',
	'CreateSprint',
	'CreateTagAssignment',
	'DestroyTagAssignment',
	'GetTags',
	'GetTagAssignments',
	'CreateTag'
);

CREATE TYPE event_action_type AS ENUM (
	'Util',
	'Auth',
	'Get',
	'GetMany',
	'Put',
	'Create',
	'Destroy'
);

-- trying out both kinds of IDs; will consolidate later
-- I am breaking normal form by storing action and action type together
-- caller is a unique identifier for each place I run this app from
-- obtained via env var
CREATE TABLE IF NOT EXISTS public.events
(
		id INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
		uuid uuid NOT NULL DEFAULT gen_random_uuid(),
		created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
		caller_id character varying(150) NOT NULL,
		action event_action NOT NULL,
		action_type event_action_type NOT NULL,
		create_entity_id character varying(150),
		get_response_bytes bigint,
		latency interval NOT NULL
);
