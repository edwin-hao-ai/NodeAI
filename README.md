# NodeAI

桌面 **AI Token 用量中枢** — 选模型为首屏，内置对话为快捷入口；`8787` 边缘代理 + 含额度云端 / 自有 Key 本地双路径。

- 产品规格：[docs/PRD.md](docs/PRD.md)
- 设计系统：[DESIGN.md](DESIGN.md)
- 交互原型：`prototypes/dashboard.html`、`prototypes/auth.html`
- **实现计划**：[docs/superpowers/plans/2026-06-01-nodeai-mvp-implementation.md](docs/superpowers/plans/2026-06-01-nodeai-mvp-implementation.md)
- **新会话接续**：[docs/CONTINUATION.md](docs/CONTINUATION.md)（含可复制 Prompt）

## 仓库结构

```
NodeAI/
├── apps/desktop/          # Tauri 2 + React（主 UI）
├── crates/
│   ├── nodeai-core/       # 配置、模型别名、共享类型
│   └── nodeai-proxy/      # 127.0.0.1:8787 OpenAI 兼容边缘代理
├── prototypes/            # HTML 高保真原型（对照用）
└── docs/PRD.md
```

## 开发

**前置：** Rust stable、Node 20+

```bash
cd apps/desktop
npm install
npm run tauri dev
```

仅前端（浏览器，无 Tauri / 代理）：

```bash
cd apps/desktop && npm run dev
```

Rust 检查（workspace）：

```bash
cargo check --workspace
```

## 当前进度（v0.1 脚手架）

- [x] Tauri 2 + React 应用壳层（导航 / i18n / M3 主题 token）
- [x] `nodeai-proxy`：`/health`、`/v1/models`、`/v1/chat/completions`（云端中继待接）
- [ ] 按原型逐页迁移 UI（总览、对话、连接、账单、设置…）
- [ ] SQLite 记忆、Keychain、BYOK Runtime、云端 API

原型仍可作为视觉与文案对照；新功能以 `apps/desktop` 为准实现。
