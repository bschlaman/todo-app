### Design
- views
  - single issue view
    - detailed view of single task
    - contains all details including comments with markdown rendering
    - `/task/{id}`
  - task board
    - draggable summary of individual tasks
    - new task feature

task board -> "edit" -> single issue view
single issue view -> "save" -> single issue view

### Routing challenge
Plan is to reroute `/task/{id}` to `/task` so that I can use an `http.FileServer` as the Handler, but unless I try to identify ids (or files), a file server will wrongfully also reroute requests for things like javascript and css files.

### APIs
- `/get_tasks`
- `/get_task?id={id}`
- `/put_task`
- `/create_task`
- `/create_comment`
- `/get_comments_by_task_id?id={id}`

New:
- `/get_sprints`
- `/create_sprint`

- `/get_stories`
- `/create_story`

- `/assign_task_to_story` (`/put_task` ??)
- `/assign_story_to_sprint`

### Architecture
Now that I've introduced the concept of tags, I think a new strategy is necessary for data fetching and rendering.
My plan is to basically fetch all of the data at once for the taskboard view, save it into Maps, and then render.
All of the calls should be async, with the rendering taking place once all are completed.
