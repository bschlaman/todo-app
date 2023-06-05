import React, { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import CopyToClipboardButton from "../../components/copy_to_clipboard_button";
import { Sprint, Story, Tag, TagAssignment } from "../../ts/model/entities";
import { TagOption } from "./tag_selectors";
import { sprintToString } from "../../ts/lib/utils";
import { createTagAssignment, destroyTagAssignment } from "../../ts/lib/api";

export default function StoryCard({
  story,
  sprints,
  tagsById,
  tagAssignments,
  setTagAssignments,
}: {
  story: Story;
  sprints: Sprint[];
  tagsById: Map<string, Tag>;
  tagAssignments: TagAssignment[];
  setTagAssignments: React.Dispatch<React.SetStateAction<TagAssignment[]>>;
}) {
  const [selectedSprintId, setSelectedSprintId] = useState("");
  const storyPageRef = `/story/${story.id}`;

  const selectedTagIds = useMemo(
    () =>
      tagAssignments
        .filter((ta) => ta.story_id === story.id)
        .map((ta) => ta.tag_id),
    [tagAssignments, story]
  );

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
        {sprints
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
      {Array.from(tagsById).map(([, tag]) => (
        <TagOption
          key={tag.id}
          tag={tag}
          checked={selectedTagIds.includes(tag.id)}
          onTagToggle={handleStoryCardTagChange}
        ></TagOption>
      ))}
    </div>
  );
}
