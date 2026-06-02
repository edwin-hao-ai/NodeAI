export interface CloudUser {
  name: string;
  email: string;
  plan: string;
}

export interface CloudSignInResult {
  token: string;
  user: CloudUser;
}

const STORAGE_USER = "nodeai-cloud-user";

export function loadStoredCloudUser(): CloudUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_USER);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CloudUser;
    if (parsed?.email && parsed?.name) return parsed;
  } catch {
    /* ignore */
  }
  return null;
}

export function saveStoredCloudUser(user: CloudUser): void {
  localStorage.setItem(STORAGE_USER, JSON.stringify(user));
}

export function clearStoredCloudUser(): void {
  localStorage.removeItem(STORAGE_USER);
}

async function readAuthError(resp: Response): Promise<string> {
  try {
    const data = (await resp.json()) as { error?: { message?: string } };
    if (data.error?.message) return friendlyAuthError(data.error.message);
  } catch {
    /* ignore */
  }
  return `HTTP ${resp.status}`;
}

function friendlyAuthError(err: string): string {
  if (err.includes("error sending request") || err.includes("Connection refused")) {
    return "本地 Cloud 未就绪。若已安装 NodeAI.app，请先退出再重试登录";
  }
  if (err.includes("401") || err.includes("invalid email")) {
    return "邮箱或密码不正确";
  }
  return err;
}

export async function signInViaProxy(
  proxyBaseUrl: string,
  email: string,
  password: string,
): Promise<{ ok: true; data: CloudSignInResult } | { ok: false; error: string }> {
  try {
    const url = `${proxyBaseUrl.replace(/\/$/, "")}/nodeai/auth/login`;
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!resp.ok) return { ok: false, error: await readAuthError(resp) };
    const data = (await resp.json()) as CloudSignInResult;
    if (!data?.token || !data?.user?.email) return { ok: false, error: "invalid auth response" };
    return { ok: true, data };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "network error";
    return { ok: false, error: friendlyAuthError(msg) };
  }
}

export async function registerViaProxy(
  proxyBaseUrl: string,
  email: string,
  password: string,
  name?: string,
): Promise<{ ok: true; user: CloudUser } | { ok: false; error: string }> {
  try {
    const url = `${proxyBaseUrl.replace(/\/$/, "")}/nodeai/auth/register`;
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name: name ?? email.split("@")[0] }),
    });
    if (!resp.ok) return { ok: false, error: await readAuthError(resp) };
    const data = (await resp.json()) as { user?: CloudUser };
    if (!data?.user?.email) return { ok: false, error: "invalid register response" };
    return { ok: true, user: data.user };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "network error";
    return { ok: false, error: friendlyAuthError(msg) };
  }
}

export type SessionCheck =
  | { kind: "ok"; user: CloudUser }
  | { kind: "invalid" }
  | { kind: "unavailable" };

export async function validateCloudSessionViaProxy(
  proxyBaseUrl: string,
  token: string,
): Promise<SessionCheck> {
  try {
    const url = `${proxyBaseUrl.replace(/\/$/, "")}/nodeai/auth/me`;
    const resp = await fetch(url, {
      headers: { "X-NodeAI-Cloud-Token": token },
    });
    if (resp.status === 401 || resp.status === 403) return { kind: "invalid" };
    if (!resp.ok) return { kind: "unavailable" };
    const data = (await resp.json()) as { user?: CloudUser };
    if (!data?.user?.email) return { kind: "invalid" };
    return { kind: "ok", user: data.user };
  } catch {
    return { kind: "unavailable" };
  }
}

/** @deprecated Prefer validateCloudSessionViaProxy for persistence-safe checks */
export async function fetchSessionUserViaProxy(
  proxyBaseUrl: string,
  token: string,
): Promise<CloudUser | null> {
  const check = await validateCloudSessionViaProxy(proxyBaseUrl, token);
  return check.kind === "ok" ? check.user : null;
}
