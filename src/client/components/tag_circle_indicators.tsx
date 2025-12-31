import type { Tag } from "../ts/model/entities";
import { TAG_COLORS, DEFAULT_TAG_COLOR } from "../ts/lib/common";

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
      {Array.from(tagsById).map(([, tag]) => {
        const isSelected = selectedTagIds.includes(tag.id);
        const tagColor =
          tag.title in TAG_COLORS
            ? TAG_COLORS[tag.title as keyof typeof TAG_COLORS]
            : DEFAULT_TAG_COLOR;

        return (
          <button
            key={tag.id}
            className="flex size-4 items-center justify-center rounded-full border transition-all duration-200 hover:scale-125 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:ring-offset-1"
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
      })}
    </div>
  );
}
