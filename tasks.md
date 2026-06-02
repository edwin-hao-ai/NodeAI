# NodeAI 项目任务清单

**版本：** 0.1.0  
**最后更新：** 2026-06-02  
**最新打包：** `NodeAI_0.1.0_aarch64.dmg`（6.3 MB，2026-06-02 15:33 构建）

| 产物 | 路径 |
|------|------|
| macOS App | `/Users/edwinhao/.cargo/shared-target/release/bundle/macos/NodeAI.app` |
| DMG | `/Users/edwinhao/.cargo/shared-target/release/bundle/dmg/NodeAI_0.1.0_aarch64.dmg` |

> **当前阶段：** Cloud API **仅 localhost**（`http://127.0.0.1:8788`）。桌面 / 8787 代理默认连此地址；使用前须先启动 `nodeai-cloud-dev`。暂无远程生产部署。

> **维护约定：** 完成功能 / 测试 / 打包变更后须更新本文件（见 `.cursor/rules/nodeai-tasks.mdc`）。Chat Agent、Prune、Bonus 子项不可只改代码不更新表格。

---

## 架构与基础设施

| 状态 | 任务 |
|:----:|------|
| ☑️ | Cargo workspace（`nodeai-core`、`nodeai-cloud`、`nodeai-proxy`、`nodeai-runtime`） |
| ☑️ | Tauri 2 + React 19 桌面壳（8787 内嵌代理） |
| ☑️ | 中英文 i18n + 原型 CSS 迁移 |
| ☑️ | 客户端默认 Cloud URL = `http://127.0.0.1:8788`（`NODEAI_CLOUD_BASE_URL` 可覆盖） |
| ☑️ | 一键本地 `./scripts/dev.sh`（Cloud + Tauri dev） |
| ☑️ | Debug 自动启动 `nodeai-cloud-dev`（8788 未监听时） |
| ☑️ | `/health` 返回 Cloud `reachable` / `gateway_registry` |
| ☐ | NodeAI Cloud **远程生产**部署（未来再做，当前不做） |
| ☐ | macOS / Windows **代码签名**与公证 |
| ☐ | CI 流水线（GitHub Actions 自动测试 + 打包） |

---

## 8787 边缘代理（nodeai-proxy）

| 状态 | 任务 |
|:----:|------|
| ☑️ | 监听 `127.0.0.1:8787`，`/health` |
| ☑️ | `GET /v1/models` — 有 Session 时经 Cloud → Gateway 全量目录 |
| ☑️ | 无 Session 时返回 401（不再 silent 回退 5 条假模型） |
| ☑️ | `POST /v1/chat/completions` — Cloud relay + **SSE 流式透传** |
| ☑️ | `POST /v1/embeddings` — Cloud relay |
| ☑️ | `GET/PUT /v1/nodeai/bonus` — RTK / Caveman / **Prune** / Smart Route / Failover 配置 |
| ☑️ | `GET /v1/nodeai/usage` — 按 App 计数 + Bonus 指标 |
| ☑️ | RTK 智能压缩 + Caveman L1 + 记忆注入（出站管道） |
| ☑️ | **Prune 上下文整理** — token 预算裁剪（`apply_context_management`，始终） |
| ☑️ | **Prune 旧消息摘要** — 设置 `prune: true` 时注入 system 摘要块 |
| ☑️ | Prune 读 `X-NodeAI-Context-Window` + 目录 `context_window` / `guess_context_window` |
| ☑️ | Prune 指标写入 `x-nodeai-bonus`（`prune` / `prune_saved`） |
| ☑️ | Smart Route（`X-NodeAI-Intent` + 虚拟模型 alias 解析） |
| ☑️ | 429/503 Failover → `google/gemini-2.5-flash` |
| ☑️ | 用量 ledger + period 聚合 + 预算 |
| ☑️ | Chat 完成后记录 token/花费（流式 SSE 包装 + JSON usage 解析） |
| ☑️ | Memory SQLite API（`GET/POST/DELETE /v1/nodeai/memories`） |
| ☑️ | App Key 解析 `sk-nodeai-{app}` + 用量归因 |
| ☑️ | BYOK 路径（`X-NodeAI-Path: byok` + Keychain / sources.json） |
| ☑️ | `POST /v1/nodeai/auth/login` + `/register` → 转发 Cloud |
| ☐ | Prune **LLM 摘要**（当前为启发式 bullet 摘要，非小模型） |
| ☐ | Prune / Agent 专项 E2E curl 脚本 |
| ☐ | BYOK 完整格式转换（接 `nodeai-runtime`，目前直连 OpenAI 形态） |
| ☐ | 混合 Fallback（自有 Key 失败回落含额度，默认关 + 二次确认） |

**Prune 实现位置：** `crates/nodeai-core/src/bonus.rs` → `apply_context_management`；管道 `nodeai-proxy/src/routes.rs` + `pipeline.rs`。

