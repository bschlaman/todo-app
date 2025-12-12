import type { Tag } from "../../ts/model/entities";
import { TAG_COLORS, DEFAULT_TAG_COLOR } from "../../ts/lib/common";

export function TagOption({
  tag,
  checked,
  onTagToggle,
}: {
  tag: Tag;
  checked: boolean;
  onTagToggle: (tagId: string, checked: boolean) => void;
}) {
  // used to connect the input and label.  Can't use tag.id, since
  // a TagOption may be used in multiple places on the page.
  const inputId = Math.random().toString();

  const tag_color =
    tag.title in TAG_COLORS
      ? TAG_COLORS[tag.title as keyof typeof TAG_COLORS]
      : DEFAULT_TAG_COLOR;

  return (
    <div className="m-1 inline-block whitespace-nowrap">
      <input
        id={inputId}
        type="checkbox"
        className="hidden"
        checked={checked}
        // wrap the onChange fn with a fn that I can pass the
        // tag.id.  I can't get that from the event itself
        // since the id is randomly generated.
        onChange={(e) => onTagToggle(tag.id, e.target.checked)}
      />
      <label
        htmlFor={inputId}
        className="cursor-pointer select-none rounded-md p-0.5"
        style={{
          color: tag_color,
          outline: checked ? `2px solid ${tag_color}` : "none",
          fontWeight: checked ? "bold" : "normal",
        }}
        title={tag.description}
      >
        {tag.title}
      </label>
    </div>
  );
}
