import { Link, Outlet, useLoaderData } from "react-router-dom";
import type { Story } from "../../ts/model/entities";
import ReactMarkdownCustom from "../../components/markdown";

export default function StoriesRoot() {
  const stories = useLoaderData() as Story[];

  return (
    <div className="flex h-screen overflow-y-auto bg-stone-200">
      <div className="flex max-w-xl flex-col overflow-hidden p-4">
        <h2 className="text-xl font-bold text-stone-900">Stories</h2>
        <div className="overflow-y-scroll">
          {stories.map((story) => (
            <div
              key={story.id}
              className="mt-2 w-3/4 rounded-lg bg-stone-500 px-2 py-1"
            >
              <Link
                key={story.id}
                to={`/story/${story.sqid}`}
                className="text-stone-50"
              >
                {story.title}
              </Link>
              <ReactMarkdownCustom content={story.description} />
            </div>
          ))}
        </div>
      </div>
      <div className="grow p-4 outline outline-2 outline-black">
        <Outlet />
      </div>
    </div>
  );
}
