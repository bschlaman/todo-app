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
  TextareaAutosize,
  InputLabel,
} from "@mui/material";
import React, { useRef, useState } from "react";
import { createTask } from "../../ts/lib/api";
import {
  Sprint,
  Story,
  Tag,
  TagAssignment,
  Task,
} from "../../ts/model/entities";
import { NULL_STORY_IDENTIFIER } from "../../ts/lib/common";

const createButtonStyles: React.CSSProperties = {
  outline: "1px solid lightgreen",
  borderRadius: "4px",
};

export function CreateTask({
  stories,
  setTasks,
}: {
  stories: Story[] | undefined;
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
}) {
  const [open, setOpen] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const storyIdRef = useRef<HTMLInputElement>(null);

  function handleClickOpen() {
    setOpen(true);
  }

  function handleClose() {
    setOpen(false);
  }

  function handleSave() {
    void (async () => {
      if (titleRef.current === null) return;
      if (descriptionRef.current === null) return;
      if (storyIdRef.current === null) return;
      const task = await createTask(
        titleRef.current.value,
        descriptionRef.current.value,
        storyIdRef.current.value === NULL_STORY_IDENTIFIER
          ? null
          : storyIdRef.current.value,
        false
      );
      setTasks((tasks) => [...tasks, task]);
      handleClose();
    })();
  }

  return (
    <>
      <Button variant="contained" color="primary" onClick={handleClickOpen}>
        + Task
      </Button>
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="form-dialog-title"
      >
        <DialogTitle id="form-dialog-title">Create Task</DialogTitle>
        <DialogContent>
          <TextField
            inputRef={titleRef}
            autoFocus
            name="title"
            label="Title"
            type="text"
            fullWidth
            margin="dense"
          />
          <TextareaAutosize
            ref={descriptionRef}
            name="description"
            minRows={3}
          />
          <FormControl fullWidth>
            <InputLabel id="parent-story-label">Parent Story</InputLabel>
            <Select
              inputRef={storyIdRef}
              labelId="parent-story-label"
              value={NULL_STORY_IDENTIFIER}
              margin="dense"
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
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSave} color="primary">
            Submit
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export function CreateStory() {
  return <button style={createButtonStyles}>+ Story</button>;
}

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
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  setStories: React.Dispatch<React.SetStateAction<Story[]>>;
  setSprints: React.Dispatch<React.SetStateAction<Sprint[]>>;
  setTags: React.Dispatch<React.SetStateAction<Tag[]>>;
  setTagAssignments: React.Dispatch<React.SetStateAction<TagAssignment[]>>;
}
export default function EntityCreationStation({
  stories,
  setTasks,
  setStories,
  setSprints,
  setTags,
  setTagAssignments,
}: EntityCreationStationProps) {
  return (
    <>
      <CreateTask stories={stories} setTasks={setTasks} />
      <CreateStory />
      <CreateSprint />
      <CreateTag />
      <CreateBulkTask />
    </>
  );
}
