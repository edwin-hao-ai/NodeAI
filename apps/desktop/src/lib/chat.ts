const CHAT_APP_KEY = "sk-nodeai-chat";

export async function requestChatCompletion(
  baseUrl: string,
  userText: string,
  model: string,
): Promise<string | null> {
  const url = `${baseUrl.replace(/\/$/, "")}/chat/completions`;
  try {
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${CHAT_APP_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: userText }],
      }),
    });
    if (!resp.ok) return null;
    const data = (await resp.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = data.choices?.[0]?.message?.content?.trim();
    return content || null;
  } catch {
    return null;
  }
}
