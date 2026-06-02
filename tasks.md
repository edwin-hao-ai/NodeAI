# NodeAI 项目任务清单

**版本：** 0.1.0  
**最后更新：** 2026-06-02  
**最新打包：** `NodeAI_0.1.0_aarch64.dmg`（6.3 MB，2026-06-02 15:33 构建）

| 产物 | 路径 |
|------|------|
| macOS App | `/Users/edwinhao/.cargo/shared-target/release/bundle/macos/NodeAI.app` |
| DMG | `/Users/edwinhao/.cargo/shared-target/release/bundle/dmg/NodeAI_0.1.0_aarch64.dmg` |

> **当前阶段：** Cloud API **仅 localhost**（`http://127.0.0.1:8788`）。桌面 / 8787 代理默认连此地址；使用前须先启动 `nodeai-cloud-dev`。暂无远程生产部署。

---

## 架构与基础设施

| 状态 | 任务 |
|:----:|------|
| ☑️ | Cargo workspace（`nodeai-core`、`nodeai-cloud`、`nodeai-proxy`、`nodeai-runtime`） |
| ☑️ | Tauri 2 + React 19 桌面壳（8787 内嵌代理） |
| ☑️ | 中英文 i18n + 原型 CSS 迁移 |
| ☑️ | 客户端默认 Cloud URL = `http://127.0.0.1:8788`（`NODEAI_CLOUD_BASE_URL` 可覆盖） |
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
| ☑️ | `GET/PUT /v1/nodeai/bonus` — RTK / Caveman / Smart Route / Failover 配置 |
| ☑️ | `GET /v1/nodeai/usage` — 按 App 计数 + Bonus 指标 |
| ☑️ | RTK 智能压缩 + Caveman L1 + 记忆注入（出站管道） |
| ☑️ | Smart Route（`X-NodeAI-Intent` + 虚拟模型 alias 解析） |
| ☑️ | 429/503 Failover → `google/gemini-2.5-flash` |
| ☑️ | 用量 ledger + period 聚合 + 预算 | `GET /v1/nodeai/usage` 扩展（SQLite `request_ledger`） |
| ☑️ | Chat 完成后记录 token/花费 | 流式 SSE 包装 + JSON usage 解析 |
| ☑️ | Memory SQLite API | `GET/POST/DELETE /v1/nodeai/memories` |
| ☑️ | App Key 解析 `sk-nodeai-{app}` + 用量归因 |
| ☑️ | BYOK 路径（`X-NodeAI-Path: byok` + Keychain / sources.json） |
| ☑️ | `POST /v1/nodeai/auth/login` + `/register` → 转发 Cloud |
| ☐ | BYOK 完整格式转换（接 `nodeai-runtime`，目前直连 OpenAI 形态） |
| ☐ | 混合 Fallback（自有 Key 失败回落含额度，默认关 + 二次确认） |

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
| ☐ | 云端计费 / Stripe 对接 |

---

## nodeai-runtime

| 状态 | 任务 |
|:----:|------|
| ☑️ | Crate 骨架（`format` OpenAI↔Anthropic/Gemini 转换） |
| ☑️ | Agent 工具链占位（read/write/list_dir stub） |
| ☐ | 接入 proxy BYOK 出站管道 |
| ☐ | Agent 工具 v1（读/写文件 + 用户确认 UI） |

---

## 桌面 UI — 核心路径

| 状态 | 任务 |
|:----:|------|
| ☑️ | 选模型首屏（VPN 式 Smart Route / 固定模型） |
| ☑️ | 模型目录弹窗（Cloud 价、厂商筛选、排序） |
| ☑️ | Cloud 登录 / 注册页（真实 API，非 Demo Session） |
| ☑️ | Session 存 Keychain + 侧栏显示 cloudUser |
| ☑️ | Chat 发消息 + 消息列表 |
| ☑️ | Chat **SSE 流式**输出 |
| ☑️ | Chat thinking 块 UI（`reasoning_content` / `reasoning` / `thinking`） |
| ☑️ | 未登录拦截 + 错误 Toast（去掉 demo 假回复） |
| ☑️ | 首次 Chat 激活（aha-banner + `nodeai-first-chat-done`） |
| ☑️ | Chat 附件（文件 / 图片 multimodal） |
| ☑️ | 设置页 ↔ Bonus API 同步 |
| ☑️ | 原生托盘（打开 / 退出） |
| ☐ | 模型排序「最新旗舰优先」（当前：精选=API 顺序每厂商第一个；全部=ID 字母序） |
| ☐ | Chat Markdown 渲染 |
| ☐ | Agent 工具卡片（读/写文件确认流） |

---

## 桌面 UI — 仍用演示数据（待接真实 API）

