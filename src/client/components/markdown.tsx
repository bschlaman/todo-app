import React from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { materialLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import styles from "../css/markdown.module.css";
import "katex/dist/katex.min.css";

export default function ReactMarkdownCustom({ content }: { content: string }) {
  return (
    <Markdown
      remarkPlugins={[remarkGfm, remarkMath]}
      // as of 2024.04.08, the types are broken for this;
      // there is a fix coming according to some gh issues
      rehypePlugins={[rehypeKatex]}
      className={styles.markdown}
      components={{
        code({ inline, className, children, ...props }) {
          const match = /language-(\w+)/.exec(className ?? "");
          return inline !== true ? (
            <SyntaxHighlighter
              {...props}
              style={materialLight}
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
      }}
    >
      {content}
    </Markdown>
  );
}
