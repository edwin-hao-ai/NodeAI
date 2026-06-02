import type { MemoryItem } from "../memoryStore";
import { parseBonusHeader } from "../bonusApi";
import type { GatewayCatalogEntry } from "../gateway/types";
import { resolvedModelForRoute } from "../route/display";
import type { ChatAttachment } from "./attachments";
import { buildMessageContent } from "./attachments";
import type { ApiChatMessage, ChatToolCall } from "./sessions";
import { drainSseBuffer } from "./sse";
import { ToolCallAccumulator } from "./toolCalls";
import { AGENT_TOOLS } from "./tools";

const CHAT_APP_KEY = "sk-nodeai-chat";

export interface ChatRouteOptions {
  smartRouteEnabled: boolean;
  activeIntent: string;
  activeGatewayModel: string;
  catalog?: GatewayCatalogEntry[] | null;
  cloudConfigured?: boolean;
}

export interface ChatRequestOptions {
  memories?: MemoryItem[];
  lang?: "zh" | "en";
  memoryInject?: boolean;
  route?: ChatRouteOptions;
  attachments?: ChatAttachment[];
  cloudToken?: string | null;
  trafficPath?: "hosted" | "byok";
  sourceId?: string | null;
  contextWindow?: number;
  agentEnabled?: boolean;
  hybridFallback?: boolean;
  hybridFallbackConfirmed?: boolean;
}

export interface ChatStreamUpdate {
  content: string;
  thinking: string;
}

export interface ChatResult {
  content: string | null;
  thinking: string | null;
  toolCalls: ChatToolCall[];
  bonus: ReturnType<typeof parseBonusHeader>;
  streamed: boolean;
  error?: string;
}

function memorySnippets(memories: MemoryItem[], lang: "zh" | "en"): string[] {
  return memories.slice(0, 8).map((m) => m.text[lang] || m.text.zh);
}

