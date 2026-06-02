export const AGENT_SYSTEM_PROMPT =
  "You are NodeAI Chat Agent. You can read, write, list, and delete files in the user's workspace using tools. " +
  "Paths are relative to the workspace root. Prefer read_file before write_file. " +
  "When editing files, write the full updated content. Only delete files when the user explicitly asks.";

export const AGENT_TOOLS = [
  {
    type: "function" as const,
    function: {
      name: "read_file",
      description: "Read a UTF-8 text file relative to the workspace root.",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string", description: "Relative file path" },
        },
        required: ["path"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "write_file",
      description: "Create or overwrite a UTF-8 text file relative to the workspace root.",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string", description: "Relative file path" },
          content: { type: "string", description: "Full file contents" },
        },
        required: ["path", "content"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "delete_file",
      description: "Delete a file relative to the workspace root (not directories).",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string", description: "Relative file path" },
        },
        required: ["path"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "list_dir",
      description: "List files and folders in a workspace directory.",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string", description: "Relative directory path, or . for workspace root" },
        },
        required: ["path"],
      },
    },
  },
];

/** Tools that require explicit user confirmation before execution. */
export const DANGEROUS_TOOLS = new Set(["write_file", "delete_file"]);

export function parseToolArguments(raw: string): Record<string, unknown> {
  try {
    return JSON.parse(raw || "{}") as Record<string, unknown>;
  } catch {
    return {};
  }
}

export function previewToolPath(call: { name: string; arguments: string }): string {
  const args = parseToolArguments(call.arguments);
  return typeof args.path === "string" ? args.path : "";
}
