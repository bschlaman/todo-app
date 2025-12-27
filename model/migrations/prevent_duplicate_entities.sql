-- Migration to prevent duplicate entity creation
-- This adds unique constraints to prevent double-click submissions
-- We add `status` to the indices so that the constraints can be added retroactively (e.g. entities marked DUPLICATE).

-- Prevent duplicate task creation within a short time window
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_duplicate_prevention
ON tasks (title, description, story_id, status, DATE_TRUNC('second', created_at));

-- Prevent duplicate story creation within a short time window  
-- This constraint prevents double-click submissions by ensuring no two stories
-- with the same title, description, and sprint_id are created within the same second
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_stories_duplicate_prevention 
ON stories (title, description, sprint_id, status, DATE_TRUNC('second', created_at));
