interface CheckSessionRes {
	sessionTimeRemainingSeconds: number;
}

type Config = {
	comment_max_len: number;
	server_name: string;
	sprint_duration_seconds: number;
	sprint_title_max_len: number;
	story_desc_max_len: number;
	story_title_max_len: number;
	tag_desc_max_len: number;
	tag_title_max_len: number;
	task_desc_max_len: number;
	task_title_max_len: number;
};

type Task = {
	id: string;
	created_at: string;
	updated_at: string;
	title: string;
	description: string;
	status: string;
	story_id: string;
	edited: string;
	bulk_task: string;
};

type TaskComment = {
	id: string;
	task_id: string;
	created_at: string;
	updated_at: string;
	text: string;
	edited: string;
};

type Tag = {
	id: string;
	created_at: string;
	updated_at: string;
	title: string;
	description: string;
	is_parent: string;
	edited: string;
};

type TagAssignment = {
	id: string;
	created_at: string;
	tag_id: string;
	story_id: string;
};

type Sprint = {
	id: string;
	created_at: string;
	updated_at: string;
	title: string;
	start_date: string;
	end_date: string;
	edited: string;
};

type Story = {
	id: string;
	created_at: string;
	updated_at: string;
	title: string;
	description: string;
	status: string;
	sprint_id: string;
	edited: string;
};