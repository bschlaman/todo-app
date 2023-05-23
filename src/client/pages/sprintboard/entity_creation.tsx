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
} from "@mui/material";
import React, { useRef, useState } from "react";
import { createTask } from "../../ts/lib/api";
import { Story } from "../../ts/model/entities";
import { NULL_STORY_IDENTIFIER } from "../../ts/lib/common";

const createButtonStyles: React.CSSProperties = {
  outline: "1px solid lightgreen",
  borderRadius: "4px",
};

export function CreateTask({ stories }: { stories: Story[] | undefined }) {
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
      await createTask(
        titleRef.current.value,
        descriptionRef.current.value,
        storyIdRef.current.value,
        false
      );
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
            ref={titleRef}
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
            <Select
              ref={storyIdRef}
              label="Parent Story"
              value={NULL_STORY_IDENTIFIER}
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

export default function EntityCreationStation({
  stories,
}: {
  stories: Story[] | undefined;
}) {
  return (
    <>
      <CreateTask stories={stories} />
      <CreateStory />
      <CreateSprint />
      <CreateTag />
      <CreateBulkTask />
    </>
  );
}
