import React from "react";
import { Tag } from "../../ts/model/entities";
import { TAG_COLORS } from "../../ts/lib/common";

export function TagOption({
  tag,
  checked,
  onTagToggle,
}: {
  tag: Tag;
  checked: boolean;
  onTagToggle: (tagId: string, checked: boolean) => void;
}) {
  return (
    <div style={{ whiteSpace: "nowrap", display: "inline-block" }}>
      <input
        id={tag.id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onTagToggle(tag.id, e.target.checked)}
      />
      <label
        htmlFor={tag.id}
        style={{
          color: TAG_COLORS[tag.title as keyof typeof TAG_COLORS],
        }}
        title={tag.description}
      >
        {tag.title}
      </label>
    </div>
  );
}
