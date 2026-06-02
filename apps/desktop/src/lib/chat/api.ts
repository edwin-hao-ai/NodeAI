import type { MemoryItem } from "../memoryStore";
import { parseBonusHeader } from "../bonusApi";
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
}

export interface ChatResult {
  content: string | null;
  bonus: ReturnType<typeof parseBonusHeader>;
  streamed: boolean;
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
  return headers;
}

function resolveRequestModel(options?: ChatRequestOptions): string {
  const route = options?.route;
  if (!route) return "google/gemini-2.5-flash";
  if (route.smartRouteEnabled && route.activeIntent !== "auto") {
    return route.activeGatewayModel;
  }
  return route.activeGatewayModel;
}

async function readJsonCompletion(resp: Response): Promise<string | null> {
  const data = (await resp.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return data.choices?.[0]?.message?.content?.trim() || null;
}

export async function streamChatCompletion(
  baseUrl: string,
  userText: string,
  options: ChatRequestOptions | undefined,
  onDelta: (partial: string) => void,
): Promise<ChatResult> {
  const url = `${baseUrl.replace(/\/$/, "")}/chat/completions`;
  const model = resolveRequestModel(options);
  const resp = await fetch(url, {
    method: "POST",
    headers: buildHeaders(options),
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: userText }],
      max_tokens: 512,
      stream: true,
    }),
  });
  const bonus = parseBonusHeader(resp.headers.get("x-nodeai-bonus"));
  if (!resp.ok) return { content: null, bonus, streamed: false };

  const ct = resp.headers.get("content-type") ?? "";
  if (!ct.includes("text/event-stream") || !resp.body) {
    const content = await readJsonCompletion(resp);
    return { content, bonus, streamed: false };
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let content = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let chunk = drainSseBuffer(buffer);
    buffer = chunk.rest;
    for (const delta of chunk.deltas) {
      content += delta;
      onDelta(content);
    }
    if (chunk.finished) break;
  }

  return { content: content || null, bonus, streamed: true };
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
    if (!resp.ok) return { content: null, bonus, streamed: false };
    const content = await readJsonCompletion(resp);
    return { content, bonus, streamed: false };
  } catch {
    return { content: null, bonus: null, streamed: false };
  }
}
