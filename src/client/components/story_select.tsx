import { MenuItem } from "@mui/material";
import React from "react";
import TagBadge from "./tag_badge";
import { Story, Tag } from "../ts/model/entities";

export function renderStorySelectItems(
  stories: Story[] | undefined,
  tagsById: Map<string, Tag>,
  assocTagIdsByStoryId: Map<string, string[]>
) {
  return stories?.map((story) => (
    <MenuItem
      style={{ borderBottom: "1px solid #ddd" }}
      key={story.id}
      value={story.id}
    >
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
    </MenuItem>
  ));
}
