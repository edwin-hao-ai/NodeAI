import type { MemoryItem } from "../memoryStore";
import { parseBonusHeader } from "../bonusApi";
import type { ChatAttachment } from "./attachments";
import { buildMessageContent } from "./attachments";
import { drainSseBuffer } from "./sse";

const CHAT_APP_KEY = "sk-nodeai-chat";

export interface ChatRouteOptions {
  smartRouteEnabled: boolean;
  activeIntent: string;
  activeGatewayModel: string;
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
}

export interface ChatStreamUpdate {
  content: string;
  thinking: string;
}

export interface ChatResult {
  content: string | null;
  thinking: string | null;
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
  return headers;
}

function resolveRequestModel(options?: ChatRequestOptions): string {
  const route = options?.route;
  if (!route) return "google/gemini-2.5-flash";
  return route.activeGatewayModel;
}

async function readJsonCompletion(resp: Response): Promise<{ content: string | null; thinking: string | null }> {
  const data = (await resp.json()) as {
    choices?: {
      message?: {
        content?: string | unknown;
        reasoning_content?: string;
        reasoning?: string;
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
  return { content, thinking };
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

export async function streamChatCompletion(
  baseUrl: string,
  userText: string,
  options: ChatRequestOptions | undefined,
  onDelta: (update: ChatStreamUpdate) => void,
): Promise<ChatResult> {
  const url = `${baseUrl.replace(/\/$/, "")}/chat/completions`;
  const model = resolveRequestModel(options);
  const messageContent = buildMessageContent(userText, options?.attachments ?? []);
  let resp: Response;
  try {
    resp = await fetch(url, {
      method: "POST",
      headers: buildHeaders(options),
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: messageContent }],
        max_tokens: 512,
        stream: true,
      }),
    });
  } catch (err) {
    return {
      content: null,
      thinking: null,
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
      bonus,
      streamed: false,
      error: await readErrorMessage(resp),
    };
  }

  const ct = resp.headers.get("content-type") ?? "";
  if (!ct.includes("text/event-stream") || !resp.body) {
    const { content, thinking } = await readJsonCompletion(resp);
    return { content, thinking, bonus, streamed: false };
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let content = "";
  let thinking = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const chunk = drainSseBuffer(buffer);
    buffer = chunk.rest;
    for (const delta of chunk.contentDeltas) content += delta;
    for (const delta of chunk.thinkingDeltas) thinking += delta;
    if (chunk.contentDeltas.length || chunk.thinkingDeltas.length) {
      onDelta({ content, thinking });
    }
    if (chunk.finished) break;
  }

  return {
    content: content || null,
    thinking: thinking || null,
    bonus,
    streamed: true,
  };
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
        bonus,
        streamed: false,
        error: await readErrorMessage(resp),
      };
    }
    const { content, thinking } = await readJsonCompletion(resp);
    return { content, thinking, bonus, streamed: false };
  } catch (err) {
    return {
      content: null,
      thinking: null,
      bonus: null,
      streamed: false,
      error: err instanceof Error ? err.message : "network error",
    };
  }
}
