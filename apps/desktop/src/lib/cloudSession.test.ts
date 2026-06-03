import { beforeEach, describe, expect, it, vi } from "vitest";

const invokeMock = vi.fn();
const store = new Map<string, string>();

vi.mock("@tauri-apps/api/core", () => ({
  invoke: (...args: unknown[]) => invokeMock(...args),
}));

describe("cloudSession persistence", () => {
  beforeEach(() => {
    invokeMock.mockReset();
    store.clear();
    vi.stubGlobal("localStorage", {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => {
        store.set(k, v);
      },
      removeItem: (k: string) => {
        store.delete(k);
      },
      clear: () => store.clear(),
    });
  });

  it("mirrors token to localStorage on save", async () => {
    invokeMock.mockResolvedValue(undefined);
    const { saveCloudSession, getCloudSession } = await import("./cloudSession");
    await saveCloudSession("nodeai_session_abc");
    expect(localStorage.getItem("nodeai-cloud-session-token")).toBe("nodeai_session_abc");
    expect(invokeMock).toHaveBeenCalledWith("save_cloud_session", {
      token: "nodeai_session_abc",
    });
    invokeMock.mockResolvedValue(null);
    const token = await getCloudSession();
    expect(token).toBe("nodeai_session_abc");
  });

  it("clears localStorage on clear", async () => {
    invokeMock.mockResolvedValue(undefined);
    const { saveCloudSession, clearCloudSession, getCloudSession } = await import("./cloudSession");
    await saveCloudSession("nodeai_session_xyz");
    await clearCloudSession();
    expect(localStorage.getItem("nodeai-cloud-session-token")).toBeNull();
    invokeMock.mockResolvedValue(null);
    expect(await getCloudSession()).toBeNull();
  });
});
