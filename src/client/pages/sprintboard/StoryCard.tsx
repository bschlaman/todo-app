import React, { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import CopyToClipboardButton from "../../components/copy_to_clipboard_button";
import { Story, Tag } from "../../ts/model/entities";
import { TagOption } from "./tag_selectors";

export default function StoryCard({
  story,
  tagsById,
  assocTagIdsByStoryId,
}: {
  story: Story;
  tagsById: Map<string, Tag>;
  assocTagIdsByStoryId: Map<string, string[]>;
}) {
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
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
        outline: "2px solid grey",
        padding: "1.2rem 1rem 1rem 1rem",
        background: "lightgrey",
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
