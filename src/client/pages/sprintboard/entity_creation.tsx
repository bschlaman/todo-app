import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  FormControl,
  MenuItem,
  Select,
  InputLabel,
  Typography,
  Chip,
  LinearProgress,
  CircularProgress,
  Box,
} from "@mui/material";
import React, { useEffect, useRef, useState } from "react";
import {
  createTask,
  createStory,
  createSprint,
  createTagAssignment,
  createTag,
  createStoryRelationship,
  updateTaskById,
} from "../../ts/lib/api";
import {
  type Config,
  STORY_RELATIONSHIP,
  type Sprint,
  type Story,
  type StoryRelationship,
  TASK_STATUS,
  type Tag,
  type TagAssignment,
  type Task,
} from "../../ts/model/entities";
import { NULL_STORY_IDENTIFIER } from "../../ts/lib/common";
import { TagOption } from "./tag_selectors";
import { formatSeconds, sprintToString } from "../../ts/lib/utils";
import { DatePicker } from "@mui/x-date-pickers";
import { StorySelect } from "../../components/story_select";
import DownloadCSVButton from "../../components/download_csv";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DoneIcon from "@mui/icons-material/Done";
import ProtoTaskTable, { type ProtoTask } from "../../components/task_table";
import Papa from "papaparse";
import { CopyDateButton } from "../../components/copy_to_clipboard_components";

function renderCreationButton(
  buttonText: string,
  setOpen: React.Dispatch<React.SetStateAction<boolean>>,
) {
  return (
    <button
      className="whitespace-nowrap rounded-lg bg-zinc-800 px-4 py-1 text-zinc-100 hover:bg-zinc-600"
      onClick={() => {
        setOpen(true);
      }}
    >
      {buttonText}
    </button>
  );
}

export function renderDialogActions(
  handleClose: React.MouseEventHandler<HTMLButtonElement>,
  handleSave: React.MouseEventHandler<HTMLButtonElement>,
  isLoading?: boolean,
) {
  return (
    <DialogActions>
      <Button onClick={handleClose} disabled={isLoading ?? false}>
        Cancel
      </Button>
      {isLoading && (
        <Box display="flex" justifyContent="center" p={2}>
          <CircularProgress size={24} />
        </Box>
      )}
      <Button
        onClick={handleSave}
        color="primary"
        disabled={isLoading ?? false}
      >
        {isLoading ? "Creating..." : "Create"}
      </Button>
    </DialogActions>
  );
}

export function CreateTask({
  stories,
  tagsById,
  assocTagIdsByStoryId,
  config,
  setTasks,
}: {
  stories: Story[] | undefined;
  tagsById: Map<string, Tag>;
  assocTagIdsByStoryId: Map<string, string[]>;
  config: Config | null;
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
}) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLInputElement>(null);
  const [storyId, setStoryId] = useState(NULL_STORY_IDENTIFIER);

  useEffect(() => {
    if (open) titleRef.current?.focus();
  }, [open]);

  function handleClose() {
    setOpen(false);
  }

  function handleSave() {
    if (isLoading) return; // Prevent double-click

    void (async () => {
      if (titleRef.current === null) return;
      if (descriptionRef.current === null) return;

      setIsLoading(true);
      try {
        const task = await createTask(
          titleRef.current.value,
          descriptionRef.current.value,
          storyId === NULL_STORY_IDENTIFIER ? null : storyId,
          false,
        );
        setTasks((tasks) => [...tasks, task]);
        handleClose();
      } catch (error) {
        console.error("Failed to create task:", error);
      } finally {
        setIsLoading(false);
      }
    })();
  }

  return (
    <>
      {renderCreationButton("+ Task", setOpen)}
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="form-dialog-title"
        // needed due to a bug with autofocus in strict mode
        // https://github.com/mui/material-ui/issues/33004
        disableRestoreFocus
        // needed to enable copy to clipboard inside MUI
        // https://github.com/mac-s-g/react-json-view/issues/131
        disableEnforceFocus
      >
        <DialogTitle
          id="form-dialog-title"
          className="flex items-center justify-between"
        >
          <span>Create Task</span>
          <CopyDateButton />
        </DialogTitle>
        <DialogContent>
          <TextField
            inputRef={titleRef}
            name="title" // would be used for event handling
            label="Title"
            autoFocus
            fullWidth
            margin="dense"
            slotProps={{
              htmlInput: { maxLength: config?.task_title_max_len },
            }}
          />
          <TextField
            inputRef={descriptionRef}
            name="description" // would be used for event handling
            label="Description"
            multiline
            minRows={3}
            fullWidth
            margin="dense"
            slotProps={{
              htmlInput: { maxLength: config?.task_desc_max_len },
            }}
          />
          <FormControl fullWidth margin="dense">
            <InputLabel>Parent Story</InputLabel>
            <StorySelect
              storyId={storyId}
              setStoryId={setStoryId}
              stories={stories}
              tagsById={tagsById}
              assocTagIdsByStoryId={assocTagIdsByStoryId}
            />
          </FormControl>
        </DialogContent>
        {renderDialogActions(handleClose, handleSave, isLoading)}
      </Dialog>
    </>
  );
}

