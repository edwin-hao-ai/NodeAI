# NodeAI 项目任务清单

**版本：** 0.1.0  
**最后更新：** 2026-06-03（菜单栏托盘 HUD 独立小窗）  
**最新打包：** （待 `tray-hud` 构建后更新 commit）

| 产物 | 路径 |
|------|------|
| macOS App | 打开 DMG 后拖入「应用程序」；打包后 `.app` 可能被清理，以 DMG 为准 |
| DMG | `~/.cargo/shared-target/release/bundle/dmg/NodeAI_0.1.0_aarch64.dmg`（托盘关窗隐藏 + Popover 锚定盾牌） |

> **诚实说明：** 后端 L1/L2 脚本可通过，但 **桌面 UI 与 `prototypes/` 仍有差距**（见下方「UI 原型对齐 · 未完成」）。勿将 tasks 中 ☑️ 等同于「用户验收无 bug」。

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
| ☑️ | CI 流水线（GitHub Actions 自动测试） |

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
| ☑️ | **Prune LLM 摘要**（`prune: true` + Cloud token 时用 gemini-2.5-flash） |
| ☑️ | Prune 启发式摘要回退（无 token / LLM 失败时） |
| ☑️ | Prune E2E curl 脚本（`scripts/test_prune.sh`） |
| ☑️ | Agent FS E2E（`scripts/test_agent.sh` → runtime 单测） |
| ☑️ | BYOK 格式转换（`nodeai-runtime` → `byok.rs` OpenAI/Anthropic/Gemini） |
| ☑️ | 混合 Fallback（BYOK 失败 → 含额度；默认关 + 设置二次确认 + 双 Header） |

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
| ☑️ | Agent 本地 FS：`read_file` / `write_file` / `list_dir` / `delete_file`（工作区沙箱） |
| ☑️ | Tauri commands：`agent_*` + `pick_agent_workspace`（dialog） |
| ☑️ | 接入 proxy BYOK 出站管道（`nodeai-runtime` format 转换） |
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
| ☑️ | Smart Route 开启时 Chat 请求体 model 与 `resolvedModelForRoute` 一致 |
| ☑️ | Chat `contextWindow` 按 resolved model 查找（非仅 `activeGatewayModel`） |
| ☑️ | Agent `delete_file` + 确认弹窗 |
| ☑️ | Agent **文件夹选择器**（Tauri dialog） |
| ☑️ | Chat **Markdown** 渲染（GFM + 高亮 + 复制 + 流式同渲染） | `ChatMarkdown.tsx` · `hljs-chat.css` · `rehypeHighlight.ts` |
| ☑️ | Agent 写文件 **diff 预览**（确认弹窗） |
| ☑️ | 模型排序「**最新旗舰优先**」（`flagshipScore` + 精选列表） |

**Chat 模块位置：** `apps/desktop/src/lib/chat/`（`api.ts`、`sessions.ts`、`agentLoop.ts`）；状态 `state/ChatContext.tsx`。

---

## 桌面 UI — 其它核心路径

| 状态 | 任务 |
|:----:|------|
| ☑️ | 选模型首屏（VPN 式 Smart Route / 固定模型） |
| ☑️ | 模型目录弹窗（Cloud 价、厂商筛选、排序） |
| ☑️ | Cloud 登录 / 注册页（真实 API） |
| ☑️ | Session 存 Keychain + 侧栏显示 cloudUser |
| ☑️ | 登录态统一（`cloudLoggedIn` + `/v1/nodeai/auth/me` 启动校验） |
| ☑️ | BYOK 零登录本地模式（`authByokOnly` → `localMode` 持久化） |
| ☑️ | 原生托盘 HUD + 总览/对话/账单/打开/退出（`tray.rs` · 左键开 App 内 Popover） |
| ☑️ | 关窗仅隐藏（× / CloseRequested → `hide`）；彻底退出仅托盘「退出」；Dock 点击 `Reopen` 恢复 |
| ☑️ | App 内托盘 Popover 锚定顶栏盾牌按钮（`menubar-tray-anchor`） |
| ☑️ | 菜单栏托盘左键 → 独立 `tray-hud` 小窗（`positioner` TrayBottomCenter）；总览/对话/账单再开主窗口 |
| ☑️ | `countConnectedApps` 无 live 应用时返回 0（去 `|| 1`） |
| ☑️ | GatewayView 移除 demo「模拟 Cursor 已连接」 |
| ☑️ | Hub/Billing 移除重复 LoginPrompt（侧栏已有登录 CTA） |
| ☑️ | ModelsView 场景副标题：目录加载中 / defaultModel slug 回退 |
| ☑️ | 「全自动」文案诚实化（默认模型 + Intent 场景，非 per-request 分类） |
| ☑️ | 托盘 HUD 未登录 / 本地模式诚实文案（无假 ¥48 余额） |
| ☐ | 托盘 sparkline 进原生菜单（macOS 仅 App 内 Popover 有曲线；系统菜单为文字行） |

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
| ☑️ | Hub/Billing **Prune 节省**独立分项行 |
| ☐ | Stripe 订阅 / 升级 | **暂缓** |

---

## UI 原型对齐 · 未完成（对照 `prototypes/dashboard.html` / `auth.html`）

