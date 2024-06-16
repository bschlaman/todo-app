import React from "react";
import { getStoryById } from "../ts/lib/api";
import { useLoaderData } from "react-router-dom";
import { Story } from "../ts/model/entities";
import type { LoaderFunctionArgs } from "react-router-dom";

export async function loader({ params }: LoaderFunctionArgs) {
  return await getStoryById(params["story_id"] ?? "");
}

export default function Story() {
  const story = useLoaderData() as Story;
  // const navigation = useNavigation();
  return (
    <>
      <p>{story.sqid}</p>
      <p>{story.title}</p>
      <p>{story.description}</p>
    </>
  );
}
