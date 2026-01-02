import { DEFAULT_TAG_COLOR, TAG_COLORS } from "../ts/lib/common";
import type { Tag } from "../ts/model/entities";

export function TagBadgesForStoryId({
  storyId,
  tagsById,
  assocTagIdsByStoryId,
}: {
  storyId: string;
  tagsById: Map<string, Tag>;
  assocTagIdsByStoryId: Map<string, string[]>;
}) {
  return (
    <div className="flex flex-wrap">
      {assocTagIdsByStoryId.get(storyId)?.map((tagId) => {
        const tag = tagsById.get(tagId);
        if (tag === undefined) throw new Error("tag not found: " + tagId);
        return <TagBadge key={tagId} tag={tag} />;
      })}
    </div>
  );
}

export default function TagBadge({ tag }: { tag: Tag }) {
  return (
    <span
      className="m-1 rounded-md p-1 text-xs font-bold text-white"
      style={{
        background:
          tag.title in TAG_COLORS
            ? TAG_COLORS[tag.title as keyof typeof TAG_COLORS]
            : DEFAULT_TAG_COLOR,
      }}
      title={tag.description}
    >
      {tag.title}
    </span>
  );
}