export function CreateStory({
  tagsById,
  sprints,
  selectedSprintId,
  config,
  setStories,
  setTagAssignments,
}: {
  tagsById: Map<string, Tag>;
  sprints: Sprint[] | undefined;
  selectedSprintId: string | null;
  config: Config | null;
  setStories: React.Dispatch<React.SetStateAction<Story[]>>;
  setTagAssignments: React.Dispatch<React.SetStateAction<TagAssignment[]>>;
}) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const sprintIdRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) titleRef.current?.focus();
  }, [open]);

  function handleClose() {
    setOpen(false);
  }

  function handleSave() {
    if (isLoading) return; // Prevent double-click

    void (async () => {
      if (titleRef.current === null) return;
      if (descriptionRef.current === null) return;
      if (sprintIdRef.current === null) return;

      setIsLoading(true);
      try {
        const story = await createStory(
          titleRef.current.value,
          descriptionRef.current.value,
          sprintIdRef.current.value,
        );
        setStories((stories) => [...stories, story]);
        for (const tagId of selectedTagIds) {
          const tagAssignment = await createTagAssignment(tagId, story.id);
          setTagAssignments((tagAssignments) => [
            ...tagAssignments,
            tagAssignment,
          ]);
          console.log("Created tag assignment", tagAssignment);
        }
        handleClose();
      } catch (error) {
        console.error("Failed to create story:", error);
      } finally {
        setIsLoading(false);
      }
    })();
  }

  return (
    <>
      {renderCreationButton("+ Story", setOpen)}
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="form-dialog-title"
        // needed due to a bug with autofocus in strict mode
        // https://github.com/mui/material-ui/issues/33004
        disableRestoreFocus
      >
        <DialogTitle id="form-dialog-title">Create Story</DialogTitle>
        <DialogContent>
          <TextField
            inputRef={titleRef}
            name="title" // would be used for event handling
            label="Title"
            autoFocus
            fullWidth
            margin="dense"
            slotProps={{
              htmlInput: { maxLength: config?.story_title_max_len },
            }}
          />
          <TextField
            inputRef={descriptionRef}
            name="description" // would be used for event handling
            label="Description"
            multiline
            minRows={3}
            fullWidth
            margin="dense"
            slotProps={{
              htmlInput: { maxLength: config?.story_desc_max_len },
            }}
          />
          <FormControl fullWidth margin="dense">
            <InputLabel id="sprint-label">Parent Sprint</InputLabel>
            <Select
              inputRef={sprintIdRef}
              labelId="sprint-label"
              label="Parent Sprint"
              defaultValue={selectedSprintId}
              margin="dense"
            >
              {sprints
                ?.sort(
                  (s0, s1) =>
                    new Date(s1.start_date).getTime() -
                    new Date(s0.start_date).getTime(),
                )
                .slice(0, 5)
                .map((sprint) => (
                  <MenuItem key={sprint.id} value={sprint.id}>
                    {sprintToString(sprint)}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
          {[...tagsById.values()].map((tag) => (
            <TagOption
              key={tag.id}
              tag={tag}
              checked={selectedTagIds.includes(tag.id)}
              onTagToggle={(tagId: string, checked: boolean) => {
                setSelectedTagIds((prev) => {
                  if (checked) return [...prev, tagId];
                  return prev.filter((id) => id !== tagId);
                });
              }}
            ></TagOption>
          ))}
        </DialogContent>
        {renderDialogActions(handleClose, handleSave, isLoading)}
      </Dialog>
    </>
  );
}

export function CreateSprint({
  config,
  setSprints,
}: {
  config: Config | null;
  setSprints: React.Dispatch<React.SetStateAction<Sprint[]>>;
}) {
  const [open, setOpen] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const startDateRef = useRef<HTMLInputElement>(null);
  const endDateRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) titleRef.current?.focus();
  }, [open]);

  function handleClose() {
    setOpen(false);
  }

  function handleSave() {
    void (async () => {
      if (titleRef.current === null) return;
      if (startDateRef.current === null) return;
      if (endDateRef.current === null) return;
      if (config === null) return;

      // sanity check sprint duration.
      // this may be removed in the very near future;
      // I don't think I want to enforce this.
      // Probably better to check that it's within a range to protect
      // against clearly incorrect sprint durations.
      const newSprintDuration = Math.floor(
        new Date(endDateRef.current.value).getTime() / 1000 -
          new Date(startDateRef.current.value).getTime() / 1000 +
          // Add 1 day to the sprint duration, as sprint end dates are somewhat
          // incorrectly modeled in the db.
          // A sprint should technically "end" at midnight the following day.
          86400,
      );
      // Allow for a 1hr delta to account for daylight savings in March and November
      if (Math.abs(newSprintDuration - config.sprint_duration_seconds) > 3600)
        throw Error(
          `Sprint duration must be ${formatSeconds(
            config?.sprint_duration_seconds ?? -1,
          )}; instead got ${formatSeconds(newSprintDuration)}`,
        );

      const sprint = await createSprint(
        titleRef.current.value,
        new Date(startDateRef.current.value),
        new Date(endDateRef.current.value),
      );
      setSprints((sprints) => [...sprints, sprint]);
      handleClose();
    })();
  }

  return (
    <>
      {renderCreationButton("+ Sprint", setOpen)}
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="form-dialog-title"
        // needed due to a bug with autofocus in strict mode
        // https://github.com/mui/material-ui/issues/33004
        disableRestoreFocus
      >
        <DialogTitle id="form-dialog-title">Create Sprint</DialogTitle>
        <DialogContent>
          <TextField
            inputRef={titleRef}
            name="title" // would be used for event handling
            label="Title"
            autoFocus
            fullWidth
            margin="dense"
            slotProps={{
              htmlInput: { maxLength: config?.sprint_title_max_len },
            }}
          />
          <DatePicker
            inputRef={startDateRef}
            label="Start Date"
            showDaysOutsideCurrentMonth
          />
          <DatePicker
            inputRef={endDateRef}
            label="End Date"
            showDaysOutsideCurrentMonth
          />
        </DialogContent>
        {renderDialogActions(handleClose, handleSave)}
      </Dialog>
    </>
  );
}

