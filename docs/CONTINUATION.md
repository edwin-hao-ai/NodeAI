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
├── apps/desktop/          # Tauri 2 + React 19 + Vite（9 视图 + auth + 模态）
├── crates/nodeai-core/    # 配置、模型别名类型
├── crates/nodeai-proxy/   # 8787：health、models、BYOK chat、usage 计数
├── prototypes/            # dashboard.html、auth.html（对照源）
└── docs/superpowers/plans/2026-06-01-nodeai-mvp-implementation.md
```

**Chat（Phase A ✓）**
- 发送、starters、啊哈条、`nodeai-first-chat-done`、8787 + `sk-nodeai-chat`
- 流式逐字 mock（`streamText.ts`）
- 「记住这条」→ localStorage 记忆库

**BYOK 边缘（Phase B 骨架 ✓）**
- `sk-nodeai-{app}` 解析、BYOK mock/转发、`NODEAI_BYOK_UPSTREAM`
- 含额度路径 503；`GET /v1/nodeai/usage` 按 app 计数

**UI 交互（对齐原型 · 演示数据）**
- 模型目录弹窗、添加应用、添加模型来源、Cursor 庆祝弹窗
- 记忆 CRUD、套餐 PLANS 卡片、账单 path 缩放、总览 onboarding 步骤
- Auth 视图（登录/注册演示）、工作区轮换、设置登出→auth

### 刻意未做（下一阶段）

1. **真实推理 / 云端**
   - 含额度 → NodeAI Cloud → Vercel Gateway
   - SSE 真流式、Embeddings、RTK/Caveman 指标

2. **持久化 / 安全**
   - SQLite（memories、usage_daily、requests）
   - Keychain BYOK Key、Tauri 文件夹选择器

3. **其他**
   - Chat 附件、Agent 读/写确认
   - 系统托盘 HUD、macOS/Windows CI 打包签名

---

## 验证命令

```bash
cd apps/desktop && npm run build
cargo check --workspace && cargo test -p nodeai-proxy
curl -s http://127.0.0.1:8787/health
curl -s http://127.0.0.1:8787/v1/nodeai/usage
cd apps/desktop && npm run tauri dev
```

---

## 手动验证要点

1. **啊哈条**：清 `nodeai-first-chat-done` → 对话发消息 → 流式回复 + 啊哈条
2. **模型目录**：选模型页「浏览全部」或侧栏更多 → 浏览模型
3. **连接庆祝**：连接页「演示连接 Cursor」→ 庆祝弹窗
4. **记忆**：对话「记住这条」或记忆页添加
5. **用量**：`curl -H "Authorization: Bearer sk-nodeai-cursor" .../chat/completions` 后查 `/v1/nodeai/usage`