---

## NodeAI Cloud（nodeai-cloud）

| 状态 | 任务 |
|:----:|------|
| ☑️ | Cloud API 客户端（models / chat / embeddings relay） |
| ☑️ | 本地 dev 服务 `nodeai-cloud-dev`（`:8788`） |
| ☑️ | Gateway Key **仅服务端**（`AI_GATEWAY_API_KEY` in `~/.nodeai/.env`） |
| ☑️ | SQLite 真实账号（register / login / session 校验） |
| ☑️ | Chat SSE 流式透传（不再整包 buffer） |
| ☑️ | 虚拟模型 alias 解析（`nodeai-auto` 等 → Gateway slug） |
| ☐ | 生产 Cloud API 部署与运维 |
| ☐ | OAuth（Google / GitHub） |
| ☐ | Stripe 订阅 / PlanView 真付款 | **暂缓**（本地开发阶段不做） |

---

## nodeai-runtime

| 状态 | 任务 |
|:----:|------|
| ☑️ | Crate 骨架（`format` OpenAI↔Anthropic/Gemini 转换） |
| ☑️ | Agent 本地 FS：`read_file` / `write_file` / `list_dir`（工作区沙箱） |
| ☑️ | Tauri commands：`agent_default_workspace` / `agent_ensure_workspace` / `agent_execute_tool` |
| ☐ | 接入 proxy BYOK 出站管道（格式转换仍 stub） |
| ☐ | Agent `delete_file` + 确认流 |
| ☐ | Shell / 其它工具（Post-MVP） |

**Agent 实现位置：** `crates/nodeai-runtime/src/agent.rs`；桌面 `apps/desktop/src-tauri/src/lib.rs`；前端 `lib/chat/agentLoop.ts`、`agentInvoke.ts`、`tools.ts`。

---

## 桌面 UI — Chat 与 Agent

| 状态 | 任务 |
|:----:|------|
| ☑️ | Chat 发消息 + SSE 流式 + thinking 块 |
| ☑️ | Chat **多轮上下文**（`toApiMessages` → 8787 全量历史） |
| ☑️ | Chat **多会话**（新建 / 切换 / `localStorage`） |
| ☑️ | Chat 附件（文件 / 图片 multimodal） |
| ☑️ | 未登录拦截 + 错误 Toast |
| ☑️ | 首次 Chat 激活（aha-banner） |
| ☑️ | ChatView 去 demo；用量 / 记忆条接 live |
| ☑️ | **Agent 工具循环**（`runAgentChat`，SSE `tool_calls`，最多 8 轮） |
| ☑️ | **write_file 确认弹窗**（`AgentWriteConfirm.tsx`） |
| ☑️ | 工具 UI（tool chip + tool 结果块） |
| ☑️ | 设置 ↔ `agentEnabled`（默认开，`nodeai-agent-enabled`） |
| ☑️ | 工作区 chip + 默认 `~/Documents/NodeAI`（Tauri 创建目录） |
| ☑️ | 设置 ↔ Bonus API 同步（含 **Prune 开关**） |
| ☑️ | 传 `contextWindow` 给 8787（Prune 用） |
| ☐ | Chat **Markdown** 渲染 |
| ☐ | Agent **文件夹选择器**（`tauri-plugin-dialog`，当前仅 cycle 预设路径） |
| ☐ | Agent 写文件确认卡内展示 diff 预览 |
| ☐ | 模型排序「最新旗舰优先」 |

**Chat 模块位置：** `apps/desktop/src/lib/chat/`（`api.ts`、`sessions.ts`、`agentLoop.ts`）；状态 `state/ChatContext.tsx`。

---

## 桌面 UI — 其它核心路径

| 状态 | 任务 |
|:----:|------|
| ☑️ | 选模型首屏（VPN 式 Smart Route / 固定模型） |
| ☑️ | 模型目录弹窗（Cloud 价、厂商筛选、排序） |
| ☑️ | Cloud 登录 / 注册页（真实 API） |
| ☑️ | Session 存 Keychain + 侧栏显示 cloudUser |
| ☑️ | 原生托盘（打开 / 退出） |

---

## 桌面 UI — 仍用演示数据（待接真实 API）

| 状态 | 视图 | 待接 |
|:----:|------|------|
| ☑️ | HubView 总览 | `/v1/nodeai/usage` 实时面板 |
| ☑️ | BillingView 账单 | 本地 ledger + period 聚合 |
| ☑️ | PlanView 套餐 | Cloud plan + 本地预算（Stripe 暂缓） |
| ☑️ | GatewayView | 真实连接状态 |
| ☑️ | Menubar HUD | live 请求数 / 预算 / 省钱 |
| ☑️ | MemoryView | SQLite via `/v1/nodeai/memories` |
| ☑️ | SourcesView hosted | 产品配置非 DEMO 假 Key |
| ☐ | Hub/Billing **Prune 节省**独立分项行（账单 copy 已有占位） |
| ☐ | Stripe 订阅 / 升级 | **暂缓** |

