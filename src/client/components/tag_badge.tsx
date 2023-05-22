import React from "react";
import { TAG_COLORS } from "../ts/lib/common";
import { Tag } from "../ts/model/entities";

export function renderTagBadgesForStoryId(
  storyId: string,
  tagsById: Map<string, Tag>,
  assocTagIdsByStoryId: Map<string, string[]>
) {
  const tagBadges: JSX.Element[] = [];
  assocTagIdsByStoryId.get(storyId)?.forEach((tagId) => {
    const tag = tagsById.get(tagId);
    if (tag === undefined) throw new Error("tag not found: " + tagId);
    tagBadges.push(<TagBadge key={tagId} tag={tag}></TagBadge>);
  });
  return <>{tagBadges}</>;
}

export default function TagBadge({ tag }: { tag: Tag }) {
  return (
    <span
      style={{
        background: TAG_COLORS[tag.title as keyof typeof TAG_COLORS],
        color: "white",
        borderRadius: "0.4rem",
        fontSize: "0.7rem",
        fontWeight: "bold",
        padding: "0.3rem",
        margin: "0.2rem",
      }}
      title={tag.description}
    >
      {tag.title}
    </span>
  );
}
