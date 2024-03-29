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
  // used to connect the input and label.  Can't use tag.id, since
  // a TagOption may be used in multiple places on the page.
  const inputId = Math.random().toString();

  return (
    <div
      style={{
        whiteSpace: "nowrap",
        display: "inline-block",
        margin: "0.2rem",
      }}
    >
      <input
        id={inputId}
        type="checkbox"
        checked={checked}
        // wrap the onChange fn with a fn that I can pass the
        // tag.id.  I can't get that from the event itself
        // since the id is randomly generated.
        onChange={(e) => onTagToggle(tag.id, e.target.checked)}
      />
      <label
        htmlFor={inputId}
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
