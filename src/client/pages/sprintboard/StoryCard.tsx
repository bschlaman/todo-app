import React, { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import CopyToClipboardButton from "../../components/copy_to_clipboard_button";
import { Sprint, Story, Tag } from "../../ts/model/entities";
import { TagOption } from "./tag_selectors";
import { sprintToString } from "../../ts/lib/utils";

export default function StoryCard({
  story,
  sprints,
  tagsById,
  assocTagIdsByStoryId,
}: {
  story: Story;
  sprints: Sprint[];
  tagsById: Map<string, Tag>;
  assocTagIdsByStoryId: Map<string, string[]>;
}) {
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [selectedSprintId, setSelectedSprintId] = useState("");
  const storyPageRef = `/story/${story.id}`;

  useEffect(() => {
    for (const [storyId, tagIds] of assocTagIdsByStoryId) {
      if (storyId !== story.id) continue;
      setSelectedTagIds(tagIds);
    }
  }, [assocTagIdsByStoryId, story]);

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
          onTagToggle={(tagId: string, checked: boolean) => {
            setSelectedTagIds((prev) => {
              if (checked) return [...prev, tagId];
              return prev.filter((id) => id !== tagId);
            });
          }}
        ></TagOption>
      ))}
    </div>
  );
}
