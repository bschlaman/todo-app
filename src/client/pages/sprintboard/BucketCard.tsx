import { useMemo } from "react";
import { TagCircleIndicators } from "../../components/tags";
import type {
  Bucket,
  BucketTagAssignment,
  Tag,
  TagAssignment,
} from "../../ts/model/entities";
import {
  createBucketTagAssignment,
  destroyBucketTagAssignmentById,
} from "../../ts/lib/api";

export default function BucketCard({
  bucket,
  tagsById,
  tagAssignments,
  setTagAssignments,
}: {
  bucket: Bucket;

  tagsById: Map<string, Tag>;
  tagAssignments: BucketTagAssignment[];
  setTagAssignments: React.Dispatch<React.SetStateAction<TagAssignment[]>>;
}) {
  const selectedTagIds = useMemo(
    () =>
      tagAssignments
        .filter((ta) => ta.bucket_id === bucket.id)
        .map((ta) => ta.tag_id),
    [bucket, tagAssignments],
  );

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
    <div className="mb-4 rounded-md p-5 shadow-md outline-2 outline-zinc-700 outline-solid dark:bg-zinc-800 dark:text-zinc-200">
      <p className="font-bold">{bucket.title}</p>
      <p className="text-sm">{bucket.description}</p>
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
