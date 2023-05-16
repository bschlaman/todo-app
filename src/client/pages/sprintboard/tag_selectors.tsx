import React, { Dispatch, SetStateAction } from "react";
import { Tag } from "../../ts/model/entities";

export function TagOption({
  tag,
  onTagToggle,
}: {
  tag: Tag;
  onTagToggle: (tagId: string, checked: boolean) => void;
}) {
  return (
    <>
      <input
        id={tag.id}
        type="checkbox"
        onChange={(e) => onTagToggle(tag.id, e.target.checked)}
      />
      <label htmlFor={tag.id}>{tag.title}</label>
    </>
  );
}

export function TagSelectors({
  tags,
  setActiveTagIds,
}: {
  tags: Tag[];
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
          onTagToggle={handleTagToggle}
        ></TagOption>
      ))}
    </>
  );
}
