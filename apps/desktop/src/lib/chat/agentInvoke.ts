import { invoke } from "@tauri-apps/api/core";
import { isTauriShell } from "../platform";
import { parseToolArguments } from "./tools";
import type { ChatToolCall } from "./sessions";

export interface AgentToolResult {
  name: string;
  output: string;
  ok: boolean;
}

export async function ensureAgentWorkspace(path: string): Promise<string> {
  if (!isTauriShell()) return path.replace(/^~/, "/Users/dev");
  return invoke<string>("agent_ensure_workspace", { path });
}

export async function defaultAgentWorkspace(): Promise<string> {
  if (!isTauriShell()) return "~/Documents/NodeAI";
  return invoke<string>("agent_default_workspace");
}

export async function pickAgentWorkspace(): Promise<string | null> {
  if (!isTauriShell()) return null;
  const picked = await invoke<string | null>("pick_agent_workspace");
  return picked ?? null;
}

export async function executeAgentTool(
  workspace: string,
  call: ChatToolCall,
): Promise<AgentToolResult> {
  if (!isTauriShell()) {
    return {
      name: call.name,
      output: "Agent tools require the NodeAI desktop app (Tauri).",
      ok: false,
    };
  }
  const resolved = await ensureAgentWorkspace(workspace);
  return invoke<AgentToolResult>("agent_execute_tool", {
    workspace: resolved,
    name: call.name,
    arguments: parseToolArguments(call.arguments),
  });
}

export async function readAgentFilePreview(
  workspace: string,
  relPath: string,
): Promise<string | null> {
  const result = await executeAgentTool(workspace, {
    id: "preview-read",
    name: "read_file",
    arguments: JSON.stringify({ path: relPath }),
  });
  return result.ok ? result.output : null;
}