---

## 测试

### 自动化（已有脚本）

| 状态 | 层级 | 命令 | 需要密钥 | 说明 |
|:----:|------|------|----------|------|
| ☑️ | L1 Rust 单元 | `cargo test -p nodeai-core -p nodeai-proxy -p nodeai-runtime` | 否 | RTK/Caveman/**Prune**、Smart Route、**Agent FS**、format |
| ☑️ | L1 wiremock 集成 | 同上（`tests/gateway_local.rs`） | 否 | 429 Failover、Embeddings、BYOK mock |
| ☑️ | L1 前端单元 | `cd apps/desktop && npm test` | 否 | SSE（含 tool_calls delta）、附件拼装 |
| ☑️ | L2 前端构建 | `cd apps/desktop && npm run build` | 否 | TypeScript + Vite |
| ☑️ | L2 代理 Smoke | `./scripts/test_integration.sh` | 可选 Gateway | 需 8787；**脚本仍读旧 `gateway.configured` 字段，待修** |
| ☑️ | L3 Live Gateway | `cargo test -p nodeai-proxy -- --ignored live_` | 是 | 真 Vercel Gateway |
| ☑️ | 一键本地 | `./scripts/test_local.sh` | 否 | 串联 L1–L2 |

### E2E（端到端）

| 状态 | 场景 | 方式 | 最近结果 |
|:----:|------|------|----------|
| ☑️ | 注册 → 登录 → 模型目录 | curl 经 8787 | **通过**（286 模型） |
| ☑️ | 流式 Chat（含额度路径） | curl SSE | **通过** |
| ☐ | **长对话 / Prune** | App 或 curl 超长 messages | **未脚本化** |
| ☐ | **Agent 读写文件** | Tauri App → write 确认 → 磁盘验证 | **未脚本化** |
| ☐ | 桌面 App UI E2E | Playwright / Tauri WebDriver | **未做** |
| ☐ | Release 包开箱 E2E | DMG → 登录 → Chat → Agent | 需 **8788 Cloud dev** |
| ☐ | BYOK 全路径 E2E | sources + Keychain → chat | wiremock 有；真机未脚本化 |

**本地 E2E 前置：**

```bash
# 终端 1
cargo run -p nodeai-cloud --bin nodeai-cloud-dev --release

# 终端 2（可选）
cargo run -p nodeai-proxy --bin nodeai-proxy-standalone --release

# 或
./scripts/dev.sh
```

改完 8787 代理后须 **重新编译 proxy**（Tauri dev 内嵌或 standalone）Prune 才生效。

---

## 打包

| 状态 | 平台 | 说明 |
|:----:|------|------|
| ☑️ | macOS aarch64 | `npm run tauri build` → `.app` + `.dmg` |
| ☑️ | 应用图标 | Node Dial 品牌 |
| ☐ | macOS x86_64 | 未测 |
| ☐ | Windows | 未打包 |
| ☐ | 自动更新 | 未做 |

---

## 产品 / PRD 对齐（v0.1 范围外）

| 状态 | 任务 |
|:----:|------|
| ☐ | IDE MITM 桥接 |
| ☐ | Prune LLM 摘要 + 全自动默认 ON 策略 A/B |
| ☐ | 团队策略 / 多成员 |
| ☐ | 云端 Memory 同步 |
| ☐ | OAuth 矩阵 |

---

## 建议下一步（优先级 · 本地可用优先）

1. **验证新能力**：`./scripts/dev.sh` → 长对话（Prune）→ Agent 写 `~/Documents/NodeAI` 下文件
2. **补 E2E 脚本**：Prune 超长 payload curl；Agent 写文件人工 checklist → 脚本
3. **模型排序**：精选列表「各厂商最新旗舰优先」
4. **Chat Markdown** + Agent 文件夹 dialog
5. **修** `./scripts/test_integration.sh` health 字段（`cloud.configured`）
6. **（暂缓）** Stripe、远程 Cloud、BYOK 格式转换全链路

---

## 相关文档

| 文档 | 用途 |
|------|------|
| **`tasks.md`（本文件）** | 任务 / 测试看板 — **Agent、Prune、Chat 变更必更新** |
| `.cursor/rules/nodeai-tasks.mdc` | Cursor 何时 / 如何改 tasks.md |
| `.cursor/rules/nodeai-product.mdc` | 产品口径（Bonus、Agent 工作区） |
| `.cursor/rules/nodeai-architecture.mdc` | 分层与文件落点 |
| `docs/PRD.md` | §5.1 Chat+Agent、§5.7 RTK/Caveman/Prune |
| `docs/CONTINUATION.md` | 新会话快速恢复 |
| `docs/TESTING.md` | 测试命令细节 |