| 状态 | 项 | 说明 |
|:----:|-----|------|
| ☑️ | 登录态 / 模型目录 / 401 清 session | 本轮修复 |
| ☑️ | 账单 path Tab 真 ledger 聚合 | 移除 0.65/0.35 假缩放 |
| ☑️ | Chat 上下文条（回复语言 + live 记忆 + 单对话 prefs → system） | `userPrefs.ts` · `contextStrip.ts` · `contextPref.ts` |
| ☑️ | Tauri 单壳（Overlay titlebar，无内嵌假交通灯） | `tauri.conf.json` · `shell-native-root` |
| ☑️ | 对话侧栏 mini HUD · 设置默认回复语言可用 | `Sidebar.tsx` · `SettingsView.tsx` |
| ☑️ | Chat UX polish（托盘文案、记住这条仅最后条、工作区 popover 外点关闭） | `Menubar.tsx` · `ChatView.tsx` |
| ☑️ | 首聊 celebrate 弹层 | `markFirstChatDone` 触发 |
| ☑️ | Menubar 托盘 sparkline + Hub/Chat/Billing 跳转 | 部分对齐 |
| ☐ | **auth.html 完整 onboarding** | persona 网格、ROI 预览、回复语言、套餐预览 |
| ☐ | **账单页** 趋势图 / donut / 应用×模型矩阵 / 折叠明细 | 仅 hero + 表 |
| ☐ | **Hub** apiCapGrid、按模型 stack、sparkline 速率 | 部分静态文案已改 |
| ☑️ | **设置** 回复语言 / BYOK 路由 / 外部 Agent 写记忆 / 预算告警 | `userPrefs` + `CompressionProfile` 扩展；8787 记忆写入门禁；`budgetAlert.ts` |
| ☑️ | **Plan** 试用静态标签（14 天 · 无 Stripe 倒计时 API） | |
| ☐ | **Plan** 试用剩余天数真 API、商业透明三块 | |
| ☑️ | 生产路径移除 `demoModelPool` 导出 | `lib/model/index.ts` |
| ☐ | **OAuth** Google/GitHub | 按钮仍走邮箱登录 |
| ☐ | **Release 开箱 E2E** | DMG + Cloud sidecar 人工验收 |
| ☐ | **桌面 UI E2E** | Playwright / Tauri WebDriver |

---

## 测试

### 自动化（已有脚本）

| 状态 | 层级 | 命令 | 需要密钥 | 说明 |
|:----:|------|------|----------|------|
| ☑️ | L1 Rust 单元 | `cargo test -p nodeai-core -p nodeai-proxy -p nodeai-runtime` | 否 | RTK/Caveman/**Prune**、Smart Route、**Agent FS**、format |
| ☑️ | L1 wiremock 集成 | 同上（`tests/gateway_local.rs`） | 否 | 429 Failover、Embeddings、BYOK mock |
| ☑️ | L1 前端单元 | `cd apps/desktop && npm test` | 否 | SSE（含 tool_calls delta）、附件拼装 |
| ☑️ | L2 前端构建 | `cd apps/desktop && npm run build` | 否 | TypeScript + Vite |
| ☑️ | L2 代理 Smoke | `./scripts/test_integration.sh` | 可选 Gateway | 需 8787；读 `cloud.configured` |
| ☑️ | L2 Prune E2E | `./scripts/test_prune.sh` | 否 | 需 8787 + prune header |
| ☑️ | L2 Agent / BYOK | `./scripts/test_agent.sh` / `test_byok.sh` | 否 | runtime FS + wiremock 格式 |
| ☑️ | L3 Live Gateway | `cargo test -p nodeai-proxy -- --ignored live_` | 是 | 真 Vercel Gateway |
| ☑️ | 一键本地 | `./scripts/test_local.sh` | 否 | 串联 L1–L2 |

### E2E（端到端）

| 状态 | 场景 | 方式 | 最近结果 |
|:----:|------|------|----------|
| ☑️ | 注册 → 登录 → 模型目录 | curl 经 8787 | **通过**（286 模型） |
| ☑️ | 流式 Chat（含额度路径） | curl SSE | **通过** |
| ☑️ | **长对话 / Prune** | `./scripts/test_prune.sh` | **脚本化**（需 8787） |
| ☑️ | **Agent 读写删文件** | `scripts/test_agent.sh` + Tauri 人工 | **runtime 单测 + 人工** |
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
| ☑️ | macOS aarch64 | `npm run tauri build` → `.app` + `.dmg`（2026-06-02 含 Prune LLM / Agent delete / Markdown / 工作区选择器） |
| ☑️ | 应用图标 | Node Dial 品牌 |
| ☐ | macOS x86_64 | 未测 |
| ☐ | Windows | 未打包 |
| ☐ | 自动更新 | 未做 |

---

## 产品 / PRD 对齐（v0.1 范围外）

| 状态 | 任务 |
|:----:|------|
| ☐ | IDE MITM 桥接 |
| ☐ | Prune 全自动默认 ON 策略 A/B |
| ☐ | 团队策略 / 多成员 |
| ☐ | 云端 Memory 同步 |
| ☐ | OAuth 矩阵 |

---

## 建议下一步（优先级 · 本地可用优先）

1. **Release 开箱 E2E**：DMG → 登录 → Chat → Agent → Prune（需 8788）
2. **桌面 UI E2E**：Playwright / Tauri WebDriver
3. **模型排序**：真机目录验收精选列表
4. **（暂缓）** Stripe、远程 Cloud、Gemini 原生 API 全路径

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