export function CreateTag({
  config,
  setTags,
}: {
  config: Config | null;
  setTags: React.Dispatch<React.SetStateAction<Tag[]>>;
}) {
  const [open, setOpen] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) titleRef.current?.focus();
  }, [open]);

  function handleClose() {
    setOpen(false);
  }

  function handleSave() {
    void (async () => {
      if (titleRef.current === null) return;
      if (descriptionRef.current === null) return;
      const tag = await createTag(
        titleRef.current.value,
        descriptionRef.current.value,
      );
      setTags((tags) => [...tags, tag]);
      handleClose();
    })();
  }

  return (
    <>
      {renderCreationButton("+ Tag", setOpen)}
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="form-dialog-title"
        // needed due to a bug with autofocus in strict mode
        // https://github.com/mui/material-ui/issues/33004
        disableRestoreFocus
      >
        <DialogTitle id="form-dialog-title">Create Tag</DialogTitle>
        <DialogContent>
          <TextField
            inputRef={titleRef}
            name="title" // would be used for event handling
            label="Title"
            autoFocus
            fullWidth
            margin="dense"
            slotProps={{
              htmlInput: { maxLength: config?.tag_title_max_len },
            }}
          />
          <TextField
            inputRef={descriptionRef}
            name="description" // would be used for event handling
            label="Description"
            multiline
            minRows={3}
            fullWidth
            margin="dense"
            slotProps={{
              htmlInput: { maxLength: config?.tag_desc_max_len },
            }}
          />
        </DialogContent>
        {renderDialogActions(handleClose, handleSave)}
      </Dialog>
    </>
  );
}

