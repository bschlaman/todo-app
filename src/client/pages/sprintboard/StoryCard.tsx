import React, { useMemo, useState } from "react";
import CopyToClipboardButton from "../../components/copy_to_clipboard_button";
import {
  Sprint,
  Story,
  StoryRelationship,
  Tag,
  TagAssignment,
  STORY_RELATIONSHIP,
  Task,
  STORY_STATUS,
  Config,
} from "../../ts/model/entities";
import { TagOption } from "./tag_selectors";
import { sprintToString } from "../../ts/lib/utils";
import {
  createTagAssignment,
  destroyTagAssignment,
  updateStoryById,
} from "../../ts/lib/api";
import { CopyToNewStory } from "./entity_creation";
import ReactMarkdownCustom from "../../components/markdown";

export default function StoryCard({
  story,
  storiesById,
  sprintsById,
  tasksByStoryId,
  tagsById,
  tagAssignments,
  storyRelationships,
  selected,
  setTasks,
  setStories,
  setTagAssignments,
  setStoryRelationships,
  config,
}: {
  story: Story;
  storiesById: Map<string, Story>;
  sprintsById: Map<string, Sprint>;
  tasksByStoryId: Map<string, Task[]>;
  tagsById: Map<string, Tag>;
  tagAssignments: TagAssignment[];
  storyRelationships: StoryRelationship[];
  selected: boolean;
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  setStories: React.Dispatch<React.SetStateAction<Story[]>>;
  setTagAssignments: React.Dispatch<React.SetStateAction<TagAssignment[]>>;
  setStoryRelationships: React.Dispatch<
    React.SetStateAction<StoryRelationship[]>
  >;
  config: Config | null;
}) {
  const metadataFontSize = "0.8rem";
  const [selectedSprintId, setSelectedSprintId] = useState(story.sprint_id);
  const storyPageRef = `/story/${story.id}`;
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [title, setTitle] = useState(story.title);
  const [description, setDescription] = useState(story.description);

  const selectedTagIds = useMemo(
    () =>
      tagAssignments
        .filter((ta) => ta.story_id === story.id)
        .map((ta) => ta.tag_id),
    [tagAssignments, story],
  );

  // this function should be a mirror of handleTaskUpdate.
  // consider moving to a util along with updateTaskStatusById
  async function handleStoryUpdate(updatedStory: Story) {
    if (story === null) return;
    if (Object.keys(updatedStory).length !== Object.keys(story).length)
      throw Error("updated story has incorrect number of keys");

    // return early if there is nothing to update
    let diff = false;
    for (const key in story) {
      if (
        story[key as keyof typeof story] ===
        updatedStory[key as keyof typeof updatedStory]
      )
        continue;
      diff = true;
      break;
    }
    if (!diff) return;

    await updateStoryById(
      updatedStory.id,
      updatedStory.status,
      updatedStory.title,
      updatedStory.description,
      updatedStory.sprint_id,
    );
    setStories((stories) =>
      stories.map((s) => (s.id === story.id ? updatedStory : s)),
    );
  }

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

    // Probably unecessary to do it this way instead of
    // just creating the table explicitly,
    // but hey, premature optimization is my middle name
    const storyRelTableRows: Array<[Story | undefined, string]> = [
      [continues, "⏪"],
      [continuedBy, "⏩"],
    ];

    return (
      <table style={{ fontSize: metadataFontSize }}>
        <tbody>
          {storyRelTableRows
            .filter(([relStory, _]) => relStory !== undefined)
            .map(([relStory, emoji]) => (
              <tr key={relStory?.id}>
                <td style={{ whiteSpace: "nowrap", fontWeight: "lighter" }}>
                  {emoji} {sprintsById.get(relStory?.sprint_id ?? "")?.title}
                </td>
                <td style={{ paddingLeft: "0.8rem" }}>
                  <em>
                    <strong>{relStory?.title}</strong>
                  </em>
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    );
  }

  function renderArchiveButton() {
    return (
      <button
        onClick={() => {
          void (async () => {
            if (!window.confirm("Archive this story?")) return;
            const updatedStory = { ...story, status: STORY_STATUS.ARCHIVE };
            await handleStoryUpdate(updatedStory);
          })();
        }}
      >
        Archive
      </button>
    );
  }

  async function handleStoryCardTagChange(tagId: string, checked: boolean) {
    // make the API call and then update tagAssignments
    if (checked) {
      const tagAssignment = await createTagAssignment(tagId, story.id);
      setTagAssignments((tagAssignments) => [...tagAssignments, tagAssignment]);
    } else {
      await destroyTagAssignment(tagId, story.id);
      setTagAssignments((tagAssignments) =>
        tagAssignments.filter(
          (ta) => ta.tag_id !== tagId || ta.story_id !== story.id,
        ),
      );
    }
  }

  return (
    <div
      // storyURIFragment
      id={story.id}
      style={{
        position: "relative",
        borderRadius: "5px",
        padding: "1.2rem 1rem 1rem 1rem",
        background: "#ebeded",
        maxWidth: "30%",
        boxShadow: selected
          ? "0 0 4px 4px rgba(255, 70, 50, 0.7)"
          : "3px 3px 2px darkgrey",
      }}
    >
      {isEditingTitle ? (
        <div style={{ marginTop: "2rem", display: "flex", gap: "2rem" }}>
          <textarea
            style={{
              fontSize: "1rem",
              resize: "none",
            }}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={config?.story_title_max_len}
          />
          <button
            onClick={() => {
              setIsEditingTitle(false);
              void handleStoryUpdate({ ...story, title });
            }}
          >
            Save
          </button>
        </div>
      ) : (
        <h3 onDoubleClick={() => setIsEditingTitle(true)}>{title}</h3>
      )}
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
        title="Edit"
      >
        📝
      </a>
      {isEditingDescription ? (
        <div style={{ marginTop: "2rem", display: "flex", gap: "2rem" }}>
          <textarea
            style={{ fontSize: "1rem" }}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={config?.story_desc_max_len}
          />
          <button
            onClick={() => {
              setIsEditingDescription(false);
              void handleStoryUpdate({ ...story, description });
            }}
          >
            Save
          </button>
        </div>
      ) : (
        <div onDoubleClick={() => setIsEditingDescription(true)}>
          <ReactMarkdownCustom content={story.description} />
        </div>
      )}
      {Array.from(tagsById).map(([, tag]) => (
        <TagOption
          key={tag.id}
          tag={tag}
          checked={selectedTagIds.includes(tag.id)}
          // linter complains if void call not wrapped in {}
          onTagToggle={(tagId: string, checked: boolean) => {
            void handleStoryCardTagChange(tagId, checked);
          }}
        ></TagOption>
      ))}
      {
        // TODO (2023.06.02): make this a function, since it is
        // used in more than one place
      }
      <select
        onChange={(e) => {
          setSelectedSprintId(e.target.value);
          void (async () => {
            const updatedStory = { ...story, sprint_id: e.target.value };
            await updateStoryById(
              updatedStory.id,
              updatedStory.status,
              updatedStory.title,
              updatedStory.description,
              updatedStory.sprint_id,
            );
            setStories((stories) =>
              stories.map((s) => (s.id === story.id ? updatedStory : s)),
            );
          })();
        }}
        value={selectedSprintId}
      >
        {Array.from(sprintsById.values())
          .sort(
            (s0, s1) =>
              new Date(s1.start_date).getTime() -
              new Date(s0.start_date).getTime(),
          )
          .slice(0, 5)
          .map((sprint) => (
            <option key={sprint.id} value={sprint.id}>
              {sprintToString(sprint)}
            </option>
          ))}
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
        tasksByStoryId={tasksByStoryId}
        tagsById={tagsById}
        tagAssignments={tagAssignments}
        setTasks={setTasks}
        setStories={setStories}
        setTagAssignments={setTagAssignments}
        setStoryRelationships={setStoryRelationships}
        config={config}
      />
      {renderArchiveButton()}
    </div>
  );
}
