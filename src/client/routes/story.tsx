import { getStoryById } from "../ts/lib/api";
import { useLoaderData } from "react-router-dom";
import type { Story } from "../ts/model/entities";
import type { LoaderFunctionArgs } from "react-router-dom";
import ReactMarkdownCustom from "../components/markdown";

export async function loader({ params }: LoaderFunctionArgs) {
  return await getStoryById(params["story_sqid"] ?? "");
}

export default function Story() {
  const story = useLoaderData() as Story;
  // const navigation = useNavigation();
  return (
    <>
      <p className="text-2xl">{story.title}</p>
      <ReactMarkdownCustom content={story.description} />
    </>
  );
}
