import React from "react";
import { visit } from "unist-util-visit";
import type { Plugin } from "unified";
import type { Root } from "mdast";

export const remarkTaskify: Plugin<void[], Root> = () => {
  return (tree) => {
    visit(tree, "text", (node, index, parent) => {
      if (!parent || !node.value) return;

      const originalText = node.value;
      const pattern = /task:([A-Za-z0-9]+)/g;
      let match;
      let lastIndex = 0;

      // This will accumulate the new nodes (some plain text, some `task`).
      const newNodes: any[] = [];

      // Find all occurrences of `task:XYZ`
      while ((match = pattern.exec(originalText)) !== null) {
        const matchStart = match.index;
        const matchedString = match[0];
        const taskId = match[1];

        // Everything up to the match is normal text.
        if (matchStart > lastIndex) {
          newNodes.push({
            type: "text",
            value: originalText.slice(lastIndex, matchStart),
          });
        }

        // Add a custom node for the matched `task:XYZ`.
        newNodes.push({
          type: "task",
          data: {
            hName: "task", // Tells react-markdown to render <task>…</task>
            hProperties: { id: taskId }, // Pass along props for your custom component
          },
        });

        lastIndex = matchStart + matchedString.length;
      }

      // And finally, everything after the last match
      if (lastIndex < originalText.length) {
        newNodes.push({
          type: "text",
          value: originalText.slice(lastIndex),
        });
      }

      // Only replace if we found something
      if (newNodes.length > 1) {
        // Replace the single text node with multiple new nodes
        parent.children.splice(index, 1, ...newNodes);
        // Skip visiting all the newly inserted nodes
        return [visit.SKIP, index + newNodes.length];
      }
    });
  };
};

function Task(props: { id: string }) {
  return (
    <span style={{ color: "blue", fontWeight: "bold" }}>[TASK {props.id}]</span>
  );
}
