# NodeAI 开发接续说明（Agent / 新会话用）

**最后更新：** 2026-06-01  
**用途：** 在新 Cursor 会话中恢复上下文，避免重复探索。人类也可作进度快照。

---

## 产品约束（不可违背）

| 来源 | 要点 |
|------|------|
| [docs/PRD.md](PRD.md) | 桌面中枢；`8787` 边缘；含额度→云端 / 自有 Key→本机；Chat 是快捷入口；小美激活=**首次 Chat 成功** |
| [prototypes/dashboard.html](../prototypes/dashboard.html) | UI/交互/文案的**权威对照**（演示数据在内联 `<script>`） |
| [.cursor/rules/nodeai-product.mdc](../.cursor/rules/nodeai-product.mdc) | 双路径、Built-in Bonus、技术栈 |
| [.cursor/rules/nodeai-prototype.mdc](../.cursor/rules/nodeai-prototype.mdc) | 信息架构、设置分组、双路径 UI 文案 |
| [.cursor/rules/nodeai-ui-copy.mdc](../.cursor/rules/nodeai-ui-copy.mdc) | 用户可见文案禁止 BYOK/RTK 等；`data-i18n` 中英同步 |

**用户规则：** 默认**不要** `git commit`，除非用户明确要求。

---

## 仓库现状（2026-06-01）

### 已有

```
NodeAI/
├── apps/desktop/          # Tauri 2 + React 19 + Vite
├── crates/nodeai-core/    # 配置、模型别名类型
├── crates/nodeai-proxy/   # 127.0.0.1:8787，/health、/v1/models、chat 占位 503
├── prototypes/            # dashboard.html、auth.html（仍是对照源）
├── docs/PRD.md、DESIGN.md
└── docs/superpowers/plans/2026-06-01-nodeai-mvp-implementation.md  # 分阶段计划
```

- UI：原型 CSS 已导入 `apps/desktop/src/styles/prototype.css`；i18n 自原型导出 `zh.json`/`en.json`；演示数据 `src/data/demo.ts`。
- 页面：选模型 / 对话 / 总览 / 连接 / 账单 / 设置 / 记忆 / 模型来源 / 套餐 — **结构对齐原型，多为演示数据，无真实推理**。
- 构建：`cd apps/desktop && npm run build`；`cargo check --workspace`。

### 刻意未做（下一阶段）

1. **Chat 产品路径**
   - ~~流式回复（可先 mock SSE）~~ → 下一步
   - ~~首条发送 + 啊哈条 + starters~~ ✓ Phase A
   - Chat 经 `8787` + `sk-nodeai-chat` 发请求 ✓（`lib/chat.ts`）
   - 流式逐字 mock / 真 SSE

2. **BYOK 本地 relay**
   - ~~`sk-nodeai-{app}` 解析 + chat 转发骨架~~ ✓ Phase B
   - Keychain 来源、真实 Provider 上游
   - RTK/Caveman 指标 stub

3. **其他**
   - `prototypes/auth.html` → Tauri 路由或独立窗口
   - 模型目录弹窗（`modelCatalogModal`）
   - SQLite 记忆、系统托盘正式 API

---

## 实现时必读原型位置

| 功能 | 原型文件 | 关键词 |
|------|----------|--------|
| Chat 啊哈 / starters | `prototypes/dashboard.html` | `appendAhaReply`, `renderChatStarters`, `STARTER_PROMPTS` |
| 发送消息 | 同上 | `sendBtn`, `chatInput`, `chatMessages` |
| BYOK 演示 | 同上 | `SOURCES`, `isByokOnly`, `path: 'local'` |
| 代理端口 | 同上 | `getGatewayPort`, `saveGatewayPort` |

React 对应目录：`apps/desktop/src/views/ChatView.tsx`、`state/AppContext.tsx`。

---

## 建议任务顺序（本会话约定）

```
Phase A — Chat 激活路径（TTFV）
  A1. 发送消息 → 追加 user/assistant 消息（可先非流式 mock）
  A2. 首条成功后：aha-banner + localStorage + markFirstChatDone
  A3. starters 仅在未完成首次对话时显示
  A4. （可选）模拟流式逐字输出

Phase B — BYOK 边缘
  B1. App Key 解析 sk-nodeai-{app}
  B2. 配置：来源列表占位 + 路由到 mock 上游或 echo
  B3. chat/completions 转发骨架（reqwest），不含额度仍 503 或分路径
```

---

## 验证命令

```bash
# 前端
cd apps/desktop && npm install && npm run build

# Rust
cargo check --workspace

# 代理（需 tauri dev 或单独起 proxy）
curl -s http://127.0.0.1:8787/health
curl -s http://127.0.0.1:8787/v1/models | head

# 改 dashboard 内联脚本后（仅原型文件）
node -e "const fs=require('fs');const h=fs.readFileSync('prototypes/dashboard.html','utf8');const m=h.match(/<script>([\\s\\S]*)<\\/script>\\s*<\\/body>/);new Function(m[1]);console.log('ok')"
```

---

## 同步演示数据的注意

若改 `prototypes/dashboard.html` 内 `BUDGET`/`APPS` 等常量，需重新导出：

```bash
# 在仓库根目录，按需重跑提取脚本（见 git history 或让 agent 重写 node 一行脚本）
# 更新 apps/desktop/src/data/demo.ts、src/i18n/zh.json|en.json
```

---

## 相关计划文档

- 总计划：[docs/superpowers/plans/2026-06-01-nodeai-mvp-implementation.md](superpowers/plans/2026-06-01-nodeai-mvp-implementation.md)
- 开发入口：[README.md](../README.md)

---

## 新会话可复制 Prompt（整段粘贴）

```markdown
你在 NodeAI 仓库（/Users/edwinhao/NodeAI）继续 MVP 开发。

**必须先读：** `docs/CONTINUATION.md`（进度与约束）、`docs/PRD.md`（产品）、`prototypes/dashboard.html`（UI/交互权威对照）。

**本轮目标（按顺序，完成 Phase A 再 Phase B）：**

### Phase A — Chat 激活（TTFV，对齐 PRD §3.6.1）
1. 在 `apps/desktop/src/views/ChatView.tsx` 实现可发送消息（user 气泡追加到列表）。
2. 首次成功回复后展示原型同款 `aha-banner`（文案用 i18n：`ahaTitle`、`ahaSub`、`ahaGo`），写入 `localStorage` 键 `nodeai-first-chat-done`，并调用已有 `markFirstChatDone()`。
3. 未完成首次对话时显示 starters（对照原型 `STARTER_PROMPTS` / `renderChatStarters`）。
4. 回复可先用本地 mock 文本（不必接真模型）；可选：模拟流式逐字显示。
5. 严格遵循 `nodeai-ui-copy`：用户界面不出现 BYOK、RTK 等内部词。

### Phase B — BYOK 边缘（A 完成后再做）
1. `crates/nodeai-proxy`：解析 `Authorization: Bearer sk-nodeai-{app}`，本地记录 app id。
2. `POST /v1/chat/completions`：BYOK 路径转发骨架（reqwest → 可配置上游 URL）；含额度路径保持 503 或占位，直到云端 API 就绪。
3. 行为与 PRD §5.12 / §6.1.1 一致：BYOK 推理不经 NodeAI 服务器。

**规范：**
- UI/布局/类名对照 `prototypes/dashboard.html`，不要发明新 IA。
- 改 `apps/desktop` 后运行 `npm run build` 与 `cargo check --workspace`。
- 不要 git commit，除非我明确要求。

完成后简要说明：改了哪些文件、如何手动验证（含首次对话啊哈条步骤）。
```