function buildHeaders(options?: ChatRequestOptions): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${CHAT_APP_KEY}`,
  };
  if (options?.memoryInject !== false && options?.memories?.length) {
    headers["X-NodeAI-Memories"] = JSON.stringify(
      memorySnippets(options.memories, options.lang ?? "zh"),
    );
  }
  if (options?.route) {
    headers["X-NodeAI-Intent"] = options.route.activeIntent;
    headers["X-NodeAI-Smart-Route"] = options.route.smartRouteEnabled ? "1" : "0";
  }
  if (options?.cloudToken) {
    headers["X-NodeAI-Cloud-Token"] = options.cloudToken;
  }
  if (options?.trafficPath === "byok") {
    headers["X-NodeAI-Path"] = "byok";
  }
  if (options?.sourceId) {
    headers["X-NodeAI-Source"] = options.sourceId;
  }
  if (options?.contextWindow && options.contextWindow > 0) {
    headers["X-NodeAI-Context-Window"] = String(options.contextWindow);
  }
  if (options?.hybridFallback && options?.hybridFallbackConfirmed) {
    headers["X-NodeAI-Hybrid-Fallback"] = "1";
    headers["X-NodeAI-Hybrid-Fallback-Confirm"] = "1";
  }
  return headers;
}

function resolveRequestModel(options?: ChatRequestOptions): string {
  const route = options?.route;
  if (!route) return "google/gemini-2.5-flash";
  const resolved = resolvedModelForRoute(
    route,
    route.catalog ?? null,
    route.cloudConfigured ?? false,
  );
  return resolved?.id ?? route.activeGatewayModel;
}

function mapToolCalls(
  calls: Array<{ id: string; type: "function"; function: { name: string; arguments: string } }>,
): ChatToolCall[] {
  return calls.map((call) => ({
    id: call.id,
    name: call.function.name,
    arguments: call.function.arguments,
  }));
}

async function readJsonCompletion(resp: Response): Promise<{
  content: string | null;
  thinking: string | null;
  toolCalls: ChatToolCall[];
}> {
  const data = (await resp.json()) as {
    choices?: {
      message?: {
        content?: string | unknown;
        reasoning_content?: string;
        reasoning?: string;
        tool_calls?: Array<{
          id: string;
          type: "function";
          function: { name: string; arguments: string };
        }>;
      };
    }[];
  };
  const message = data.choices?.[0]?.message;
  const raw = message?.content;
  const content = typeof raw === "string" ? raw.trim() || null : null;
  const thinking =
    message?.reasoning_content?.trim() ||
    message?.reasoning?.trim() ||
    null;
  const toolCalls = message?.tool_calls ? mapToolCalls(message.tool_calls) : [];
  return { content, thinking, toolCalls };
}

async function readErrorMessage(resp: Response): Promise<string> {
  try {
    const data = (await resp.json()) as { error?: { message?: string } };
    if (data.error?.message) return data.error.message;
  } catch {
    /* ignore */
  }
  return `HTTP ${resp.status}`;
}

export async function streamChatRound(
  baseUrl: string,
  apiMessages: ApiChatMessage[],
  options: ChatRequestOptions | undefined,
  onDelta: (update: ChatStreamUpdate) => void,
): Promise<ChatResult> {
  const url = `${baseUrl.replace(/\/$/, "")}/chat/completions`;
  const model = resolveRequestModel(options);
  const body: Record<string, unknown> = {
    model,
    messages: apiMessages,
    max_tokens: 2048,
    stream: true,
  };
  if (options?.agentEnabled) {
    body.tools = AGENT_TOOLS;
    body.tool_choice = "auto";
  }

  let resp: Response;
  try {
    resp = await fetch(url, {
      method: "POST",
      headers: buildHeaders(options),
      body: JSON.stringify(body),
    });
  } catch (err) {
    return {
      content: null,
      thinking: null,
      toolCalls: [],
      bonus: null,
      streamed: false,
      error: err instanceof Error ? err.message : "network error",
    };
  }

  const bonus = parseBonusHeader(resp.headers.get("x-nodeai-bonus"));
  if (!resp.ok) {
    return {
      content: null,
      thinking: null,
      toolCalls: [],
      bonus,
      streamed: false,
      error: await readErrorMessage(resp),
    };
  }

  const ct = resp.headers.get("content-type") ?? "";
  if (!ct.includes("text/event-stream") || !resp.body) {
    const { content, thinking, toolCalls } = await readJsonCompletion(resp);
    return { content, thinking, toolCalls, bonus, streamed: false };
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let content = "";
  let thinking = "";
  const toolAcc = new ToolCallAccumulator();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const chunk = drainSseBuffer(buffer);
    buffer = chunk.rest;
    for (const delta of chunk.contentDeltas) content += delta;
    for (const delta of chunk.thinkingDeltas) thinking += delta;
    for (const delta of chunk.toolCallDeltas) toolAcc.ingest(delta);
    if (chunk.contentDeltas.length || chunk.thinkingDeltas.length) {
      onDelta({ content, thinking });
    }
    if (chunk.finished) break;
  }

  return {
    content: content || null,
    thinking: thinking || null,
    toolCalls: mapToolCalls(toolAcc.build()),
    bonus,
    streamed: true,
  };
}

export async function streamChatCompletion(
  baseUrl: string,
  history: { role: "user" | "assistant"; content: string }[],
  userText: string,
  options: ChatRequestOptions | undefined,
  onDelta: (update: ChatStreamUpdate) => void,
): Promise<ChatResult> {
  const messageContent = buildMessageContent(userText, options?.attachments ?? []);
  const apiMessages: ApiChatMessage[] = [
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: "user", content: messageContent },
  ];
  return streamChatRound(baseUrl, apiMessages, options, onDelta);
}

/** Non-streaming fallback. */
export async function requestChatCompletion(
  baseUrl: string,
  userText: string,
  model: string,
  options?: ChatRequestOptions,
): Promise<ChatResult> {
  const url = `${baseUrl.replace(/\/$/, "")}/chat/completions`;
  try {
    const resp = await fetch(url, {
      method: "POST",
      headers: buildHeaders(options),
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: userText }],
        max_tokens: 512,
      }),
    });
    const bonus = parseBonusHeader(resp.headers.get("x-nodeai-bonus"));
    if (!resp.ok) {
      return {
        content: null,
        thinking: null,
        toolCalls: [],
        bonus,
        streamed: false,
        error: await readErrorMessage(resp),
      };
    }
    const { content, thinking, toolCalls } = await readJsonCompletion(resp);
    return { content, thinking, toolCalls, bonus, streamed: false };
  } catch (err) {
    return {
      content: null,
      thinking: null,
      toolCalls: [],
      bonus: null,
      streamed: false,
      error: err instanceof Error ? err.message : "network error",
    };
  }
}
