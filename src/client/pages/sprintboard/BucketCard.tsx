import { useMemo, useState } from "react";
import { TagCircleIndicators } from "../../components/tags";
import type { Bucket, BucketTagAssignment, Config, Tag } from "../../ts/model/entities";
import {
  createBucketTagAssignment,
  destroyBucketTagAssignmentById,
} from "../../ts/lib/api";
import ReactMarkdownCustom from "../../components/markdown";
import story from "../../routes/story";

export default function BucketCard({
  bucket,
  tagsById,
  tagAssignments,
  setTagAssignments,
    config,
}: {
  bucket: Bucket;
  tagsById: Map<string, Tag>;
  tagAssignments: BucketTagAssignment[];
  setTagAssignments: React.Dispatch<
    React.SetStateAction<BucketTagAssignment[]>
  >;
    config: Config | null;
}) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [title, setTitle] = useState(bucket.title);
  const [description, setDescription] = useState(bucket.description);

  const selectedTagIds = useMemo(
    () =>
      tagAssignments
        .filter((ta) => ta.bucket_id === bucket.id)
        .map((ta) => ta.tag_id),
    [bucket, tagAssignments],
  );

  async function handleBucketUpdate(updatedBucket: Bucket) {
    return;
    if (bucket, tagAssignments === null) return;
    if (Object.keys(updatedBucket).length !== Object.keys(bucket).length)
      throw Error("updated Bucket has incorrect number of keys");

    // return early if there is nothing to update
    let diff = false;
    for (const key in bucket) {
      if (
        bucket[key as keyof typeof bucket] ===
        updatedBucket[key as keyof typeof updatedBucket]
      )
        continue;
      diff = true;
      break;
    }
    if (!diff) return;

    await updateBucket(
      updatedBucket.id,
      updatedBucket.status,
      updatedBucket.title,
      updatedBucket.description,
    );
  }

  // async function handleBucketCardTagChange(tagId: string, checked: boolean) {
  //   // make the API call and then update tagAssignments
  //   if (checked) {
  //     const tagAssignment = await createBucketTagAssignment(tagId, bucket.id);
  //     setTagAssignments((tagAssignments) => [...tagAssignments, tagAssignment]);
  //   } else {
  //     await destroyBucketTagAssignment(tagId, bucket.id);
  //     setTagAssignments((tagAssignments) =>
  //       tagAssignments.filter(
  //         (ta) => ta.tag_id !== tagId || ta.bucket_id !== bucket.id,
  //       ),
  //     );
  //   }
  // }

  return (
    <div className="my-4 w-[30%] rounded-md p-5 shadow-md outline-2 outline-zinc-700 outline-solid dark:bg-zinc-800 dark:text-zinc-200">
      {/* Title */}
      {isEditingTitle ? (
        <div className="mb-4 flex flex-col gap-3">
          <textarea
            className="w-full resize-none rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-blue-400 dark:focus:ring-blue-800"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={config?.bucket_title_max_len}
            placeholder="Bucket title..."
            rows={2}
            autoFocus
          />
          <div className="flex gap-2">
            <button
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus:ring-offset-zinc-800"
              onClick={() => {
                setIsEditingTitle(false);
                void handleBucketUpdate({ ...bucket, title });
              }}
            >
              Save
            </button>
            <button
              className="rounded-lg bg-zinc-500 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-600 focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 focus:outline-none dark:bg-zinc-600 dark:hover:bg-zinc-700 dark:focus:ring-offset-zinc-800"
              onClick={() => {
                setIsEditingTitle(false);
                setTitle(bucket.title);
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <h3
          className="mb-4 text-lg font-semibold transition-colors hover:text-zinc-700 dark:hover:text-zinc-300"
          onDoubleClick={() => setIsEditingTitle(true)}
        >
          {title}
        </h3>
      )}

      {/* Description */}
      {isEditingDescription ? (
        <div className="mb-4 flex flex-col gap-3">
          <textarea
            className="min-h-30 w-full resize-y rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-blue-400 dark:focus:ring-blue-800"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={config?.bucket_desc_max_len}
            placeholder="Bucket description (supports Markdown)..."
            rows={6}
            autoFocus
          />
          <div className="flex gap-2">
            <button
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus:ring-offset-zinc-800"
              onClick={() => {
                setIsEditingDescription(false);
                void handleBucketUpdate({ ...bucket, description });
              }}
            >
              Save
            </button>
            <button
              className="rounded-lg bg-zinc-500 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-600 focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 focus:outline-none dark:bg-zinc-600 dark:hover:bg-zinc-700 dark:focus:ring-offset-zinc-800"
              onClick={() => {
                setIsEditingDescription(false);
                setDescription(bucket.description);
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div
          className="-m-2 mb-4 rounded-lg p-2 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-700"
          onDoubleClick={() => setIsEditingDescription(true)}
        >
          <ReactMarkdownCustom content={bucket.description} />
        </div>
      )}
      {/* Tags */}
      <div className="mb-4">
        <TagCircleIndicators
          tagsById={tagsById}
          selectedTagIds={selectedTagIds}
          onTagToggle={(tagId: string, checked: boolean) => {
            // void handleBucketCardTagChange(tagId, checked);
          }}
        />
      </div>
    </div>
  );
}
