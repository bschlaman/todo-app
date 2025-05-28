import React, { ErrorInfo } from "react";
import SyntaxHighlighter from "react-syntax-highlighter";
import { docco } from "react-syntax-highlighter/dist/esm/styles/hljs";
// I have used these in the past and like them.
// Note that hljs is the default; prism must be imported as Prism
// import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
// import { materialLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import type { Root } from "mdast";
import { findAndReplace } from "mdast-util-find-and-replace";
import { nameToEmoji } from "gemoji";
import { visit } from "unist-util-visit";
import styles from "../css/markdown.module.css";
import "katex/dist/katex.min.css";

export default function ReactMarkdownCustom({ content }: { content: string }) {
  return (
    <Markdown
      remarkPlugins={[
        remarkGfm,
        remarkMath,
        // For fenced code blocks with no language hint (so we can match /language-(\w+)/).
        // see: https://github.com/orgs/remarkjs/discussions/1346
        () => (tree: Root) => {
          visit(tree, "code", (node) => {
            node.lang = node.lang ?? "plaintext";
          });
        },
        // Emoji support with :<emoji>: from remark tutorial
        // Mostly just to experiment with custom remark plugins
        () => (tree: Root) => {
          findAndReplace(tree, [
            /:(\+1|[-\w]+):/g,
            function (_: string, $1: string) {
              return Object.hasOwn(nameToEmoji, $1) ? nameToEmoji[$1] : false;
            },
          ]);
        },
        // Remove leading whitespace from code blocks.
        // Currently only supports spaces.
        // Potential tab solution here: https://chatgpt.com/c/677c4f5e-d968-8006-b0f0-cf52b236da1c
        () => (tree: Root) => {
          visit(tree, "code", (node) => {
            const lines = node.value.split("\n");

            // Filter out empty lines, then find the minimal leading spaces
            const nonEmpty = lines.filter((l) => l.trim() !== "");
            if (!nonEmpty.length) return; // No indentation to adjust if empty

            const minIndent = Math.min(
              ...nonEmpty.map((l) => (l.match(/^ +/) || [""])[0].length),
            );

            // Remove that common indent from each line
            node.value = lines
              .map((l) =>
                l.startsWith(" ".repeat(minIndent)) ? l.slice(minIndent) : l,
              )
              .join("\n");
          });
        },
      ]}
      rehypePlugins={[
        [
          rehypeKatex,
          {
            macros: {
              "\\RR": "\\mathbb{R}",
              "\\EE": "\\mathbb{E}",
              "\\T": "\\intercal",
              "\\rank": "\\operatorname{rank}",
            },
          },
        ],
      ]}
      className={styles.markdown}
      components={{
        // need to destructure `ref` due to some type issue with react-syntax-highlighter
        // see: https://github.com/remarkjs/react-markdown/issues/666#issuecomment-1001215783
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        code({ className, children, ref, ...props }) {
          const match = /language-(\w+)/.exec(className ?? "");
          return match ? (
            <SyntaxHighlighter
              {...props}
              style={docco}
              language={match?.[1]}
              PreTag="div" // so custom render doesn't target DOM
            >
              {String(children).replace(/\n$/, "")}
            </SyntaxHighlighter>
          ) : (
            <code {...props} className={`${className ?? ""} inline-code`}>
              {children}
            </code>
          );
        },
        task: ({ node, ...props }) => {
          // node.data?.hProperties has { id: "XYZ" }
          const { id } = (node.data?.hProperties as any) || {};
          return <Task id={id} />;
        },
      }}
    >
      {content}
    </Markdown>
  );
}

// This is somewhat generic; might make sense to include this in some other file.
// I also only use it in one place since upgrading remark-markdown, remark-math, etc
// seems to have resolved the issue with $$.
// Still, I'll keep the code around in case I need it later.
export class ErrorBoundary extends React.Component<React.PropsWithChildren> {
  override state = { hasError: false, errorInfo: null };

  static getDerivedStateFromError() {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.log(error);
    this.setState({ hasError: true, errorInfo: info.componentStack });
  }

  override render() {
    if (this.state.hasError) return <p>{this.state.errorInfo}</p>;
    return this.props.children;
  }
}