export function CreateBulkTask({
  stories,
  selectedSprintId,
  tagsById,
  assocTagIdsByStoryId,
  sprintsById,
  config,
  setTasks,
}: {
  stories: Story[] | undefined;
  selectedSprintId: string | null;
  tagsById: Map<string, Tag>;
  assocTagIdsByStoryId: Map<string, string[]>;
  sprintsById: Map<string, Sprint>;
  config: Config | null;
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
}) {
  const [open, setOpen] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLInputElement>(null);
  const [storyId, setStoryId] = useState(NULL_STORY_IDENTIFIER);
  const [commonTitle, setCommonTitle] = useState("");

  useEffect(() => {
    if (open) titleRef.current?.focus();
  }, [open]);

  const BULK_TASK_PREFIX = "[mm.dd] ";

  function handleClose() {
    setOpen(false);
  }

  function handleSave() {
    void (async () => {
      if (titleRef.current === null) return;
      if (descriptionRef.current === null) return;
      await bulkCreateTask(
        titleRef.current.value,
        descriptionRef.current.value,
        storyId === NULL_STORY_IDENTIFIER ? null : storyId,
      );
      handleClose();
    })();
  }

  async function bulkCreateTask(
    commonTitle: string,
    commonDescription: string,
    storyId: string | null,
  ) {
    const sprint = sprintsById.get(selectedSprintId ?? "");
    if (sprint === undefined) return;
    const sprintStart = new Date(sprint.start_date);
    const sprintEnd = new Date(sprint.end_date);
    for (
      const d = sprintStart;
      d <= sprintEnd;
      d.setUTCDate(d.getUTCDate() + 1)
    ) {
      const monthString = String(d.getUTCMonth() + 1).padStart(2, "0");
      const dateString = String(d.getUTCDate()).padStart(2, "0");
      const prefix = `[${monthString}.${dateString}] `;
      console.assert(prefix.length === BULK_TASK_PREFIX.length);
      const task = await createTask(
        prefix + commonTitle,
        commonDescription,
        storyId,
        true,
      );
      setTasks((tasks) => [...tasks, task]);
    }
  }

  return (
    <>
      {renderCreationButton("+ Bulk Task", setOpen)}
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="form-dialog-title"
        // needed due to a bug with autofocus in strict mode
        // https://github.com/mui/material-ui/issues/33004
        disableRestoreFocus
      >
        <DialogTitle id="form-dialog-title">Bulk Create Task</DialogTitle>
        <DialogContent>
          <TextField
            inputRef={titleRef} // redundant to onChange -> state update
            onChange={(e) => {
              setCommonTitle(e.currentTarget.value);
            }}
            name="title" // would be used for event handling
            label="Title"
            autoFocus
            fullWidth
            margin="dense"
            slotProps={{
              htmlInput: { maxLength: config?.task_title_max_len },
            }}
          />
          <Typography
            variant="caption"
            sx={{
              margin: "dense",
            }}
          >
            Preview:
          </Typography>
          <p>{BULK_TASK_PREFIX + commonTitle}</p>
          <TextField
            inputRef={descriptionRef}
            name="description" // would be used for event handling
            label="Description"
            multiline
            minRows={3}
            fullWidth
            margin="dense"
            slotProps={{
              htmlInput: { maxLength: config?.task_desc_max_len },
            }}
          />
          <FormControl fullWidth margin="dense">
            <InputLabel>Parent Story</InputLabel>
            <StorySelect
              storyId={storyId}
              setStoryId={setStoryId}
              stories={stories}
              tagsById={tagsById}
              assocTagIdsByStoryId={assocTagIdsByStoryId}
            />
          </FormControl>
        </DialogContent>
        {renderDialogActions(handleClose, handleSave)}
      </Dialog>
    </>
  );
}

