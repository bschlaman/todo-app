import React, { Dispatch, SetStateAction } from "react";
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
    <>
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
    </>
  );
}

export function TagSelectors({
  tags,
  activeTagIds,
  setActiveTagIds,
}: {
  tags: Tag[];
  activeTagIds: string[];
  setActiveTagIds: Dispatch<SetStateAction<string[]>>;
}) {
  function handleTagToggle(tagId: string, checked: boolean) {
    setActiveTagIds((prev) => {
      if (checked) return [...prev, tagId];
      return prev.filter((id) => id !== tagId);
    });
  }

  return (
    <>
      {tags.map((tag) => (
        <TagOption
          key={tag.id}
          tag={tag}
          checked={activeTagIds.includes(tag.id)}
          onTagToggle={handleTagToggle}
        ></TagOption>
      ))}
    </>
  );
}
