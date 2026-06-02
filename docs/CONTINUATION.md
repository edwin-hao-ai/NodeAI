# NodeAI 开发接续说明（Agent / 新会话用）

**最后更新：** 2026-06-02  
**用途：** 在新 Cursor 会话中恢复上下文，避免重复探索。

---

## 产品约束（不可违背）

见 [docs/PRD.md](PRD.md)、[.cursor/rules/nodeai-product.mdc](../.cursor/rules/nodeai-product.mdc)、[.cursor/rules/nodeai-architecture.mdc](../.cursor/rules/nodeai-architecture.mdc)。

**用户规则：** 默认**不要** `git commit`，除非用户明确要求。

---

## 仓库结构

```
NodeAI/
├── apps/desktop/          # Tauri 2 + React 19
│   └── src/lib/
│       ├── gateway/       # Gateway API + 字段归一化（定价）
│       ├── model/         # GatewayModel、pool、pricing
│       ├── catalog/       # 目录 UI 逻辑
│       ├── chat/          # SSE 流式 + 请求头
│       └── route/         # VPN 线路展示
├── crates/nodeai-core/    # Bonus(RTK/Caveman)、intent 映射、配置
├── crates/nodeai-proxy/   # 8787 边缘：Gateway 转发、Bonus 管道、SQLite 用量
└── prototypes/            # dashboard.html 对照源
```

---

## 已完成（MVP 当前）

| 能力 | 说明 |
|------|------|
| **Vercel AI Gateway** | `.env` `AI_GATEWAY_API_KEY`；279 模型；**定价来自 Gateway live API（USD/1M）** |
| **8787 代理** | health、models、chat（含 SSE 透传）、usage、bonus 配置 |
| **RTK + Caveman L1** | 出站前压缩/简洁 system；`x-nodeai-bonus` 头；`/v1/nodeai/usage` 分项 |
| **Smart Route（代理层）** | `X-NodeAI-Intent` + `X-NodeAI-Smart-Route` → 按场景改 model |
| **Chat** | 真 SSE 流式；记忆注入 header；首次 Chat 激活 |
| **SQLite 用量** | `~/.nodeai/usage.db` 持久化 app 计数 + bonus 指标 |
| **UI** | 模型目录（Gateway 价、厂商筛选吸顶）、设置↔bonus API、Hub/Billing 读 live metrics |

---

## 仍待做

- NodeAI Cloud 鉴权计费（当前含额度直连 Gateway）
- Keychain BYOK、Embeddings、`nodeai-runtime`
- Chat 附件、Agent 工具确认、系统托盘 HUD
- macOS/Windows CI 打包签名
- 429 Gateway Failover

---

## 验证

```bash
cd apps/desktop && npm run build
cargo test -p nodeai-core -p nodeai-proxy
cargo test -p nodeai-proxy -- --ignored live_   # 需 .env Gateway key
./scripts/test_integration.sh                   # 或 NODEAI_PROXY_URL=...
cd apps/desktop && npm run tauri dev
```

**手动：** 对话发消息应看到逐字 SSE；`curl /v1/nodeai/usage` 重启后仍保留计数（SQLite）。
