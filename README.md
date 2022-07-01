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