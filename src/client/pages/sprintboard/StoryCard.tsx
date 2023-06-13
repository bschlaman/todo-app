import React, { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import CopyToClipboardButton from "../../components/copy_to_clipboard_button";
import {
  Sprint,
  Story,
  StoryRelationship,
  Tag,
  TagAssignment,
  STORY_RELATIONSHIP,
  Task,
} from "../../ts/model/entities";
import { TagOption } from "./tag_selectors";
import { sprintToString } from "../../ts/lib/utils";
import {
  createStory,
  createStoryRelationship,
  createTagAssignment,
  destroyTagAssignment,
} from "../../ts/lib/api";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import { renderDialogActions } from "./entity_creation";

export default function StoryCard({
  story,
  storiesById,
  sprintsById,
  tasksByStoryId,
  tagsById,
  tagAssignments,
  storyRelationships,
  setStories,
  setTagAssignments,
  setStoryRelationships,
}: {
  story: Story;
  storiesById: Map<string, Story>;
  sprintsById: Map<string, Sprint>;
  tasksByStoryId: Map<string, Task[]>;
  tagsById: Map<string, Tag>;
  tagAssignments: TagAssignment[];
  storyRelationships: StoryRelationship[];
  setStories: React.Dispatch<React.SetStateAction<Story[]>>;
  setTagAssignments: React.Dispatch<React.SetStateAction<TagAssignment[]>>;
  setStoryRelationships: React.Dispatch<
    React.SetStateAction<StoryRelationship[]>
  >;
}) {
  const metadataFontSize = "0.8rem";
  const [selectedSprintId, setSelectedSprintId] = useState("");
  const storyPageRef = `/story/${story.id}`;

  const selectedTagIds = useMemo(
    () =>
      tagAssignments
        .filter((ta) => ta.story_id === story.id)
        .map((ta) => ta.tag_id),
    [tagAssignments, story]
  );

  function renderStoryRelationshipsTable() {
    let continues;
    let continuedBy;
    for (const storyRelationship of storyRelationships) {
      if (storyRelationship.relation !== STORY_RELATIONSHIP.ContinuedBy)
        continue;
      if (storyRelationship.story_id_b === story.id)
        continues = storiesById.get(storyRelationship.story_id_a);
      if (storyRelationship.story_id_a === story.id)
        continuedBy = storiesById.get(storyRelationship.story_id_b);
    }
    return (
      <table style={{ fontSize: metadataFontSize }}>
        <tbody>
          {continues != null && (
            <tr>
              <td>Continues in sprint</td>
              <td>
                <strong>
                  {sprintsById.get(continues.sprint_id ?? "")?.title}
                </strong>
              </td>
              <td>
                <em>
                  <strong>{continues?.title}</strong>
                </em>
              </td>
            </tr>
          )}
          {continuedBy != null && (
            <tr>
              <td>Continued in sprint</td>
              <td>
                <strong>
                  {sprintsById.get(continuedBy.sprint_id ?? "")?.title}
                </strong>
              </td>
              <td>
                <em>
                  <strong>{continuedBy?.title}</strong>
                </em>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    );
  }

  function handleStoryCardTagChange(tagId: string, checked: boolean) {
    void (async () => {
      // make the API call and then update tagAssignments
      if (checked) {
        const tagAssignment = await createTagAssignment(tagId, story.id);
        setTagAssignments((tagAssignments) => [
          ...tagAssignments,
          tagAssignment,
        ]);
      } else {
        await destroyTagAssignment(tagId, story.id);
        setTagAssignments((tagAssignments) =>
          tagAssignments.filter(
            (ta) => ta.tag_id !== tagId || ta.story_id !== story.id
          )
        );
      }
    })();
  }

  return (
    <div
      style={{
        position: "relative",
        borderRadius: "5px",
        padding: "1.2rem 1rem 1rem 1rem",
        background: "#ebeded",
        maxWidth: "30%",
        boxShadow: "3px 3px 2px darkgrey",
      }}
    >
      <h3>{story.title}</h3>
      <div
        style={{
          position: "absolute",
          top: "10px",
          left: "10px",
        }}
      >
        <CopyToClipboardButton value={storyPageRef}></CopyToClipboardButton>
      </div>
      <a
        style={{
          position: "absolute",
          top: "10px",
          right: "10px",
        }}
        href={storyPageRef}
      >
        Edit
      </a>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {story.description}
      </ReactMarkdown>
      {Array.from(tagsById).map(([, tag]) => (
        <TagOption
          key={tag.id}
          tag={tag}
          checked={selectedTagIds.includes(tag.id)}
          onTagToggle={handleStoryCardTagChange}
        ></TagOption>
      ))}
      {
        // TODO (2023.06.02): make this a function, since it is
        // used in more than one place
      }
      <select
        onChange={(e) => {
          setSelectedSprintId(e.target.value);
        }}
        value={selectedSprintId ?? ""}
      >
        {Array.from(sprintsById.values())
          .sort(
            (s0, s1) =>
              new Date(s1.start_date).getTime() -
              new Date(s0.start_date).getTime()
          )
          .slice(0, 5)
          .map((sprint) => {
            return (
              <option key={sprint.id} value={sprint.id}>
                {sprintToString(sprint)}
              </option>
            );
          })}
      </select>
      <div style={{ fontSize: metadataFontSize }}>
        <p>
          <strong>Tasks in this story</strong>
        </p>
        <ul>
          {tasksByStoryId
            .get(story.id)
            ?.sort((a, b) => a.status.localeCompare(b.status))
            .map((task) => (
              <li key={task.id}>
                <p style={{ display: "inline", color: "grey" }}>
                  ({task.status}){" "}
                </p>
                {task.title}
              </li>
            ))}
        </ul>
      </div>
      {renderStoryRelationshipsTable()}
      <CopyToNewStory
        continuedStory={story}
        sprints={[...sprintsById.values()]}
        tags={[...tagsById.values()]}
        tagAssignments={tagAssignments}
        setStories={setStories}
        setTagAssignments={setTagAssignments}
        setStoryRelationships={setStoryRelationships}
      />
    </div>
  );
}

// TODO (2023.06.11): should this be in entity_creation?
function CopyToNewStory({
  continuedStory,
  sprints,
  tags,
  tagAssignments,
  setStories,
  setTagAssignments,
  setStoryRelationships,
}: {
  continuedStory: Story;
  sprints: Sprint[];
  tags: Tag[];
  tagAssignments: TagAssignment[];
  setStories: React.Dispatch<React.SetStateAction<Story[]>>;
  setTagAssignments: React.Dispatch<React.SetStateAction<TagAssignment[]>>;
  setStoryRelationships: React.Dispatch<
    React.SetStateAction<StoryRelationship[]>
  >;
}) {
  const [open, setOpen] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const sprintIdRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) titleRef.current?.focus();
  }, [open]);

  useEffect(
    () =>
      setSelectedTagIds(
        tagAssignments
          .filter((ta) => ta.story_id === continuedStory.id)
          .map((ta) => ta.tag_id)
      ),
    [tagAssignments, continuedStory]
  );

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
      const storyRelationship = await createStoryRelationship(
        continuedStory.id,
        story.id,
        STORY_RELATIONSHIP.ContinuedBy
      );
      setStoryRelationships((storyRelationships) => [
        ...storyRelationships,
        storyRelationship,
      ]);
      console.log("Created story relationship", storyRelationship);
      handleClose();
    })();
  }

  return (
    <>
      <button
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
          />
          <TextField
            inputRef={descriptionRef}
            label="Description"
            multiline
            minRows={3}
            fullWidth
            margin="dense"
            defaultValue={continuedStory.description}
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
                    : curr
                ).id
              }
              margin="dense"
            >
              {sprints.length > 0 &&
                sprints
                  .sort(
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
          <Typography>
            This story will be a continuation of:{" "}
            <strong>{continuedStory.title}</strong>
          </Typography>
        </DialogContent>
        {renderDialogActions(handleClose, handleSave)}
      </Dialog>
    </>
  );
}
