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
} from "@mui/material";
import React, { useEffect, useRef, useState } from "react";
import {
  createTask,
  createStory,
  createSprint,
  createTagAssignment,
  createTag,
} from "../../ts/lib/api";
import {
  Sprint,
  Story,
  Tag,
  TagAssignment,
  Task,
} from "../../ts/model/entities";
import { NULL_STORY_IDENTIFIER } from "../../ts/lib/common";
import { TagOption } from "./tag_selectors";
import { sprintToString } from "../../ts/lib/utils";
import { DatePicker } from "@mui/x-date-pickers";
import { renderStorySelectItems } from "../../components/story_select";
import DownloadCSVButton from "../../components/download_csv";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DoneIcon from "@mui/icons-material/Done";
import { TASK_CREATE_ATTRIBUTES } from "../../ts/model/constants";
import ProtoTaskTable, { ProtoTask } from "../../components/task_table";

function renderCreationButton(
  buttonText: string,
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
) {
  return (
    <Button
      variant="contained"
      color="primary"
      onClick={() => {
        setOpen(true);
      }}
    >
      {buttonText}
    </Button>
  );
}

export function renderDialogActions(
  handleClose: React.MouseEventHandler<HTMLButtonElement>,
  handleSave: React.MouseEventHandler<HTMLButtonElement>
) {
  return (
    <DialogActions>
      <Button onClick={handleClose}>Cancel</Button>
      <Button onClick={handleSave} color="primary">
        Create
      </Button>
    </DialogActions>
  );
}

export function CreateTask({
  stories,
  tagsById,
  assocTagIdsByStoryId,
  setTasks,
}: {
  stories: Story[] | undefined;
  tagsById: Map<string, Tag>;
  assocTagIdsByStoryId: Map<string, string[]>;
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
}) {
  const [open, setOpen] = useState(false);
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
    void (async () => {
      if (titleRef.current === null) return;
      if (descriptionRef.current === null) return;
      const task = await createTask(
        titleRef.current.value,
        descriptionRef.current.value,
        storyId === NULL_STORY_IDENTIFIER ? null : storyId,
        false
      );
      setTasks((tasks) => [...tasks, task]);
      handleClose();
    })();
  }

  return (
    <>
      {renderCreationButton("+ Task", setOpen)}
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="form-dialog-title"
      >
        <DialogTitle id="form-dialog-title">Create Task</DialogTitle>
        <DialogContent>
          <TextField
            inputRef={titleRef}
            name="title" // would be used for event handling
            label="Title"
            autoFocus
            fullWidth
            margin="dense"
          />
          <TextField
            inputRef={descriptionRef}
            name="description" // would be used for event handling
            label="Description"
            multiline
            minRows={3}
            fullWidth
            margin="dense"
          />
          <FormControl fullWidth margin="dense">
            <InputLabel id="parent-story-label">Parent Story</InputLabel>
            <Select
              labelId="parent-story-label"
              label="Parent Story"
              value={storyId}
              margin="dense"
              onChange={(e) => {
                setStoryId(e.target.value);
              }}
            >
              <MenuItem
                style={{ marginLeft: "9rem" }}
                value={NULL_STORY_IDENTIFIER}
              >
                <strong>{NULL_STORY_IDENTIFIER}</strong>
              </MenuItem>
              {/* I couldn't figure out how to also return the NULL_STORY menu item
              from renderStorySelectItems; MUI Select doesn't seem to like receiving fragemnts. */}
              {renderStorySelectItems(stories, tagsById, assocTagIdsByStoryId)}
            </Select>
          </FormControl>
        </DialogContent>
        {renderDialogActions(handleClose, handleSave)}
      </Dialog>
    </>
  );
}

export function CreateStory({
  tagsById,
  sprints,
  selectedSprintId,
  setStories,
  setTagAssignments,
}: {
  tagsById: Map<string, Tag>;
  sprints: Sprint[] | undefined;
  selectedSprintId: string | null;
  setStories: React.Dispatch<React.SetStateAction<Story[]>>;
  setTagAssignments: React.Dispatch<React.SetStateAction<TagAssignment[]>>;
}) {
  const [open, setOpen] = useState(false);
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
    void (async () => {
      if (titleRef.current === null) return;
      if (descriptionRef.current === null) return;
      if (sprintIdRef.current === null) return;
      const story = await createStory(
        titleRef.current.value,
        descriptionRef.current.value,
        sprintIdRef.current.value
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
    })();
  }

  return (
    <>
      {renderCreationButton("+ Story", setOpen)}
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="form-dialog-title"
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
          />
          <TextField
            inputRef={descriptionRef}
            name="description" // would be used for event handling
            label="Description"
            multiline
            minRows={3}
            fullWidth
            margin="dense"
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
                    new Date(s0.start_date).getTime()
                )
                .slice(0, 5)
                .map((sprint) => {
                  return (
                    <MenuItem key={sprint.id} value={sprint.id}>
                      {sprintToString(sprint)}
                    </MenuItem>
                  );
                })}
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
        {renderDialogActions(handleClose, handleSave)}
      </Dialog>
    </>
  );
}

