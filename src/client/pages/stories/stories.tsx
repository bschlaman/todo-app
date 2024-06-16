import React from "react";
import { getStories } from "../../ts/lib/api";
import { Link, Outlet, useLoaderData } from "react-router-dom";
import { Story } from "../../ts/model/entities";

export async function loader() {
  return await getStories();
}
//
// export async function action() {
//     const contact = await createContact();
//     return redirect(`/stories/${contact.id}/edit`);
// }
export function StoriesRoot() {
  return (
    <div>
      Hey here are all the stories:
      <ul>
        <Outlet />
      </ul>
    </div>
  );
}

export default function Stories() {
  const stories = useLoaderData() as Story[];
  return (
    <div>
      {stories.map((story) => (
        <div key={story.id}>
          <Link to={`/stories/story/${story.id}`}>{story.id}</Link>
        </div>
      ))}
    </div>
  );
}
