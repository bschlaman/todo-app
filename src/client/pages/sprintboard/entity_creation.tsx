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
} from "@mui/material";
import React, { useRef, useState } from "react";
import {
  createTask,
  createStory,
  createSprint,
  createTagAssignment,
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
      {buttonText}{" "}
    </Button>
  );
}

function renderDialogActions(
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
}: {
  tags: Tag[];
  sprints: Sprint[] | undefined;
  selectedSprintId: string | null;
  setStories: React.Dispatch<React.SetStateAction<Story[]>>;
}) {
  const [open, setOpen] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const sprintIdRef = useRef<HTMLInputElement>(null);

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
            <InputLabel id="sprint-label">Parent Story</InputLabel>
            <Select
              inputRef={sprintIdRef}
              labelId="sprint-label"
              value={NULL_STORY_IDENTIFIER}
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

const createButtonStyles: React.CSSProperties = {
  outline: "1px solid lightgreen",
  borderRadius: "4px",
};

export function CreateSprint() {
  return <button style={createButtonStyles}>+ Sprint</button>;
}

export function CreateTag() {
  return <button style={createButtonStyles}>+ Tag</button>;
}

export function CreateBulkTask() {
  return <button style={createButtonStyles}>+ Bulk Task</button>;
}

interface EntityCreationStationProps {
  stories: Story[] | undefined;
  sprints: Sprint[] | undefined;
  tags: Tag[];
  selectedSprintId: string | null;
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
  setTasks,
  setStories,
  setSprints,
  setTags,
  setTagAssignments,
}: EntityCreationStationProps) {
  return (
    <>
      <CreateTask stories={stories} setTasks={setTasks} />
      <CreateStory
        tags={tags}
        sprints={sprints}
        selectedSprintId={selectedSprintId}
        setStories={setStories}
      />
      <CreateSprint />
      <CreateTag />
      <CreateBulkTask />
    </>
  );
}
