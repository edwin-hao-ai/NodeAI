# NodeAI MVP (v0.1) Implementation Plan

> **For agentic workers:** Use superpowers:subagent-driven-development or executing-plans to implement task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Ship a Tauri desktop app that matches PRD v0.1 and `prototypes/dashboard.html` IA: Always-on `8787` proxy, hosted-quota + BYOK paths, hub-first usage UI, and built-in chat activation.

**Architecture:** Rust workspace (`nodeai-core`, `nodeai-proxy`) + Tauri shell; React UI ported from HTML prototype; cloud relay only for hosted quota; BYOK fully on desktop per PRD §5.12 / §6.1.

**Tech Stack:** Tauri 2, React 19, Vite, axum, SQLite (rusqlite), keyring, Vercel AI Gateway (Phase 1 upstream).

---

## Phase 0 — Scaffold (done)

- [x] Cargo workspace + `nodeai-core` + `nodeai-proxy`
- [x] `apps/desktop` Tauri 2 + React shell (nav, themes, zh/en)
- [x] Proxy listens on `127.0.0.1:8787`, exposes `/v1/models` + stub chat
- [x] Prototype CSS + i18n JSON + `demo.ts`; views 对齐原型 IA（演示数据）

**接续上下文：** 见 [docs/CONTINUATION.md](../../CONTINUATION.md)

## Phase A — Chat 激活路径（当前优先 · 进行中）

- [ ] 发送消息 + 消息列表状态
- [ ] 首次回复后 `aha-banner` + `nodeai-first-chat-done`
- [ ] `renderChatStarters` 等价逻辑
- [ ] （可选）流式 mock

## Phase B — BYOK 边缘（次优先）

- [ ] App Key `sk-nodeai-{app}`
- [ ] `POST /v1/chat/completions` BYOK 转发骨架

## Phase 1 — Edge proxy & paths (week 1–2)

### Task 1: App key audit

**Files:** `crates/nodeai-proxy/src/auth.rs`, `routes.rs`

- [ ] Parse `Authorization: Bearer sk-nodeai-{app}`
- [ ] Map to display name + local usage counters
- [ ] Emit structured log + optional SQLite `requests` table

### Task 2: BYOK local relay

**Files:** `crates/nodeai-runtime/` (new), `nodeai-proxy`

- [ ] Load BYOK sources from SQLite + Keychain
- [ ] `POST /v1/chat/completions` → desktop HTTP upstream when path = BYOK
- [ ] RTK/Caveman L1 hooks (stub metrics first)

### Task 3: Hosted quota relay

**Files:** `crates/nodeai-cloud/` or `apps/api/` (separate repo if preferred)

- [ ] NodeAI Cloud API client in desktop (Session from Keychain)
- [ ] Forward chat/stream to backend → Vercel Gateway
- [ ] 503 until configured (current behavior)

## Phase 2 — UI migration from prototype (week 2–4)

Port `prototypes/dashboard.html` view-by-view into React; keep `data-i18n` keys aligned with `.cursor/rules/nodeai-ui-copy.mdc`.

| View | Prototype id | Priority |
|------|----------------|----------|
| 选模型 | `view-models` | P0 (partial) |
| 对话 | `view-chat` | P0 |
| 总览 | `view-hub` | P0 |
| 连接 | `view-gateway` | P0 |
| 账单 | `view-billing` | P0 |
| 设置 | `view-settings` | P0 |
| 记忆 | `view-memory` | P0 |
| 模型来源 | `view-sources` | P1 |
| 套餐 | `view-plan` | P1 |

- [ ] Extract shared CSS → `apps/desktop/src/styles/`
- [ ] Shared components: toggles, copy field, sparkline, app cards
- [ ] Tauri commands: read/write settings JSON, open folder (workspace)

## Phase 3 — Memory & persistence (week 4–5)

- [ ] `rusqlite` schema: memories, usage_daily, app_registry, byok_sources
- [ ] Memory page CRUD + chat「记住这条」
- [ ] Onboarding flags (`nodeai-first-chat-done`, checklist)

## Phase 4 — Chat product path (week 5–6)

- [ ] Streaming chat UI + markdown
- [ ] Agent tools v1 (read/write with confirm)
- [ ] First-chat celebration + hub checklist (PRD §3.6.1)
- [ ] Embeddings endpoint for PDF/RAG

## Phase 5 — Billing & tray (week 6–7)

- [ ] Usage aggregation (hosted vs local)
- [ ] Hub charts + billing tabs
- [ ] System tray HUD (tokens/s, budget, sparkline)

## Phase 6 — Auth & ship (week 7–8)

- [ ] Port `prototypes/auth.html` → route or separate window
- [ ] Session in Keychain; local-only mode (`?mode=local`)
- [ ] macOS + Windows CI build; code sign later

---

## Verification

```bash
cargo test --workspace
cargo clippy --workspace -- -D warnings
cd apps/desktop && npm run build
cd apps/desktop && npm run tauri build
curl -s http://127.0.0.1:8787/health
curl -s http://127.0.0.1:8787/v1/models | head
```

---

## Out of scope (v0.1)

OAuth provider matrix, MITM IDE bridge, Prune auto, team policies, cloud memory sync — per PRD §9.