export function BatchUploadTask({
  setTasks,
}: {
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
}) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [fileInfo, setFileInfo] = useState<{
    name: string;
    sizeString: string;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [tasksToCreate, setTasksToCreate] = useState<ProtoTask[]>([]);

  function handleClose() {
    setOpen(false);
  }

  useEffect(() => {
    if (file === null) return;
    setFileInfo({
      name: file.name,
      sizeString: (file.size / 1024).toFixed(2) + " KB",
    });
  }, [file]);

  function handleUpload() {
    if (file === null) return;

    Papa.parse(file, {
      header: true,
      complete: (results) => {
        handleUploaded(results.data);
      },
      error: (err) => {
        setErrorMsg(err.message);
      },
    });
  }

  function handleUploaded(uploadEntities: unknown[]) {
    for (const ue of uploadEntities as Array<{
      story_id: string;
      title: string;
      description: string;
    }>) {
      // sometimes newlines are also parsed;
      // ignore these
      if (Object.values(ue).some((val) => val === "")) continue;
      setTasksToCreate((ptasks) => [
        ...ptasks,
        {
          storyId: ue.story_id,
          title: ue.title,
          description: ue.description,
          created: false,
        },
      ]);
    }
  }

  function batchCreateTasks() {
    void (async () => {
      for (const ptask of tasksToCreate) {
        const task = await createTask(
          ptask.title,
          ptask.description,
          ptask.storyId,
          false,
        );
        setTasks((tasks) => [...tasks, task]);
        setTasksToCreate((ptasks) =>
          ptasks.map((ptask) =>
            ptask.title === task.title && ptask.description === task.description
              ? { ...ptask, created: true }
              : ptask,
          ),
        );
      }
    })();
  }

  return (
    <>
      {renderCreationButton("+ Batch Task Upload", setOpen)}
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="form-dialog-title"
        // needed due to a bug with autofocus in strict mode
        // https://github.com/mui/material-ui/issues/33004
        disableRestoreFocus
      >
        <DialogTitle id="form-dialog-title">Batch Task Upload</DialogTitle>
        <DialogContent>
          <Typography
            sx={{
              margin: "dense",
            }}
          >
            Download the CSV template, add tasks, and then re-upload it to
            create tasks in a batch.
          </Typography>
          <div>
            <input
              accept="csv/*"
              style={{ display: "none" }}
              id="csv-upload-input"
              type="file"
              onChange={(e) => {
                setFile(
                  e.target.files?.[0] !== undefined ? e.target.files[0] : null,
                );
              }}
            />
            <label htmlFor="csv-upload-input">
              <Button variant="contained" color="primary" component="span">
                Upload
                <CloudUploadIcon style={{ marginLeft: "10px" }} />
              </Button>
            </label>
            <Button
              variant="contained"
              color="secondary"
              onClick={handleUpload}
              style={{ marginLeft: "10px" }}
            >
              Submit
            </Button>
            <DownloadCSVButton style={{ marginLeft: "10px" }} />
          </div>
          {fileInfo !== null && (
            <div style={{ marginTop: "10px" }}>
              <Chip
                label="File ready to upload"
                color="primary"
                variant="outlined"
                size="small"
                icon={<DoneIcon />}
                style={{ marginTop: "10px" }}
              />
              <Typography variant="body1">
                File: {fileInfo.name} ({fileInfo.sizeString})
              </Typography>
            </div>
          )}
          {tasksToCreate.length > 0 && (
            <>
              <Typography variant="body1">Tasks to create:</Typography>
              <ProtoTaskTable ptasks={tasksToCreate} />
              <Button
                variant="contained"
                color="info"
                onClick={batchCreateTasks}
                style={{ marginLeft: "10px" }}
              >
                Create Batch
              </Button>
            </>
          )}
          {errorMsg !== "" && (
            <Typography variant="body1">ERROR: {errorMsg}</Typography>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

// used in StoryCard
interface EntityUpdateEvent {
  entityId: string;
  entityType: string;
  entityTitle: string;
}

// used in StoryCard
export function CopyToNewStory({
  continuedStory,
  sprints,
  tasksByStoryId,
  tagsById,
  tagAssignments,
  storyRelationships,
  setTasks,
  setStories,
  setTagAssignments,
  setStoryRelationships,
  config,
}: {
  continuedStory: Story;
  sprints: Sprint[];
  tasksByStoryId: Map<string, Task[]>;
  tagsById: Map<string, Tag>;
  tagAssignments: TagAssignment[];
  storyRelationships: StoryRelationship[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  setStories: React.Dispatch<React.SetStateAction<Story[]>>;
  setTagAssignments: React.Dispatch<React.SetStateAction<TagAssignment[]>>;
  setStoryRelationships: React.Dispatch<
    React.SetStateAction<StoryRelationship[]>
  >;
  config: Config | null;
}) {
  const [open, setOpen] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const sprintIdRef = useRef<HTMLInputElement>(null);
  const [taskMoveProgress, setTaskMoveProgress] = useState(0);
  const [entityCreateEventLog, setEntityCreateEventLog] = useState<
    EntityUpdateEvent[]
  >([]);

  useEffect(() => {
    if (open) titleRef.current?.focus();
  }, [open]);

  useEffect(
    () =>
      setSelectedTagIds(
        tagAssignments
          .filter((ta) => ta.story_id === continuedStory.id)
          .map((ta) => ta.tag_id),
      ),
    [tagAssignments, continuedStory],
  );

  function handleClose() {
    setOpen(false);
  }

  function renderEntityUpdateEvent(eue: EntityUpdateEvent) {
    return (
      <p>
        Created / moved {eue.entityType} <strong>{eue.entityTitle}</strong>
      </p>
    );
  }

  function appendEntityCreationEventLog(
    entityId: string,
    entityType: string,
    entityTitle: string,
  ) {
    setEntityCreateEventLog((eue) => [
      ...eue,
      { entityId, entityType, entityTitle },
    ]);
  }

  function handleSave() {
    void (async () => {
      if (titleRef.current === null) return;
      if (descriptionRef.current === null) return;
      if (sprintIdRef.current === null) return;
      // Step 1: create the new story
      const story = await createStory(
        titleRef.current.value,
        descriptionRef.current.value,
        sprintIdRef.current.value,
      );
      setStories((stories) => [...stories, story]);
      appendEntityCreationEventLog(story.id, "story", story.title);
      // Step 2: create the new tag assignments
      for (const tagId of selectedTagIds) {
        const tagAssignment = await createTagAssignment(tagId, story.id);
        setTagAssignments((tagAssignments) => [
          ...tagAssignments,
          tagAssignment,
        ]);
        appendEntityCreationEventLog(
          tagAssignment.id.toString(),
          "tag assignment",
          tagsById.get(tagAssignment.tag_id)?.title ?? "",
        );
        console.log("Created tag assignment", tagAssignment);
      }
      // Step 3: create the story relationship
      const storyRelationship = await createStoryRelationship(
        continuedStory.id,
        story.id,
        STORY_RELATIONSHIP.ContinuedBy,
      );
      setStoryRelationships((storyRelationships) => [
        ...storyRelationships,
        storyRelationship,
      ]);
      appendEntityCreationEventLog(
        storyRelationship.id.toString(),
        "story relationship",
        STORY_RELATIONSHIP.ContinuedBy,
      );
      console.log("Created story relationship", storyRelationship);
      // Step 4: move the unfinished tasks to the new story
      const tasksToUpdate = (
        tasksByStoryId.get(continuedStory.id) ?? []
      ).filter(
        (task) =>
          task.status === TASK_STATUS.BACKLOG ||
          task.status === TASK_STATUS.DOING,
      );
      for (const task of tasksToUpdate) {
        // TODO (2023.06.26): update API to return the updated task
        await updateTaskById(
          task.id,
          task.status,
          task.title,
          task.description,
          story.id,
        );
        setTasks((tasks) =>
          tasks.map((_task) =>
            _task.id === task.id ? { ..._task, story_id: story.id } : _task,
          ),
        );
        setTaskMoveProgress((prog) => {
          const prevNum = (prog * tasksToUpdate.length) / 100;
          return ((1 + prevNum) / tasksToUpdate.length) * 100;
        });
        appendEntityCreationEventLog(task.id, "task", task.title);
        console.log("Moved task", task.title);
      }
    })();
  }

  const disableButton = storyRelationships.some(
    (storyRelationship) =>
      storyRelationship.story_id_a === continuedStory.id &&
      storyRelationship.relation === STORY_RELATIONSHIP.ContinuedBy,
  );
  return (
    <>
      <button
        className="rounded-md bg-zinc-100 px-1 outline outline-1 hover:bg-zinc-400 dark:bg-zinc-900"
        style={
          disableButton
            ? {
                cursor: "not-allowed",
                opacity: "50%",
              }
            : {}
        }
        disabled={disableButton}
        onClick={() => {
          setOpen(true);
        }}
      >
        Copy to new story
      </button>
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="form-dialog-title"
      >
        <DialogTitle id="form-dialog-title">Create Story</DialogTitle>
        <DialogContent>
          <TextField
            inputRef={titleRef}
            label="Title"
            autoFocus
            fullWidth
            margin="dense"
            defaultValue={continuedStory.title}
            slotProps={{
              htmlInput: { maxLength: config?.story_title_max_len },
            }}
          />
          <TextField
            inputRef={descriptionRef}
            label="Description"
            multiline
            minRows={3}
            fullWidth
            margin="dense"
            defaultValue={continuedStory.description}
            slotProps={{
              htmlInput: { maxLength: config?.story_desc_max_len },
            }}
          />
          <FormControl fullWidth margin="dense">
            <InputLabel id="sprint-label">Parent Sprint</InputLabel>
            <Select
              inputRef={sprintIdRef}
              labelId="sprint-label"
              label="Parent Sprint"
              // default to latest sprint
              defaultValue={
                // sprints may not be set yet depending
                // on the order of rendering and data fetch
                sprints.length > 0 &&
                sprints.reduce((prev, curr) =>
                  new Date(prev.start_date).getTime() >
                  new Date(curr.start_date).getTime()
                    ? prev
                    : curr,
                ).id
              }
              margin="dense"
            >
              {sprints.length > 0 &&
                sprints
                  .sort(
                    (s0, s1) =>
                      new Date(s1.start_date).getTime() -
                      new Date(s0.start_date).getTime(),
                  )
                  .slice(0, 5)
                  .map((sprint) => (
                    <MenuItem key={sprint.id} value={sprint.id}>
                      {sprintToString(sprint)}
                    </MenuItem>
                  ))}
            </Select>
          </FormControl>
          {[...tagsById.values()].map((tag) => (
            <TagOption
              key={tag.id}
              tag={tag}
              checked={selectedTagIds.includes(tag.id)}
              onTagToggle={(tagId: string, checked: boolean) => {
                setSelectedTagIds((prev) => {
                  if (checked) return [...prev, tagId];
                  return prev.filter((id) => id !== tagId);
                });
              }}
            ></TagOption>
          ))}
          <Typography>
            This story will be a continuation of:{" "}
            <strong>{continuedStory.title}</strong>
          </Typography>
          <LinearProgress variant="determinate" value={taskMoveProgress} />
          <ul>
            {entityCreateEventLog.map((eue) => (
              <li key={eue.entityId}>{renderEntityUpdateEvent(eue)}</li>
            ))}
          </ul>
        </DialogContent>
        {renderDialogActions(handleClose, handleSave)}
      </Dialog>
    </>
  );
}

interface EntityCreationStationProps {
  stories: Story[] | undefined;
  sprints: Sprint[] | undefined;
  tagsById: Map<string, Tag>;
  selectedSprintId: string | null;
  sprintsById: Map<string, Sprint>;
  assocTagIdsByStoryId: Map<string, string[]>;
  config: Config | null;
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  setStories: React.Dispatch<React.SetStateAction<Story[]>>;
  setSprints: React.Dispatch<React.SetStateAction<Sprint[]>>;
  setTags: React.Dispatch<React.SetStateAction<Tag[]>>;
  setTagAssignments: React.Dispatch<React.SetStateAction<TagAssignment[]>>;
}

export default function EntityCreationStation({
  stories,
  sprints,
  tagsById,
  selectedSprintId,
  sprintsById,
  assocTagIdsByStoryId,
  config,
  setTasks,
  setStories,
  setSprints,
  setTags,
  setTagAssignments,
}: EntityCreationStationProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <CreateTask
        stories={stories}
        tagsById={tagsById}
        assocTagIdsByStoryId={assocTagIdsByStoryId}
        config={config}
        setTasks={setTasks}
      />
      <CreateStory
        tagsById={tagsById}
        sprints={sprints}
        selectedSprintId={selectedSprintId}
        config={config}
        setStories={setStories}
        setTagAssignments={setTagAssignments}
      />
      <CreateSprint config={config} setSprints={setSprints} />
      <CreateTag config={config} setTags={setTags} />
      <CreateBulkTask
        selectedSprintId={selectedSprintId}
        sprintsById={sprintsById}
        tagsById={tagsById}
        assocTagIdsByStoryId={assocTagIdsByStoryId}
        stories={stories}
        config={config}
        setTasks={setTasks}
      />
      <BatchUploadTask setTasks={setTasks} />
    </div>
  );
}
