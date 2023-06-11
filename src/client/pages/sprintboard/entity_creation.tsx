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
  setTasks,
}: {
  stories: Story[] | undefined;
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
              <MenuItem value={NULL_STORY_IDENTIFIER}>
                {NULL_STORY_IDENTIFIER}
              </MenuItem>
              {stories?.map((story) => (
                <MenuItem key={story.id} value={story.id}>
                  {story.title}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        {renderDialogActions(handleClose, handleSave)}
      </Dialog>
    </>
  );
}

export function CreateStory({
  tags,
  sprints,
  selectedSprintId,
  setStories,
  setTagAssignments,
}: {
  tags: Tag[];
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
              value={selectedSprintId}
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
          {tags.map((tag) => (
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
  sprintsById,
  setTasks,
}: {
  stories: Story[] | undefined;
  selectedSprintId: string | null;
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
              <MenuItem value={NULL_STORY_IDENTIFIER}>
                {NULL_STORY_IDENTIFIER}
              </MenuItem>
              {stories?.map((story) => (
                <MenuItem key={story.id} value={story.id}>
                  {story.title}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        {renderDialogActions(handleClose, handleSave)}
      </Dialog>
    </>
  );
}

interface EntityCreationStationProps {
  stories: Story[] | undefined;
  sprints: Sprint[] | undefined;
  tags: Tag[];
  selectedSprintId: string | null;
  sprintsById: Map<string, Sprint>;
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  setStories: React.Dispatch<React.SetStateAction<Story[]>>;
  setSprints: React.Dispatch<React.SetStateAction<Sprint[]>>;
  setTags: React.Dispatch<React.SetStateAction<Tag[]>>;
  setTagAssignments: React.Dispatch<React.SetStateAction<TagAssignment[]>>;
}

export default function EntityCreationStation({
  stories,
  sprints,
  tags,
  selectedSprintId,
  sprintsById,
  setTasks,
  setStories,
  setSprints,
  setTags,
  setTagAssignments,
}: EntityCreationStationProps) {
  return (
    <div style={{ display: "flex", gap: "1rem" }}>
      <CreateTask stories={stories} setTasks={setTasks} />
      <CreateStory
        tags={tags}
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
        stories={stories}
        setTasks={setTasks}
      />
    </div>
  );
}
