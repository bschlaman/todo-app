import { getSprints, getStoryById } from "../ts/lib/api";
import { useLoaderData } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import type { Sprint, Story } from "../ts/model/entities";
import ReactMarkdownCustom from "../components/markdown";
import { sprintToString } from "../ts/lib/utils";

type StoryLoaderData = {
  story: Story;
  sprint: Sprint | undefined;
};

export async function loader({
  params,
}: LoaderFunctionArgs): Promise<StoryLoaderData> {
  const storyId = params["story_sqid"] ?? "";
  const [story, sprints] = await Promise.all([
    getStoryById(storyId),
    // TODO: this should be getSprintById(story.sprint_id)
    getSprints(),
  ]);

  return {
    story,
    sprint: sprints.find((s) => s.id === story.sprint_id),
  };
}

export default function Story() {
  const { story, sprint } = useLoaderData() as StoryLoaderData;
  // const navigation = useNavigation();
  return (
    <>
      <p className="text-2xl">{story.title}</p>
      {sprint && (
        <>
          <p className="mt-1 text-sm text-stone-500">
            Sprint: {sprintToString(sprint)}
          </p>
          <p className="mt-1 text-sm text-stone-300">(id: {sprint.id})</p>
        </>
      )}
      <ReactMarkdownCustom content={story.description} />
    </>
  );
}