| 状态 | 视图 | 待接 |
|:----:|------|------|
| ☑️ | HubView 总览 | `/v1/nodeai/usage` 实时面板（预算/ledger/sparkline） |
| ☑️ | BillingView 账单 | 本地 ledger + period 聚合（Cloud 账单 API 仍待） |
| ☑️ | PlanView 套餐 | Cloud 用户 plan + 本地用量预算（Stripe 升级待） |
| ☑️ | GatewayView | 真实连接状态（首包检测，去掉模拟连接按钮） |
| ☑️ | Menubar HUD | live 请求数 / 预算 / 省钱 |
| ☑️ | ChatView | 去掉 demo 消息块；历史 localStorage 持久化 |
| ☑️ | MemoryView | SQLite via `GET/POST /v1/nodeai/memories` |
| ☑️ | SourcesView hosted | 产品配置非 DEMO 假 Key |
| ☐ | Chat Markdown 渲染 | — |
| ☐ | Stripe 订阅 / 升级 | Cloud 计费 API |

---

## 测试

### 自动化（已有脚本）

| 状态 | 层级 | 命令 | 需要密钥 | 说明 |
|:----:|------|------|----------|------|
| ☑️ | L1 Rust 单元 | `cargo test -p nodeai-core -p nodeai-proxy -p nodeai-runtime` | 否 | RTK/Caveman、Smart Route、虚拟模型、format 转换 |
| ☑️ | L1 wiremock 集成 | 同上（`tests/gateway_local.rs`） | 否 | 429 Failover、Embeddings、BYOK 转发 mock |
| ☑️ | L1 前端单元 | `cd apps/desktop && npm test` | 否 | SSE 解析、附件拼装、reasoning delta |
| ☑️ | L2 前端构建 | `cd apps/desktop && npm run build` | 否 | TypeScript + Vite 生产构建 |
| ☑️ | L2 代理 Smoke | `./scripts/test_integration.sh` | 可选 Gateway | 需 8787 已启动；测 health/models/bonus/usage |
| ☑️ | L3 Live Gateway | `cargo test -p nodeai-proxy -- --ignored live_` | 是 | 真 Vercel Gateway chat/models |
| ☑️ | 一键本地 | `./scripts/test_local.sh` | 否（`--live` 需 key） | 串联 L1–L2，代理在跑时加 Smoke |

### E2E（端到端）

| 状态 | 场景 | 方式 | 最近结果 |
|:----:|------|------|----------|
| ☑️ | 注册 → 登录 → 模型目录 | curl 经 8787 | **通过**（286 模型，含 Opus 4.8） |
| ☑️ | 流式 Chat（含额度路径） | curl SSE `stream:true` | **通过**（收到 `pong` + `data: [DONE]`） |
| ☐ | 桌面 App UI E2E | Playwright / Tauri WebDriver | **未做**（可补，需 Cloud dev 常驻） |
| ☐ | Release 包开箱 E2E | 安装 DMG → 登录 → Chat | 需先启动 **8788 Cloud dev** |
| ☐ | BYOK 全路径 E2E | 配 sources + Keychain → chat | 部分（wiremock 有；真机未脚本化） |

**本地 E2E 前置条件：**

```bash
# 终端 1：Cloud API（~/.nodeai/.env 需 AI_GATEWAY_API_KEY）
cargo run -p nodeai-cloud --bin nodeai-cloud-dev --release

# 终端 2（可选，若不用 Tauri 内嵌 8787）
cargo run -p nodeai-proxy --bin nodeai-proxy-standalone --release

# 然后打开 App → 侧栏「登录」或设置里注册/登录
```

桌面与 8787 **默认** `http://127.0.0.1:8788`，无需 `NODEAI_CLOUD_DEV`。

---

## 打包

| 状态 | 平台 | 说明 |
|:----:|------|------|
| ☑️ | macOS aarch64 | `npm run tauri build` → `.app` + `.dmg` |
| ☑️ | 应用图标 | Node Dial 品牌（`branding/app-icon.svg` → `tauri icon`） |
| ☐ | macOS x86_64 | 未测 |
| ☐ | Windows | 未打包 |
| ☐ | 自动更新 | 未做 |

---

## 产品 / PRD 对齐（v0.1 范围外）

| 状态 | 任务 |
|:----:|------|
| ☐ | IDE MITM 桥接 |
| ☐ | Prune 自动清理 |
| ☐ | 团队策略 / 多成员 |
| ☐ | 云端 Memory 同步 |
| ☐ | OAuth 矩阵 |

---

## 建议下一步（优先级）

1. **生产 Cloud 部署**：Release DMG 开箱即用
2. **Stripe 订阅**：PlanView 升级按钮接真实支付
3. **模型排序**：精选 / 默认列表改为「各厂商最新旗舰优先」
4. **桌面 UI E2E**：Playwright 覆盖 登录 → 选模型 → Chat 流式
5. **`nodeai-runtime` 接入 BYOK** 格式转换

---

## 相关文档

- [tasks.md](../tasks.md) — **任务/测试看板**（完成工作后须更新，见 `.cursor/rules/nodeai-tasks.mdc`）
- [docs/PRD.md](docs/PRD.md)
- [docs/CONTINUATION.md](docs/CONTINUATION.md)
- [docs/TESTING.md](docs/TESTING.md)
- [docs/superpowers/plans/2026-06-01-nodeai-mvp-implementation.md](docs/superpowers/plans/2026-06-01-nodeai-mvp-implementation.md)
