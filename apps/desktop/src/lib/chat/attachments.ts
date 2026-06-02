export interface ChatAttachment {
  id: string;
  name: string;
  kind: "file" | "image";
  previewUrl?: string;
  textContent?: string;
  dataUrl?: string;
}

const TEXT_EXTENSIONS = new Set([
  "md",
  "txt",
  "json",
  "csv",
  "ts",
  "tsx",
  "js",
  "jsx",
  "py",
  "rs",
  "toml",
  "yaml",
  "yml",
  "xml",
  "html",
  "css",
]);

function ext(name: string): string {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i + 1).toLowerCase() : "";
}

async function readTextFile(file: File): Promise<string> {
  return file.text();
}

async function readDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export async function fileToAttachment(file: File): Promise<ChatAttachment> {
  const id = `att-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const isImage = file.type.startsWith("image/");
  if (isImage) {
    const dataUrl = await readDataUrl(file);
    return {
      id,
      name: file.name,
      kind: "image",
      previewUrl: dataUrl,
      dataUrl,
    };
  }
  const extension = ext(file.name);
  let textContent: string | undefined;
  if (TEXT_EXTENSIONS.has(extension) && file.size <= 256_000) {
    textContent = await readTextFile(file);
  }
  return {
    id,
    name: file.name,
    kind: "file",
    textContent,
  };
}

export type MessageContent =
  | string
  | Array<
      | { type: "text"; text: string }
      | { type: "image_url"; image_url: { url: string } }
    >;

export function buildMessageContent(text: string, attachments: ChatAttachment[]): MessageContent {
  const trimmed = text.trim();
  const imageParts = attachments
    .filter((a) => a.kind === "image" && a.dataUrl)
    .map((a) => ({
      type: "image_url" as const,
      image_url: { url: a.dataUrl! },
    }));

  const fileSnippets = attachments
    .filter((a) => a.kind === "file")
    .map((a) => {
      if (a.textContent) {
        return `[附件 ${a.name}]\n${a.textContent.slice(0, 12_000)}`;
      }
      return `[附件 ${a.name} · 已附加]`;
    });

  const prefix = fileSnippets.length ? `${fileSnippets.join("\n\n")}\n\n` : "";
  const fullText = `${prefix}${trimmed}`.trim();

  if (imageParts.length === 0) {
    return fullText;
  }

  const parts: Array<
    | { type: "text"; text: string }
    | { type: "image_url"; image_url: { url: string } }
  > = [];
  if (fullText) parts.push({ type: "text", text: fullText });
  parts.push(...imageParts);
  return parts;
}