export function CreateSprint({
  setSprints,
}: {
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
      const sprint = await createSprint(
        titleRef.current.value,
        new Date(startDateRef.current.value),
        new Date(endDateRef.current.value)
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
  setTags,
}: {
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
        descriptionRef.current.value
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
          />
          <TextField
            inputRef={descriptionRef}
            name="description" // would be used for event handling
            label="Description"
            multiline
            minRows={3}
            fullWidth
            margin="dense"
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
  setTasks,
}: {
  stories: Story[] | undefined;
  selectedSprintId: string | null;
  tagsById: Map<string, Tag>;
  assocTagIdsByStoryId: Map<string, string[]>;
  sprintsById: Map<string, Sprint>;
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
        storyId === NULL_STORY_IDENTIFIER ? null : storyId
      );
      handleClose();
    })();
  }

  async function bulkCreateTask(
    commonTitle: string,
    commonDescription: string,
    storyId: string | null
  ) {
    const sprint = sprintsById.get(selectedSprintId ?? "");
    if (sprint === undefined) return;
    const sprintStart = new Date(sprint.start_date);
    const sprintEnd = new Date(sprint.end_date);
    for (
      const d = sprintStart;
      // eslint-disable-next-line no-unmodified-loop-condition
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
        true
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
          />
          <Typography variant="caption" margin="dense">
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
          />
          <FormControl fullWidth margin="dense">
            <InputLabel id="parent-story-label">Parent Story</InputLabel>
            <Select
              labelId="parent-story-label"
              label="Parent Story"
              value={storyId}
              margin="dense"
              onChange={(e) => {
                setStoryId(e.target.value);
              }}
            >
              <MenuItem
                style={{ marginLeft: "9rem" }}
                value={NULL_STORY_IDENTIFIER}
              >
                <strong>{NULL_STORY_IDENTIFIER}</strong>
              </MenuItem>
              {/* I couldn't figure out how to also return the NULL_STORY menu item
              from renderStorySelectItems; MUI Select doesn't seem to like receiving fragemnts. */}
              {renderStorySelectItems(stories, tagsById, assocTagIdsByStoryId)}
            </Select>
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

  const handleUpload = () => {
    if (file === null) return;

    const reader = new FileReader();

    // TODO (2023.07.16): use a lib like papaparse for this
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      const lines = text.split("\n");

      if (lines.length < 2) {
        setErrorMsg("Not enough lines!");
        return;
      }
      if (lines[0] !== TASK_CREATE_ATTRIBUTES.join(",")) {
        setErrorMsg(`CSV is malformed: ${String(lines[0])}`);
        return;
      }
      console.log(lines);

      for (const line of lines.slice(1)) {
        const attrs = line.split(",");
        // blank lines, etc.
        if (attrs.length !== TASK_CREATE_ATTRIBUTES.length) continue;
        // the "" case will be rejected by the API call
        const storyId = attrs[0] ?? "";
        const title = attrs[1] ?? "";
        const description = attrs[2] ?? "";
        setTasksToCreate((ptasks) => [
          ...ptasks,
          { storyId, title, description, created: false },
        ]);
      }
    };

    reader.readAsText(file);
  };

  function batchCreateTasks() {
    void (async () => {
      for (const ptask of tasksToCreate) {
        const task = await createTask(
          ptask.title,
          ptask.description,
          ptask.storyId,
          false
        );
        setTasks((tasks) => [...tasks, task]);
        setTasksToCreate((ptasks) =>
          ptasks.map((ptask) =>
            ptask.title === task.title && ptask.description === task.description
              ? { ...ptask, created: true }
              : ptask
          )
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
      >
        <DialogTitle id="form-dialog-title">Batch Task Upload</DialogTitle>
        <DialogContent>
          <Typography margin="dense">
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
                  e.target.files?.[0] !== undefined ? e.target.files[0] : null
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

interface EntityCreationStationProps {
  stories: Story[] | undefined;
  sprints: Sprint[] | undefined;
  tagsById: Map<string, Tag>;
  selectedSprintId: string | null;
  sprintsById: Map<string, Sprint>;
  assocTagIdsByStoryId: Map<string, string[]>;
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
  setTasks,
  setStories,
  setSprints,
  setTags,
  setTagAssignments,
}: EntityCreationStationProps) {
  return (
    <div style={{ display: "flex", gap: "1rem" }}>
      <CreateTask
        stories={stories}
        tagsById={tagsById}
        assocTagIdsByStoryId={assocTagIdsByStoryId}
        setTasks={setTasks}
      />
      <CreateStory
        tagsById={tagsById}
        sprints={sprints}
        selectedSprintId={selectedSprintId}
        setStories={setStories}
        setTagAssignments={setTagAssignments}
      />
      <CreateSprint setSprints={setSprints} />
      <CreateTag setTags={setTags} />
      <CreateBulkTask
        selectedSprintId={selectedSprintId}
        sprintsById={sprintsById}
        tagsById={tagsById}
        assocTagIdsByStoryId={assocTagIdsByStoryId}
        stories={stories}
        setTasks={setTasks}
      />
      <BatchUploadTask setTasks={setTasks} />
    </div>
  );
}
