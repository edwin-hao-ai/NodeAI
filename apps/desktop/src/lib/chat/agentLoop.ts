import type { ChatRequestOptions, ChatResult, ChatStreamUpdate } from "./api";
import { streamChatRound } from "./api";
import { executeAgentTool } from "./agentInvoke";
import type { ApiChatMessage, ChatToolCall, StoredChatMessage } from "./sessions";
import { toApiMessages } from "./sessions";
import { AGENT_SYSTEM_PROMPT, parseToolArguments, WRITE_TOOLS } from "./tools";
import type { ChatAttachment } from "./attachments";
import { buildMessageContent } from "./attachments";

export interface AgentConfirmRequest {
  call: ChatToolCall;
  workspace: string;
}

export interface RunAgentChatParams {
  baseUrl: string;
  history: StoredChatMessage[];
  userText: string;
  attachments: ChatAttachment[];
  workspace: string;
  options: ChatRequestOptions;
  onDelta: (update: ChatStreamUpdate) => void;
  onToolStart: (call: ChatToolCall) => void;
  onToolResult: (call: ChatToolCall, output: string, ok: boolean) => void;
  confirmWrite: (req: AgentConfirmRequest) => Promise<boolean>;
}

const MAX_AGENT_STEPS = 8;

function buildUserMessage(text: string, attachments: ChatAttachment[]): ApiChatMessage {
  return {
    role: "user",
    content: buildMessageContent(text, attachments),
  };
}

export async function runAgentChat(params: RunAgentChatParams): Promise<{
  result: ChatResult;
  apiMessages: ApiChatMessage[];
  uiMessages: StoredChatMessage[];
}> {
  const {
    baseUrl,
    history,
    userText,
    attachments,
    workspace,
    options,
    onDelta,
    onToolStart,
    onToolResult,
    confirmWrite,
  } = params;

  const apiMessages: ApiChatMessage[] = [...toApiMessages(history)];
  if (options.agentEnabled) {
    const hasAgentPrompt = apiMessages.some(
      (m) => m.role === "system" && typeof m.content === "string" && m.content.includes("NodeAI Chat Agent"),
    );
    if (!hasAgentPrompt) {
      apiMessages.unshift({ role: "system", content: AGENT_SYSTEM_PROMPT });
    }
  }
  apiMessages.push(buildUserMessage(userText, attachments));

  const uiMessages: StoredChatMessage[] = [];
  let lastResult: ChatResult = {
    content: null,
    thinking: null,
    toolCalls: [],
    bonus: null,
    streamed: false,
  };

  for (let step = 0; step < MAX_AGENT_STEPS; step += 1) {
    lastResult = await streamChatRound(baseUrl, apiMessages, options, onDelta);
    if (lastResult.error && !lastResult.content && !lastResult.toolCalls.length) {
      return { result: lastResult, apiMessages, uiMessages };
    }

    if (!lastResult.toolCalls.length) {
      return { result: lastResult, apiMessages, uiMessages };
    }

    const assistantId = `a-${Date.now()}-${step}`;
    uiMessages.push({
      id: assistantId,
      role: "assistant",
      text: lastResult.content ?? "",
      thinking: lastResult.thinking || undefined,
      toolCalls: lastResult.toolCalls,
    });
    apiMessages.push({
      role: "assistant",
      content: lastResult.content || null,
      tool_calls: lastResult.toolCalls.map((call) => ({
        id: call.id,
        type: "function" as const,
        function: { name: call.name, arguments: call.arguments },
      })),
    });

    for (const call of lastResult.toolCalls) {
      onToolStart(call);
      if (WRITE_TOOLS.has(call.name)) {
        const approved = await confirmWrite({ call, workspace });
        if (!approved) {
          const denied = "User declined the file write.";
          onToolResult(call, denied, false);
          apiMessages.push({
            role: "tool",
            tool_call_id: call.id,
            name: call.name,
            content: denied,
          });
          uiMessages.push({
            id: `t-${call.id}`,
            role: "tool",
            text: denied,
            toolCallId: call.id,
            toolName: call.name,
          });
          continue;
        }
      }

      const toolResult = await executeAgentTool(workspace, call);
      onToolResult(call, toolResult.output, toolResult.ok);
      apiMessages.push({
        role: "tool",
        tool_call_id: call.id,
        name: call.name,
        content: toolResult.output,
      });
      uiMessages.push({
        id: `t-${call.id}`,
        role: "tool",
        text: toolResult.output,
        toolCallId: call.id,
        toolName: call.name,
      });
    }
  }

  return {
    result: {
      ...lastResult,
      error: lastResult.error ?? "Agent step limit reached",
    },
    apiMessages,
    uiMessages,
  };
}

export function previewWritePath(call: ChatToolCall): string {
  const args = parseToolArguments(call.arguments);
  return typeof args.path === "string" ? args.path : "";
}
