// Make this file a module so `declare module` augments rather than replaces
export {};

// Custom mdast node types for remark plugins in markdown.tsx
// See: https://github.com/syntax-tree/mdast#phrasingcontent
declare module "mdast" {
  interface IsoDateNode {
    type: "isoDate";
    data: {
      hName: "span";
      hProperties: { className: string; dataIsoDate: string };
      hChildren: [{ type: "text"; value: string }];
    };
  }

  interface TaskNode {
    type: "task";
    data: {
      hName: "task";
      hProperties: { taskId: string; commentId: string | undefined };
      hChildren: [];
    };
  }

  interface FilePathNode {
    type: "filePath";
    data: {
      hName: "span";
      hProperties: { className: string };
      hChildren: [{ type: "text"; value: string }];
    };
  }

  interface PhrasingContentMap {
    isoDate: IsoDateNode;
    task: TaskNode;
    filePath: FilePathNode;
  }
}

// Custom JSX intrinsic element for react-markdown's components prop
declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      task: React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          taskId: string;
          commentId?: string;
        },
        HTMLElement
      >;
    }
  }
}
