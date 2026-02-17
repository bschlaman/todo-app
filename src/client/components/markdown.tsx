import React, { type ErrorInfo } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { coldarkDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import type { Code, Root } from "mdast";
import type { Element } from "hast";
import { findAndReplace } from "mdast-util-find-and-replace";
import { nameToEmoji } from "gemoji";
import { visit } from "unist-util-visit";
import styles from "../css/markdown.module.css";
import "katex/dist/katex.min.css";
import InlineTaskCard from "./inline_task_card";
import { CopyIcon } from "./copy_to_clipboard_components";

export default function ReactMarkdownCustom({ content }: { content: string }) {
  return (
    // Need to surround <Markdown/> in <div/> to add className: https://github.com/remarkjs/react-markdown/blob/main/changelog.md#remove-classname
    <div className={styles.markdown}>
      <Markdown
        remarkPlugins={[
          remarkGfm,
          remarkMath,
          // For fenced code blocks with no language hint (so we can match /language-(\w+)/).
          // see: https://github.com/orgs/remarkjs/discussions/1346
          () => (tree: Root) => {
            visit(tree, "code", (node: Code) => {
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
          () => (tree: Root) => {
            findAndReplace(tree, [
              /task:([A-Za-z0-9]+)(?:#(\d+))?/g,
              function (_: string, $1: string, $2: string | undefined) {
                // might be able to type this correctly with https://github.com/syntax-tree/mdast-util-to-hast
                return {
                  type: "task",
                  data: {
                    hName: "task", // Tells react-markdown to render <task>…</task>
                    hProperties: { taskId: $1, commentId: $2 },
                    hChildren: [],
                  },
                };
              },
            ]);
          },
        ]}
        rehypePlugins={[
          [
            rehypeKatex,
            {
              macros: {
                "\\RR": "\\mathbb{R}",
                "\\PP": "\\mathbb{P}",
                "\\QQ": "\\mathbb{Q}",
                "\\gn": "\\;\\big\\vert\\;",
                "\\KL": "\\mathrm{KL}",
                "\\EE": "\\mathbb{E}",
                "\\N": "\\mathcal{N}",
                "\\X": "\\mathcal{X}",
                "\\Y": "\\mathcal{Y}",
                "\\F": "\\mathcal{F}",
                "\\T": "\\top",
                "\\rank": "\\operatorname{rank}",
                "\\Cov": "\\operatorname{Cov}",
                "\\Corr": "\\operatorname{Corr}",
                "\\Var": "\\operatorname{Var}",
                "\\Law": "\\operatorname{Law}",
                "\\Bias": "\\operatorname{Bias}",
                "\\PV": "\\operatorname{PV}",
                "\\VaR": "\\operatorname{VaR}",
                "\\ES": "\\operatorname{ES}",
                "\\MSE": "\\operatorname{MSE}",
                // blackboard bold
                "\\FF": "\\mathbb{F}",
                "\\ZZ": "\\mathbb{Z}",
                "\\SS": "\\mathbb{S}",
                // calligraphic
                "\\R": "\\mathcal{R}",
                "\\E": "\\mathcal{E}",
                "\\B": "\\mathcal{B}",
                "\\Z": "\\mathcal{Z}",
                "\\G": "\\mathcal{G}",
                "\\D": "\\mathcal{D}",
                "\\A": "\\mathcal{A}",
                "\\V": "\\mathcal{V}",
                "\\C": "\\mathcal{C}",
                "\\Q": "\\mathcal{Q}",
                "\\M": "\\mathcal{M}",
                "\\S": "\\mathcal{S}",
                "\\L": "\\mathcal{L}",
                "\\H": "\\mathcal{H}",
                "\\P": "\\mathcal{P}",
                // common indicators from probability and statistics
                "\\MLE": "\\mathrm{MLE}",
                "\\MAP": "\\mathrm{MAP}",
                "\\TV": "\\mathrm{TV}", // total variation
                "\\data": "\\mathrm{data}",
                "\\train": "\\mathrm{train}",
                "\\test": "\\mathrm{test}",
                "\\gen": "\\mathrm{gen}",
              },
            },
          ],
        ]}
        components={{
          // need to destructure `ref` due to some type issue with react-syntax-highlighter
          // see: https://github.com/remarkjs/react-markdown/issues/666#issuecomment-1001215783
          code({ className, children, ref, ...props }) {
            const match = /language-(\w+)/.exec(className ?? "");
            const codeContent = String(children).replace(/\n$/, "");
            return match ? (
              <div className="group relative">
                <SyntaxHighlighter
                  {...props}
                  style={coldarkDark}
                  language={match?.[1]}
                  PreTag="div" // so custom render doesn't target DOM
                >
                  {codeContent}
                </SyntaxHighlighter>
                <CopyIcon text={codeContent} />
              </div>
            ) : (
              <code {...props} className={`${className ?? ""} inline-code`}>
                {children}
              </code>
            );
          },
          task: ({ node }: { node: Element }) => {
            const { taskId, commentId } = node.properties as {
              taskId: string;
              commentId?: string;
            };
            return (
              <InlineTaskCard
                taskId={taskId}
                {...(commentId && { commentId: parseInt(commentId) })}
              />
            );
          },
        }}
      >
        {content}
      </Markdown>
    </div>
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
