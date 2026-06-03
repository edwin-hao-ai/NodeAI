import rehypeHighlight from "rehype-highlight";

/** Languages considered when auto-detecting unlabeled fences (keeps work small). */
const CHAT_DETECT_LANGS = [
  "typescript",
  "javascript",
  "python",
  "rust",
  "json",
  "yaml",
  "bash",
  "shell",
  "markdown",
  "css",
  "html",
  "xml",
  "sql",
  "toml",
  "go",
  "java",
  "kotlin",
  "c",
  "cpp",
  "dockerfile",
] as const;

import type { Pluggable } from "unified";

export const chatRehypePlugins: Pluggable[] = [
  [
    rehypeHighlight,
    { detect: true, subset: [...CHAT_DETECT_LANGS] },
  ],
];
