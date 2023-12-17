import { MenuItem, Select, SelectProps } from "@mui/material";
import React from "react";
import TagBadge from "./tag_badge";
import { Story, Tag } from "../ts/model/entities";
import { isActive } from "../ts/model/status";
import { NULL_STORY_IDENTIFIER } from "../ts/lib/common";

export function renderStorySelectMenuItem(
  story: Story,
  tagsById: Map<string, Tag>,
  assocTagIdsByStoryId: Map<string, string[]>
) {
  return (
    <>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          width: "8rem",
          marginRight: "1rem",
        }}
      >
        {assocTagIdsByStoryId.get(story.id)?.map((tagId) => {
          const tag = tagsById.get(tagId);
          if (tag === undefined) return <></>;
          return <TagBadge key={tagId} tag={tag} />;
        })}
      </div>
      {story.title}
    </>
  );
}

// TODO (2023.12.17): I think this is still not quite right
// 1) do I really need to extend SelectProps
// 2) is labelId="parent-story-label" working correctly
interface StorySelectProps extends SelectProps {
  storyId: string;
  setStoryId: React.Dispatch<React.SetStateAction<string>>;
  stories: Story[] | undefined;
  tagsById: Map<string, Tag>;
  assocTagIdsByStoryId: Map<string, string[]>;
}

export function StorySelect({
  storyId,
  setStoryId,
  stories,
  tagsById,
  assocTagIdsByStoryId,
}: StorySelectProps) {
  return (
    <Select
      value={storyId}
      onChange={(e) => {
        setStoryId(e.target.value);
      }}
      SelectDisplayProps={{
        style: {
          display: "flex",
          alignItems: "center",
        },
      }}
    >
      <MenuItem style={{ marginLeft: "9rem" }} value={NULL_STORY_IDENTIFIER}>
        <strong>{NULL_STORY_IDENTIFIER}</strong>
      </MenuItem>
      {stories?.map((story) => (
        // MenuItem must be a direct descendant of Select,
        // so I can't make this it's own component
        <MenuItem
          key={story.id}
          value={story.id}
          style={{ borderBottom: "1px solid #ddd" }}
          disabled={!isActive(story)}
        >
          {renderStorySelectMenuItem(story, tagsById, assocTagIdsByStoryId)}
        </MenuItem>
      ))}
    </Select>
  );
}
