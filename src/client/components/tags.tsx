import { DEFAULT_TAG_COLOR, TAG_COLORS } from "../ts/lib/common";
import type { Tag } from "../ts/model/entities";

export function TagBadge({ tag }: { tag: Tag }) {
  const tagColor =
    tag.title in TAG_COLORS
      ? TAG_COLORS[tag.title as keyof typeof TAG_COLORS]
      : DEFAULT_TAG_COLOR;
  return (
    <span
      className="m-1 rounded-md p-1 text-xs font-bold text-zinc-200 opacity-60"
      style={{ background: tagColor }}
      title={tag.description}
    >
      {tag.title}
    </span>
  );
}

export function TagCircleToggle({
  tag,
  isSelected,
  onTagToggle,
}: {
  tag: Tag;
  isSelected: boolean;
  onTagToggle: (tagId: string, checked: boolean) => void;
}) {
  const tagColor =
    tag.title in TAG_COLORS
      ? TAG_COLORS[tag.title as keyof typeof TAG_COLORS]
      : DEFAULT_TAG_COLOR;
  return (
    <button
      key={tag.id}
      className="flex size-4 items-center justify-center rounded-full border transition-all duration-200 hover:scale-125 focus:ring-1 focus:ring-blue-500 focus:ring-offset-1 focus:outline-hidden"
      style={{
        backgroundColor: tagColor,
        outline: isSelected ? "2px solid white" : "transparent",
        opacity: isSelected ? 1 : 0.3,
      }}
      title={tag.title}
      onClick={() => onTagToggle(tag.id, !isSelected)}
      type="button"
    ></button>
  );
}

// TODO: probably just get rid of this and inline the loop in TaskCard
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

export function TagCircles({
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
        return (
          <TagCircleToggle
            key={tagId}
            tag={tag}
            isSelected={false}
            onTagToggle={() => {}}
          />
        );
      })}
    </div>
  );
}

export function TagCircleIndicators({
  tagsById,
  selectedTagIds,
  onTagToggle,
}: {
  tagsById: Map<string, Tag>;
  selectedTagIds: string[];
  onTagToggle: (tagId: string, checked: boolean) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1 py-2">
      {Array.from(tagsById).map(([, tag]) => (
        <TagCircleToggle
          key={tag.id}
          tag={tag}
          isSelected={selectedTagIds.includes(tag.id)}
          onTagToggle={onTagToggle}
        />
      ))}
    </div>
  );
}
