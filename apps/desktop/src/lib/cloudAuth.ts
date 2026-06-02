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
    if (data.error?.message) return data.error.message;
  } catch {
    /* ignore */
  }
  return `HTTP ${resp.status}`;
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
    return { ok: false, error: err instanceof Error ? err.message : "network error" };
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
    return { ok: false, error: err instanceof Error ? err.message : "network error" };
  }
}
