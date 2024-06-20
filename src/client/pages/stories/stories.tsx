import React from "react";
import { Link, Outlet, useLoaderData } from "react-router-dom";
import { Story } from "../../ts/model/entities";

export default function StoriesRoot() {
  const stories = useLoaderData() as Story[];
  return (
    <div>
      Hey this is the stories page
      <Outlet />
      <div>
        {stories.map((story) => (
          <div
            key={story.id}
            className="mt-2 max-w-fit rounded-lg bg-stone-500 px-2 py-1"
          >
            <Link
              key={story.id}
              to={`/story/${story.sqid}`}
              className="text-stone-50"
            >
              {story.title}
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
