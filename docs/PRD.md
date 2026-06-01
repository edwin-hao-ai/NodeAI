# NodeAI 产品需求文档 (PRD)

**版本:** v0.1  
**日期:** 2026-05-31  
**状态:** 草案  
**代号:** NodeAI  

---

## 1. 执行摘要

NodeAI 是一款**跨平台桌面 AI 用量中枢**：帮用户用**一个 NodeAI 账号**把 Cursor、Cline、Continue 等应用接到一起，自动识别「谁在调用」、统一账单，并**默认帮你省钱**。

**三套引擎（PRD 完整能力，UI 用通俗说法）：**

| 引擎 | 内部名 | 用户可见 | 作用 |
|------|--------|----------|------|
| 智能路由 | Smart Route | 智能选模型 | 代码/对话/嵌入自动选合适模型 |
| Token 压缩 | RTK / Caveman / Prune | 智能压缩 / 简洁回复 / 上下文整理 | 默认开启，账单展示省了多少钱 |
| 长效记忆 | Memory Layer | 记忆 | Cursor 与 NodeAI 对话共享偏好与项目上下文 |

**Chat 是快捷入口，不是产品全部：** 内置对话 + 轻量 Agent；**核心价值**是 **Token 用量中枢**。**双路径：** ① **含额度** — 桌面 `8787` 边缘 → **NodeAI 云端后端** → Vercel Gateway（上游凭证仅在后端）；② **简易 BYOK** — **桌面本地完全驱动**（路由/压缩/格式转换/直连接用户 Provider），**推理零占用 NodeAI 服务器**。

**用户成长路径：** 小白从 NodeAI 对话 + 含额度起步；随使用深入可连接 IDE、添加 BYOK、启用跨 App 记忆与高级 Fallback — 同一产品覆盖全生命周期，无需换工具。

| 层级 | 体验 | 用户动作 |
|------|------|----------|
| **总览 / 实时面板**（核心感知） | 看见 Cursor 是否在跑、今天省了多少钱、压缩/记忆状态 | 打开即见 |
| **NodeAI 对话**（快捷入口） | 对话 + Agent +「记住这条」 | 不打开 IDE 也能问模型、改文件 |
| **其他应用**（主流量） | 粘贴接入地址 + **该应用专用码** | 按「连接应用」页引导 |

**无「连接开关」：** App 运行 = 网关可用。Phase 1 上游 [Vercel AI Gateway](https://vercel.com/docs/ai-gateway)，UI 仅展示信任徽章。

**参考竞品 [9Router](https://9router.com/) / [decolua/9router](https://github.com/decolua/9router)：** 本地 OpenAI 兼容代理、多 Provider 聚合、**RTK/Caveman Token 压缩**、Combo 三层 Fallback 路由、MITM IDE 桥接。NodeAI **继承压缩与路由思路**，差异化在于：原生桌面 + 小白可懂的 UI、应用级识别与账单、**跨 App 长效记忆**（9Router 未强调）。

---

## 2. 问题陈述

### 2.1 用户痛点

| 角色 | 痛点 |
|------|------|
| 小白用户 | 不知道选哪个模型；配置 Cursor/ChatGPT/各类 Agent 的 Key 太复杂 |
| 轻度开发者 | 多个订阅（Claude/Copilot/Gemini）配额浪费；限流时工作中断 |
| 成本敏感用户 | 简单任务用了昂贵模型；Tool Result 膨胀导致 Token 爆炸 |
| 多应用用户 | 无法知道「哪个 App 花了多少钱」；密钥泄露难以溯源 |

### 2.2 市场机会

9Router 证明了 **本地 AI Router + OpenAI 兼容端点** 的需求（15k+ GitHub Stars），但其目标用户偏开发者 CLI/IDE 场景。

**与 9Router 对照（产品层）：**

| 维度 | 9Router | NodeAI |
|------|---------|--------|
| 借鉴 | localhost 代理、RTK/Caveman 压缩、Combo/Fallback 路由 | 同等压缩与路由引擎（§5.4、§5.7） |
| 目标用户 | 开发者 CLI/IDE | 小白 + 多 IDE 开发者 |
| UI | Dashboard / 技术面板 | 对话 + 可视化账单；无连接开关 |
| 上游 | 40+ 自管 Provider OAuth | **默认 Gateway** + **简易 BYOK**；不做 60 Provider OAuth 矩阵 |
| App 识别 | 通用 API Key | 应用名 + 专用接入码 + 显示名 |
| 记忆 | 无强调 | **Chat 主用户必备** + 跨 App 可选（§5.8） |
| API 面 | 9 类全开 | **9 类架构对齐**，分阶段（§5.10） |
| 格式转换 | OpenAI ↔ Anthropic ↔ Gemini | **v0.1 起** Anthropic；Gemini v0.2 |
| MITM 桥 | 有（IDE 订阅拦截） | Phase 3 评估（合规风险） |

**NodeAI 差异化（用户可感知）：**

1. **谁在用，一眼可见** — 专用接入码 + 实时面板
2. **默认省钱** — RTK + Caveman + Smart Route 默认 ON；账单拆分展示
3. **跨 App 记忆** — Cursor 与 NodeAI 对话共享偏好/项目上下文（Phase 1 只读 + 手动记住）
4. **普通人能懂** — UI 不说 BYOK、RTK（见 §3.4）
5. **数据可视化** — 用量、模型占比、压缩节省；参考 Cursor Agent 侧栏
6. **中英双语** — 全界面 i18n

---

## 3. 产品愿景与定位

### 3.1 愿景

> 打开就能聊，外部 App 自动接入，账单看得清。

### 3.2 定位一句话

**桌面 AI 用量中枢 — 把 Cursor 等应用接到 NodeAI，谁在用、花了多少看得清；对话窗口是随开随用的快捷入口。**

### 3.3 设计原则

1. **应用识别可见** — 连接后必须让用户知道「是 Cursor 在调用」；Activity 面板常驻
2. **Chat 即快捷入口** — 首屏可仍为对话，右侧始终展示各应用用量
3. **省钱默认 ON** — RTK + Caveman Level 1 + Smart Route；账单展示分项节省
4. **记忆可感知** — 设置与独立「记忆」页；对话内「记住这条」
5. **少技术词** — 用户界面避免 BYOK、localhost、OpenAI 兼容、App Key（见 §3.4）
6. **i18n** — 中文 + English
7. **Always-on** — 打开 NodeAI 即服务可用，无「连接 / 断开」按钮

### 3.4 用户可见文案 vs 内部术语

| 用户界面（中/英） | 内部实现 | 说明 |
|-------------------|----------|------|
| 连接应用 / Connect apps | Gateway 配置页 | 不说「接入」「Gateway」 |
| 共用接入地址 | `http://127.0.0.1:8787/v1` | 不说 localhost、endpoint |
| Cursor 专用接入码 | `sk-nodeai-cursor` | 不说 App Key、Bearer |
| 使用中 / 等待首次使用 | 首包审计 + 状态机 | 连接后立即反馈 |
| 智能选模型 | Smart Route / Combo | 不说 Route、Combo |
| 智能压缩 | RTK | 输入侧：tool 结果、日志、diff |
| 简洁回复 | Caveman | 输出侧：减少啰嗦 |
| 上下文整理 | Prune | 旧消息摘要/剪枝 |
| 记忆 | Memory Layer | 跨 App 共享条目 |
| 总览 | Hub 仪表盘 | 不说 BYOK Hub |
| 最近调用 | 路由 log | 显示应用**显示名**非 slug |

**原则：** 小美（小白 Persona）应能完成「打开对话 → 得到好回答 → 看见今天省了多少钱」；成长后可连 Cursor、加 BYOK、看九类 API 与 Fallback，全程不强制接触技术缩写。

### 3.6 用户成长路径（同一产品，能力逐步解锁）

| 阶段 | 典型用户 | 主入口 | 解锁能力 | UI 呈现 |
|------|----------|--------|----------|---------|
| L0 入门 | 小美 | **选模型** + NodeAI 对话（更多） | 含额度、Smart Route、场景 chip、会话记忆 | 首屏选模型（VPN 式），对话在「更多」 |
| L1 熟练 | 小美+ | 对话 + 附件 | Embeddings/PDF、Vision 图片、Memory「记住这条」 | 总览、记忆页 |
| L2 连接 | 阿杰 | Chat + Cursor | 专用接入码、App 识别、RTK 账单分项 | 连接页、Activity |
| L3 进阶 | 阿杰+ | 多 App | 简易 BYOK、Fallback 链、格式转换、Claude Code 等 | 模型来源页、高级设置 |
| L4 极客 | 团队 | 全流量 | 多 BYOK Key、OAuth 精选 Provider（可选）、团队审计 | 套餐团队版、Post-MVP |

**设计原则：** 默认 UI 为 L0–L1；L2+ 功能 **存在但不挡 onboarding**，设置与「更多」中可发现。

### 3.5 商业模式与定价（草案）

**收入结构（Phase 1）：**

| 来源 | 说明 | 用户可见 |
|------|------|----------|
| **订阅** | 免费 / 专业版 / 团队版；含每月 AI 额度 | 「套餐」页三档对比 |
| **超额按量** | 额度用完后按 Token 计费（≈ 上游成本 + 服务费） | 账单 + 预算告警 |
| **试用** | 注册即 14 天专业版试用，无需信用卡 | 注册页 + 套餐页「试用中」 |

**套餐草案（MVP 原型对齐 · v2 下调额度与价格）：**

| 档位 | 月费 | 含额度 | 外部应用 | 记忆 | 压缩/路由 | 定位 |
|------|------|--------|----------|------|-----------|------|
| 免费 | ¥0 | **¥12**（约 25 万 Token） | **1 个** | — | 基础压缩 | 尝鲜：连上 Cursor、看账单 |
| **专业版** | **¥29** | **¥48** 含额度 | 无限 | ✓ | 全套 | 日常开发者；ROI 目标：月省 > 订阅费 |
| 团队版 | **¥99** | **¥180** 共享 | 无限 | ✓ | 全套 + 审计 | **3 席位**；小团队分摊 |

**超额按量：** ≈ ¥0.018 / 千 Token（上游成本 + ~8% 服务费，UI 透明展示）

**为何这样定：**

1. **免费不能太大** — 否则无人付费；¥12 只够验证「接入 + 看见 Cursor 在调用 + 今日节省」
2. **专业版要便宜** — ¥29 接近一杯咖啡/周；含 ¥48 额度，Heavy 用户靠超额与省钱引擎留利
3. **团队版按席位** — ¥99/3 人，不做 ¥399 吓跑早期客户
4. **记忆、完整账单、多应用** — 付费墙核心，免费版刻意缺失

**Unit economics 原则：**

1. 用户付 **NodeAI 统一货币** — 不暴露上游 Provider 分项价
2. **省钱必须可验证** — 账单拆分「智能压缩 / 简洁回复 / 智能选模型」节省项
3. **ROI 叙事** — Onboarding 与套餐页展示「预计月省 − 订阅费 = 净收益」
4. **双路径** — **含额度**：经 NodeAI 云端后端与统一账单；**简易 BYOK**：桌面本地代理直出，Key 仅 Keychain，**不占用 NodeAI 推理/中转服务器**

**账号体系：**

- 邮箱 + 密码 / Google / GitHub 登录
- NodeAI 账号绑定上游 Gateway 凭证（用户不可见）
- 退出登录不清本地日志；清除账号需单独操作

**原型：** `prototypes/auth.html`（登录/注册/Onboarding）、`dashboard.html` → 侧栏「更多」→ 套餐、对话；主 nav **选模型 / 总览 / 连接**（VPN 式 Gateway 模型切换；对话降级至「更多」）

### 3.7 Built-in Bonus 优先级矩阵

**定义：** Built-in Bonus = 用户接入 `8787` 后**几乎零额外操作**即可获得的能力；占住代理位后的「白赚感」功能。与 **RTK / Caveman** 同属 Bonus，但 **粘性来源不同** — 压缩偏「Proof of value」，下列能力偏 **日活、留存、换工具成本**。

#### 3.7.1 粘性分层（产品诚实口径）

| 层级 | 代表能力 | 用户为何留下 | MVP 是否必做 |
|------|----------|--------------|--------------|
| **基础设施** | Always-on 8787、按 App 专用码 | 改 Cursor/Cline 配置有沉没成本 | ✓ |
| **数据** | 记忆库、历史账单、ROI 曲线 | 换工具要重教 AI、丢失统计 | ✓ 记忆 Phase 1 |
| **情感** | Failover 不断工、预算告警 | 出事那天离不开 | ✓ Failover |
| **可验证省钱** | RTK、Caveman、Smart Route | 续费理由、Pro ROI | ✓ 默认 ON + 账单分项 |
| **静默引擎** | 格式转换、Prune | 用户无感，少单独打开 App | 转换 v0.1；Prune v0.2 |

**结论：** 营销与首屏叙事优先 **「谁在用、花了多少、今天省了多少、有没有断工」**；RTK/Caveman 写入账单分项，但不作为唯一卖点。

#### 3.7.2 优先级矩阵（用户感知 × 实现成本 × 粘性）

评分：用户感知 / 粘性 / 实现成本 — 各 **1–5**（5 最高）。**MVP 序** = 综合优先级（高感知 + 高粘性 + 可交付）。

| 用户可见名 | 内部 | 用户感知 | 粘性 | 成本 | MVP 序 | 默认 | 账单/面板可见 |
|------------|------|:--------:|:----:|:----:|:------:|:----:|:-------------:|
| 智能压缩 | RTK | 4 | 3 | 3 | **P0** | ON | ✓ 分项 ¥ |
| 简洁回复 | Caveman L1 | 3 | 2 | 2 | **P0** | ON | ✓ 分项 ¥ |
| 智能选模型 | Smart Route | 5 | 4 | 4 | **P0** | ON | ✓ 分项 ¥ |
| 按应用账单 | App Key 审计 | 5 | 5 | 3 | **P0** | — | ✓ Activity / 总览 |
| 限流自动换路 | Gateway Failover | 4 | **5** | 4 | **P0** | ON | ✓ 「今日 0 次断工」 |
| 记忆 | Memory Layer | 4 | **5** | 3 | **P0** | 注入 | ✓ 记忆页 + 条数 |
| 实时面板 | Activity HUD | 5 | 4 | 2 | **P0** | — | ✓ 对话右侧 |
| 格式自动转换 | Translator | 2 | 3 | 4 | P1 | ON | ✗ 不可见 |
| 上下文整理 | Prune | 3 | 3 | 4 | P1 | OFF | ✓ v0.2 分项 |
| 预算/超速告警 | Budget alert | 4 | 4 | 2 | P1 | ON | ✓ 托盘 + 总览 |
| 月度 ROI 报告 | ROI narrative | 4 | 4 | 1 | P1 | — | ✓ Banner / 套餐 |
| Provider 健康 | Health panel | 3 | 3 | 3 | P2 | — | 总览次要 |
| 重复请求检测 | Dedup hint | 3 | 2 | 3 | P2 | — | Agent 提示 |

#### 3.7.3 MVP 默认 ON 清单（v0.1）

```
BonusProfile {
  rtk: ON,
  caveman_level: 1,
  smart_route: ON,
  gateway_failover: ON,
  memory_inject: ON,      // 读取本地库；Cursor 写入默认 OFF
  format_translate: ON,   // OpenAI ↔ Anthropic，UI 不展示
  prune: OFF,
  budget_alert: ON,
}
```

**账单「怎么省的」四行（MVP）：** 智能压缩 · 简洁回复 · 智能选模型 · **合计**；Failover 在 Activity 展示 **「今日断工 0 次 / 自动换路 N 次」**（不算入省钱金额，算可靠性 Bonus）。

#### 3.7.4 原型与 UI 体现指引（对齐 `dashboard.html`）

| 能力 | 首屏 Chat | Activity 侧栏 | 总览 Hub | 账单 | 设置 |
|------|-----------|---------------|----------|------|------|
| 压缩/简洁/选模型 | HUD 今日节省 | 节省 banner 三行拆分 | 「内置能力」卡片 + 今日 ¥ | 「怎么省的」四格 | 开关 + 强度 |
| 按 App 识别 | composer 提示 | 应用列表 live | By app 环图 | 矩阵 / 明细 | — |
| Failover | — | **断工 0 次** pill | 能力卡片 ON | — | Fallback 链 |
| 记忆 | 上下文条摘要 | — | 能力卡片 + 条数 | — | 跨 App 开关 |
| ROI | 顶栏 banner | — | 套餐联动 | 本月净省 | 套餐页 |

**Chat 首屏原则：** 不堆技术名；用 **一行「AI 已知道」+ 右侧实时省 ¥ + 可展开 Activity** 传达「背后有引擎在跑」。进阶编辑走「仅改这条对话」与记忆页。

---

## 4. 目标用户

### 4.1 Primary Persona: 「小白创作者」小美

- 28 岁，运营/内容创作，习惯 ChatGPT
- 需求：一个 App 里聊天、改文档、问代码；不想管模型和 Key
- 成功标准：打开 NodeAI，3 分钟内完成「整理 README + 生成配图文案」

### 4.2 Secondary Persona: 「多 IDE 开发者」阿杰

- 全栈，NodeAI 对话写方案，Cursor 写代码，共用 localhost 网关
- 需求：对话里 Smart，Cursor 里 `nodeai-auto`；费用一张账单
- 成功标准：限流时无感知降级，Session 不中断

### 4.3 Tertiary Persona: 「团队管理员」

- 小团队 Tech Lead，需要按应用分摊 AI 成本
- 需求：App Key 审计、月度报表、策略模板下发

---

## 5. 核心功能

### 5.1 NodeAI Chat（快捷入口 · Chat + Agent）

ChatGPT 式对话 + 轻量 Agent；**右侧实时面板**（参考 Cursor Agent 侧栏）始终展示「谁在用、花了多少」，不让用户忘记 Cursor 等应用正在跑。

```
┌──────────┬─────────────────────────────┬──────────────────┐
│ 侧栏     │  [智能选模型 ▼]  HUD图表     │  实时 · 谁在用    │
│ 历史     │  对话 + Tool 卡片            │  ● 预算环        │
│ 总览     │                             │  用量走势        │
│          │  Composer                   │  今日节省 ¥12.4  │
│          │                             │  Cursor 使用中   │
│          │                             │  最近调用        │
└──────────┴─────────────────────────────┴──────────────────┘
```

| 能力 | 描述 | 优先级 |
|------|------|--------|
| Activity 面板 | 预算环、用量走势、应用 live 条（**显示名**）、最近调用、省钱卡片 | P0 |
| Hub 页 | 全屏**使用总览**：各应用卡片（显示名+状态）、7 日柱图、省钱拆分 | P0 |
| **应用识别** | 专用接入码 → 显示「Cursor 使用中」；首次请求 Toast；等待/刚连上状态 | P0 |
| 多轮对话 | 流式、Markdown、Tool 卡片 | P0 |
| 对话附件 | 支持上传文件与图片作为对话附件（Composer chips） | P1 |
| 模型切换 | 顶栏单下拉：智能选模型 + 具体模型 | P0 |
| Agent 文件工具 | 读 / 写 / 改 / 删（确认） | P0 |
| i18n | zh / en 全界面 | P0 |

**Agent 安全边界（MVP）：**

- 默认工作区：用户选定文件夹（首次引导）或当前打开项目
- 写 / 删操作：弹窗确认或设置「危险操作需确认」（默认 ON）
- 禁止静默访问系统目录、Keychain、`.env` 等敏感路径（规则列表）

**与外部 App 的关系：** 对话使用 `sk-nodeai-chat`（内部），与 Cursor 等 App Key 分开计费统计，共用 Smart Router 与压缩引擎。

### 5.2 Always-on 本地网关（边缘接入 · 无连接开关）

NodeAI 启动后，本地 **边缘代理** 自动监听 `8787`，不提供「连接 / 断开」主按钮。边缘层负责：OpenAI 兼容面、App 专用码识别、可选本地 Memory 注入/合并、流式回传；**鉴权、计费、Smart Route 决策、上游转发（含 Vercel Gateway）在 NodeAI 云端后端完成**。

| 行为 | 说明 |
|------|------|
| App 运行 | `http://127.0.0.1:8787/v1` 可用；托盘显示「运行中」 |
| 请求路径 | **含额度**：边缘 → NodeAI API → Gateway → 原路流式返回；**BYOK**：边缘本地完成路由/压缩/转换 → 用户 Provider → 原路返回（**不经 NodeAI 服务器**） |
| App 退出 | 端口关闭；外部 App 收到友好错误；未登录时边缘可拒绝转发 |
| 托盘 | Token 流、预算 HUD（来自后端同步）；**无**连接 Toggle |
| 连接应用页 | 按应用分卡片：共用地址 + **专用接入码** + 分步引导；状态「服务已开启」 |
| **暂停 / 端口（高级）** | 主流程不放连接开关；**设置 → 连接** 提供「本地服务 · 运行中 / 已暂停」与改端口，面向安全敏感 / 端口冲突用户。暂停后外部 App 无法调用，**内置对话不受影响** |

**Always-on 与暂停的边界（与 §3.3-7 一致）：** 默认随 App 常开、主流程无「连接/断开」按钮（守住小白心智）；启停本地服务的能力**仅下放到设置高级项**，文案用「运行中 / 已暂停」而非「连接 / 断开」，不回到「连接器」旧隐喻。

### 5.3 模型选择（简化 UX）

**三层语义，逐级覆盖（默认即全自动）：**

| 层级 | 用户可见 | 行为 |
|------|----------|------|
| **全自动**（默认顶层） | 智能选模型 · 全自动 | **每条请求实时分类 → 选模型**，用户不用挑场景（§5.4）；对应虚拟模型 `nodeai-auto` |
| **场景钉住**（可选覆盖） | 编码 / 写作 / 生图… 线路 | 把某一类任务钉到固定策略；对应 `nodeai-code` 等场景别名 |
| **具体模型**（可选覆盖） | 如 Claude Sonnet 4、Gemini Flash | 钉死某个模型 — 本对话 / 全局默认固定 |

- 首屏「选模型」第一项永远是 **「全自动」**（默认选中、置顶高亮）；其下为「或钉住一个场景」可选列表；「固定某模型」收在高级区。
- **不要**分段控件（智能 | 档位 | 自选）、不要单独路由页。
- 外部 App 在 `model` 字段填 `nodeai-auto`（全自动）、场景别名、或具体 model slug，均跟随 NodeAI 统一线路与转发。

#### 5.3.1 NodeAI 虚拟模型（`model` 字段取值规范）

外部 App 接 `8787` 时必须填 `model`。NodeAI 在 `GET /v1/models` 中返回以下虚拟模型别名（连同精选真实模型），使 IDE 下拉可选，且不会因校验模型名而报错：

| `model` 取值 | 行为 |
|--------------|------|
| `nodeai-auto`（**推荐默认**） | 全局自动分类 → 选模型（§5.4 的分类器） |
| `nodeai-code` / `nodeai-chat` / `nodeai-embed` / `nodeai-vision` … | 钉住对应场景线路 |
| 具体真实 slug（如 `anthropic/claude-sonnet-4`） | 钉死该模型 |
| 留空 / 任意不可识别值（IDE 硬塞的 `gpt-4o` 等） | 容错：当作「无显式意图」→ 回落到 App 默认 / 全局自动 |

**请求优先级（修订）：** 请求体 `model` **若为可识别的具体模型 / 场景别名** → 钉死或钉场景（最高优先级）；**若为 `nodeai-auto` 或不可识别值** → 交给 App 级默认 > 对话顶栏选择 > 全局自动 > Fallback。

> 据此调和连接向导文案：主推「Model 填 `nodeai-auto`」；「可留空 / 任意值都行」仅指**不可识别值的容错**，不与「具体 slug 会被尊重」矛盾。

### 5.4 智能路由（Smart Route）

借鉴 9Router Combo + Fallback；**含额度**路径结合 Vercel AI Gateway 模型元数据，**决策在后端**；**BYOK** 路径 **全在桌面本地**（规则 + 轻量分类，零 Token，零云端）。

**全自动是一等默认（重要）：** 「智能选模型」的缺省态是 **全自动**（`nodeai-auto`）——对**每条请求**实时分类后选模型，用户**无需先挑场景**。场景线路（编码/写作/生图…）只是「手动钉住某一类」的可选覆盖，不是前置步骤。三者关系：

| 模式 | 谁来决定模型 | 何时用 |
|------|--------------|--------|
| **全自动**（默认） | NodeAI 按每条请求自动分类 | 小美默认；多数场景 |
| 场景钉住（可选） | 用户钉一类，NodeAI 在该类内选 | 想固定「写作总用 Claude」之类 |
| 具体模型（可选） | 用户钉死 | 明确要某个模型 |

下方分类信号同时服务「全自动」逐请求判断与「场景钉住」的类内细分。

**含额度路径：**

```
边缘收到请求 → NodeAI API
    │
    ▼
┌──────────────┐
│ 任务分类器    │ ← 规则 + 轻量分类（后端权威；边缘可缓存 catalog）
└──────┬───────┘
       │
   ┌───┴───┬──────────┬──────────┐
   ▼       ▼          ▼          ▼
 代码    对话      嵌入/RAG    图像/多模态
       → Gateway + Failover
```

**BYOK 路径（本地闭环）：**

```
8787 / Chat → 桌面 Runtime（Smart Route + RTK/Caveman + 格式转换）
    │
    ▼
用户 Provider API（Key 仅 Keychain，不经 NodeAI 服务器）
```

**分类信号（Phase 1 规则引擎）:**

- HTTP Path / Header `X-NodeAI-Task: code|chat|embed|vision`
- 消息结构：tool_calls 比例、system prompt 关键词
- 上下文长度阈值：>32k 自动降级压缩或选长上下文模型
- 用户 Override：`X-NodeAI-Mode: fast|deep`

**Fallback 链：**

| 路径 | 行为 |
|------|------|
| **含额度** | 用户选定/策略模型 → 同 tier 备用（Gateway failover）→ 极廉价兜底 |
| **BYOK** | 用户来源内 primary → 同来源 fallback（若有）→ 本地配置兜底；**不回落到 NodeAI 含额度**（除非用户显式开启混合 Fallback） |

### 5.5 本地 OpenAI 兼容代理

| 项目 | 规格 |
|------|------|
| 默认地址 | `http://127.0.0.1:8787/v1` |
| 兼容 API | **9 类 OpenAI 兼容面**（见 §5.10）；MVP 先 Chat + Embeddings，其余按阶段开放 |
| Models List | 聚合 Gateway + 用户 BYOK + NodeAI 虚拟模型别名（`nodeai-auto`、`nodeai-code` 等，见 §5.3.1） |
| 认证 | Bearer Token = App Key（见 5.6） |
| 协议转换 | 请求入站 OpenAI 形态 → 按上游 **格式** 转 Anthropic / Gemini（§5.11） |

**虚拟模型别名：** 见 §5.3.1；`GET /v1/models` 返回 `nodeai-auto`（全自动）+ 场景别名 + 精选真实模型目录，确保 IDE 下拉可选、模型名校验不报错。

### 5.6 应用识别与专用接入码（用户侧：「专用接入码」）

**用户怎么知道是哪个应用在调用？**

1. **连接前：** 用户在「连接应用」页选择 **Cursor**（不是填 slug），复制 **Cursor 专用接入码** + 共用地址
2. **连接后：** 该应用第一次发来请求 → 状态从「等待首次使用」变为 **「使用中」** 或 **「刚刚连上」**（Toast + Activity 面板高亮）
3. **使用中：** 右侧实时条显示 **Cursor** 图标与名称、当前速度、今日花费；「最近调用」写 **Cursor → 写代码 → ¥0.01**
4. **未连接的应用：** 如 Cline 已生成码但从未请求 → 显示「等待首次使用」，不占 live 列表

**机制（内部）:** 每个应用独立 Bearer Token，格式 `sk-nodeai-{app-slug}`；日志按 slug 归因，**UI 一律映射为显示名**（Cursor、Claude Code、NodeAI 对话）。

```
用户选择「Cursor」模板
    → 复制 sk-nodeai-cursor
    → 粘贴到 Cursor 设置
    → 首次 chat/completions 请求
    → UI: 「检测到 Cursor 已连上」+ 右侧 live 条
```

**预置模板（一键复制 + 分步引导）:**

- Cursor → 共用地址 + Cursor 专用码 + 5 步图文说明
- Claude Code / Continue / Cline 等同理
- 「**添加应用**」→ 图标网格选 Continue / Windsurf / Aider / 自定义 → 第二步大图：**应用 → NodeAI** + 两个复制按钮（地址 / 接入码）→「知道了」

**状态枚举（用户可见）:**

| 状态 | 含义 |
|------|------|
| 等待首次使用 | 已生成专用码，尚未收到请求 |
| 刚刚连上 | 首包后 30s 内，pulse 动画 |
| 使用中 | 近期有流量 |
| （内置）本窗口 | NodeAI 对话，无需配置 |

- **上游凭证** — 默认 NodeAI 托管 Gateway；用户可在「我的模型来源」添加 **简易 BYOK**（§5.12）；专用码仅识别调用方
- 请求日志（内部）：`{timestamp, app_slug, display_name, model, tokens_in, tokens_out, cost_est}`

### 5.7 Token 压缩（借鉴 9Router · 内部名 RTK / Caveman / Prune）

**原则：** 压缩不是高级选项，而是**默认开启**的省钱引擎；所有经 NodeAI 转发的请求（Chat + Cursor 等）均经过 `CompressionProfile`。

| 模块 | 内部名 | 用户 UI 名 | 作用 | 目标节省 |
|------|--------|------------|------|----------|
| Input 压缩 | **RTK** (Reduce Tool Kludge) | 智能压缩 | 对 tool_result、git diff、grep、目录列表等做 **lossless** 结构化压缩 | input **20–40%** |
| Output 压缩 | **Caveman** | 简洁回复 | 注入简洁风格 system 片段，减少啰嗦回复与重复解释 | output 最高 **~65%** |
| Context 剪枝 | **Prune** | 上下文整理 | 滑动窗口 + 旧消息摘要（可选本地小模型） | 因场景而异 |

**RTK 典型场景（Phase 1）：**

- Cursor Agent 返回的大段 `git diff`、测试日志、目录 listing
- 重复 tool 循环中结构相似的 JSON payload
- 压缩前后 Token 数写入日志，计入账单「智能压缩」节省项

**Caveman 级别（Phase 1 默认 Level 1）：**

| Level | 行为 | 适用 |
|-------|------|------|
| 0 | OFF | 用户强制「详细回复」或 Deep 模式 |
| 1（默认） | 轻度简洁提示 | 日常对话、代码解释 |
| 2–3 | Post-MVP | 更强约束，需 A/B 验证质量 |

**Prune（Post-MVP 默认 OFF，MVP 可展示设置项）：**

- 超长会话（>N 轮或 >32k tokens）触发摘要替换旧消息
- 与 Memory Layer 配合：摘要可写入「会话摘要」桶

**默认策略（MVP）：**

```
CompressionProfile {
  rtk: ON,
  caveman_level: 1,
  prune: OFF,
}
```

- Deep / 用户选具体高端模型时：Caveman 可自动降为 0
- 路由决策 `RouteDecision.compression` 与模型 tier 联动（§6.3）

**账单展示（用户可见）：** 今日节省拆分为 **智能压缩（RTK）· 简洁回复（Caveman）· 智能选模型（Smart Route）**；Prune 上线后增加「上下文整理」行（§5.9）。

### 5.8 长效记忆共享（Memory Layer）

**目标：** 当用户以 **NodeAI 对话为主入口**（小美 Persona）时，记忆是「不用重复介绍自己」的基础能力；连接 Cursor 后可选共享。**相对 9Router 的核心差异化之一。**

**Persona 分岔：**

| 用户 | 主入口 | 记忆作用 |
|------|--------|----------|
| 小美（小白） | NodeAI 对话 | 偏好、项目、事实 **默认写入 Chat**；多数请求不经过 Cursor |
| 阿杰（开发者） | Chat + Cursor | Chat 记忆 + 可选「允许 Cursor 读取」 |

```
┌─────────────────────────────────────┐
│         NodeAI Memory Store         │
│  (本地 SQLite + 可选加密)            │
├─────────────────────────────────────┤
│ • 用户偏好（语言、风格、禁忌）        │  tag: Pref
│ • 项目上下文（当前 repo、角色）       │  tag: Project
│ • 事实库（Factual snippets）         │  tag: Fact
│ • 会话摘要（按 app 分桶，可共享）     │  tag: Summary
└─────────────────────────────────────┘
         ▲              ▲
         │ inject       │ write-back
    Cursor App     NodeAI Chat
```

**记忆类型：**

| 类型 | 示例 | 注入范围 |
|------|------|----------|
| Pref | 「回复用中文」「代码注释英文」 | 全局 |
| Project | 「当前 repo: NodeAI，Rust+Tauri」 | 按工作区 |
| Fact | 「部署用 Fly.io，不用 Docker」 | 全局或项目 |
| Summary | 「上次讨论了 PRD 压缩章节」 | 按 App 可选共享 |

**注入方式：** 代理层在转发前合并 `memory` system 块；用户可设置总开关、按类型开关、按 App 是否读取/写入。

**写入方式（Phase 分阶段）：**

| 阶段 | 能力 | 优先级 |
|------|------|--------|
| **Phase 1（MVP）** | 只读注入已有条目 + 对话内 **「记住这条」** 手动写入 + 记忆页浏览/删除 | P0 |
| Phase 2 | 自动从对话提取 Fact + 跨 App 共享策略模板 | P1 |
| Phase 3 | 团队共享记忆库、策略下发 | P2 |

**隐私与安全：**

- 默认**仅本地** SQLite；不上传云端（除非用户显式开启 Cloud Sync · Post-MVP）
- 设置页：一键清空记忆、导出 JSON、按 App 查看「谁写入了什么」
- 敏感路径内容（`.env`、Keychain）**不得**进入记忆库

**UI（用户可见，不说 Memory Layer）：**

- 侧栏 **「记忆」** 页：卡片列表（类型 chip + 摘要 + 来源 App + 时间）
- 对话 Assistant 消息：**「记住这条」** 按钮 → Toast 确认
- 设置：**启用记忆**、**允许 Cursor 读取**、**允许 Cursor 写入**（写入默认 OFF）  

### 5.10 九类 API 能力（对齐行业 Router · 分阶段交付）

与 [9Router](https://9router.com/) 同级 **OpenAI 兼容端点面**，统一经 **`8787` 边缘**；压缩/路由/格式转换在 **含额度→云端** 或 **BYOK→桌面本地** 执行：

| # | 种类 | 典型用途 | 小白可感知场景 | MVP |
|---|------|----------|----------------|-----|
| 1 | **Chat / LLM** | 对话、Agent、代码 | 对话窗口、改文件 | **v0.1** |
| 2 | **Embeddings** | RAG、语义搜索 | 「总结这份 PDF」后台 | **v0.1** |
| 3 | **TTS** | 朗读 | 「读给我听」 | v0.2 |
| 4 | **STT** | 语音输入 | Composer 麦克风 | v0.2 |
| 5 | **Vision** | 看图问答 | 拖图片进对话 | v0.2 |
| 6 | **Image Gen** | 生图 | 「做一张封面图」 | v0.2 |
| 7 | **Video** | 生视频 | Post-MVP | v0.3 |
| 8 | **Web Search** | 联网查 | 「查最新政策」 | v0.2 |
| 9 | **Web Fetch** | 读网页 | 「总结这个链接」 | v0.2 |

**原则：** 对外仍是一个地址 `http://127.0.0.1:8787/v1`；路径与 OpenAI 惯例对齐。小白 **只在 Chat / 附件 / 语音按钮** 里触达能力，不暴露 endpoint 名称。

### 5.11 格式转换（Protocol Translator）

**必要性：** Cursor / Continue 等多发 **OpenAI 形态**；用户 BYOK 可能是 Anthropic Messages 或 Gemini 端点。代理层 **入站统一 → 出站适配**；含额度在 **云端**执行，BYOK 在 **桌面 Runtime** 执行。

```
外部 App (OpenAI API)
       │
       ▼
┌──────────────────┐
│ NodeAI 代理       │  RTK / Route / Memory inject
│ OpenAI  canonical │
└────────┬─────────┘
         │ 按上游「格式」转换
    ┌────┴────┬──────────┐
    ▼         ▼          ▼
 OpenAI    Anthropic    Gemini
 (Gateway   Messages    generateContent
  or BYOK)  API          API
```

| 能力 | MVP | 说明 |
|------|-----|------|
| OpenAI Chat ↔ Anthropic Messages | **v0.1** | tool_calls、streaming、system 块 |
| OpenAI Chat ↔ Gemini | v0.2 | 多模态 parts |
| OpenAI Embeddings 直通 / 映射 | v0.1 | 维度不一致时选 Gateway 统一模型 |
| Responses API 降级 | v0.2 | 无 Responses 的上游回退 chat/completions |

**用户不可见** — 仅在「我的模型来源 → 格式」三选一。

### 5.12 简易 BYOK（自带模型来源 · 本地闭环）

**定位：** 不做 9Router 式 60 Provider OAuth 矩阵；**一个表单搞定**。**BYOK 模式下 AI 推理全在桌面客户端完成，不使用 NodeAI 云端推理/中转资源** — 与 9Router 同级「本地 Router + 自管 Key」，但保留 NodeAI UI、Memory、App 识别与**本地**用量统计。

**架构约束（硬规则）：**

| 项 | BYOK 路径 |
|----|-----------|
| 推理 / 流式响应 | ✅ 桌面 `8787` Runtime **直连** 用户 API 地址 |
| API Key | ✅ **仅 Keychain**，不上传、不经 NodeAI Vault |
| Smart Route / RTK / Caveman / 格式转换 | ✅ **桌面本地**执行 |
| NodeAI Cloud API | ❌ **不参与**该请求的转发与计费中继 |
| 统一 NodeAI 账单 / 额度扣减 | ❌ 用户直接向 Provider 付费；App 内展示**本地统计**（Token/估算，可选） |
| Memory 注入 | ✅ 本地 SQLite，注入在出站前于桌面完成 |

**用户可见：「添加模型来源」**

| 字段 | 说明 | 默认 |
|------|------|------|
| 名称 | 如「我的 DeepSeek」 | 必填 |
| API 地址 | Base URL | 预填 OpenAI 风格模板 |
| API Key | 密码框，本地 Keychain 加密 | 必填 |
| **格式** | OpenAI / Anthropic / Gemini | OpenAI |
| 测试连接 | 一键 ping models | — |

**路由策略：**

1. **默认** — NodeAI 含额度（经云端后端）
2. **显式 BYOK** — 对话顶栏或连接页：「我的 XXX」→ **纯本地路径**
3. **Smart Route + BYOK** — 用户开关「允许智能路由用我的 Key」→ 仅在本机 Runtime 内选 BYOK 来源，**请求不出 NodeAI 服务器**
4. **混合 Fallback（可选，默认关）** — BYOK 失败时可否回落含额度；须二次确认，避免 Key 误走云端
5. **永不** — 让小白先配 Key；Onboarding 默认 **只用 NodeAI 额度**

**Pro 与 BYOK：** 订阅校验可走低频授权接口（非推理路径）；**即使用户选 BYOK，推理仍零占用 NodeAI 算力/中转**。极客向 Pro 价值 = 本地全套压缩/路由/Memory/多 App，而非「代叫模型」。

**§5.12.1 用户故事：含额度 vs 零登录 BYOK**

| 故事 | 是否登录 | 推理路径 | NodeAI 服务器 | 账单 |
|------|----------|----------|---------------|------|
| **小美 · 含额度** | 必须 | 边缘 → **云端** → Gateway | ✅ 鉴权/计费/转发 | NodeAI 统一话费单 |
| **阿杰 · 混合** | 必须 | 按来源分流 | 仅含额度请求 | 含额度走云端；BYOK 本地统计 |
| **极客 · 零登录 BYOK** | **可不登录** | 边缘 **本地闭环** → 用户 Provider | ❌ **零推理/中转资源** | 仅本机 SQLite 估算 |

**零登录 BYOK 规则：**

- 安装后可在 **不注册** 情况下添加模型来源（URL + Key + 格式），立即使用 `8787` 与内置 Chat。
- Key **仅 Keychain**；测试连接、models、chat **均在桌面完成**。
- 不展示「额度剩余 / NodeAI 扣费」；总览与账单页标注 **「直连 Provider · 本地统计」**。
- 登录后可 **追加** 含额度路径，同一 App 内切换来源；默认 **不** 开启「BYOK 失败回落含额度」（须显式确认，避免数据误上云）。
- Pro 功能（完整压缩档位、多 App 无限制等）可 **离线试用** 或登录后授权；**推理永不因 Pro 校验走云端**。

**与 9Router 差异：** 无 Claude Code OAuth、无 MITM、无多账号轮询（Post-MVP）；有统一桌面 UI + Memory + 含额度路径同 App 共存。

### 5.13 小白如何用到好模型（不依赖 Codex / Claude Code / OpenClaw）

**问题：** Codex、Claude Code、OpenClaw、Hermes 等是 **程序员 CLI**；小美不会装也不会用。

**答案：NodeAI 本身就是 AI 产品，不是「只给 IDE 用的管道」。**

```
小美路径（主）                    阿杰路径（辅）
─────────────────                ─────────────────
打开 NodeAI → 对话               同上 + 连接 Cursor
选「智能选模型」或场景 chip         粘贴地址 + 专用码
发第一条消息（≤30s）              Cursor 流量进同一账单
Onboarding 写入记忆               可选 BYOK 补充
```

| 小白触点 | 背后能力 | 不说什么 |
|----------|----------|----------|
| 对话 Composer | Chat + Agent 读写文件 | model slug |
| 「写文案 / 问问题 / 改文档」chip | Smart Route → 好模型 | Provider 名 |
| 拖 PDF / 图片 | Embeddings + Vision | RAG、embedding |
| 麦克风（v0.2） | STT → Chat | Whisper |
| 「查一下」 | Web Search | Tavily |
| 含额度套餐 | Gateway 精选模型 | BYOK |

**激活指标调整：** 小美成功 = **首次 Chat 回复满意**（≤3 min），不是「连上 Cursor」。Cursor 连接改为 **进阶步骤**，Onboarding persona `chat` 默认跳过连接页。

**Smart Route 对小白：** 用 **场景分类**（写 / 问 / 代码 / 看图 / 查网）代替「选 Claude 还是 GPT」；Deep 模式在设置里，不在首屏。

### 5.14 用量、计费与预算

NodeAI 向用户呈现**统一账单**（含额度路径，类似手机话费单）；**BYOK 路径**展示**本地用量统计**（不向 Provider 分项加价，可选导出）。不暴露上游 Provider 分项价格，但费用透明、可预测、可设预算。

| 模块 | 功能 | 优先级 |
|------|------|--------|
| 实时 Token 流 | 托盘/首页展示 tokens/s、in/out 方向 | P0 |
| 今日 / 本月费用 | **含额度**：NodeAI 统一计价；**BYOK**：本地估算（标注「直连 Provider」） | P0 |
| 月度预算 | 用户设定上限（如 ¥200/月），超额预警 | P0 |
| 预算剩余 | 剩余金额 + 环形进度 + 预计可用天数 | P0 |
| 按应用分摊 | 各 App 费用占比与趋势 | P0 |
| **按模型分摊** | 各模型费用占比、Token、调用次数；今日/7日/本月切换 | P0 |
| **应用 × 模型矩阵** | 看清「Cursor 主要在烧哪个模型」 | P0 |
| 按档位分摊 | 智能/极速/均衡/深度 费用分布 | P1 |
| 省钱明细 | **智能压缩(RTK)·简洁回复(Caveman)·智能选模型·上下文整理(Prune)** 各节省多少 | P0 |
| 账单明细 | 时间 / 应用 / 模型 / Token / 费用行级记录 | P0 |
| 账单历史 | 日/周/月汇总，可导出 CSV | P1 |
| 预算告警 | 80% / 100% 托盘通知 + 可选自动降级到极速档 | P1 |

**计费原则:** **含额度** — 用户只见 NodeAI 统一货币；估算 = 实际上游成本 − 压缩节省。**BYOK** — 无 NodeAI Token 扣费；本地展示节省项（压缩/路由）供 ROI 参考。预算告警仅作用于含额度路径（BYOK 预算由用户在 Provider 侧自管）。

### 5.9.1 系统托盘

| 状态 | 含义 | Popover |
|------|------|---------|
| 运行中 | App 在，网关活 | Token 流、预算、打开对话 |
| 降级 | 上游 failover | + 黄色提示 |
| 预算告警 | ≥80% | 红点 + 剩余高亮 |

**无连接开关。** Popover：状态 → Token → 预算 → 打开对话 / 计费 / 退出

### 5.15 上游 Provider 抽象

**原则:** 用户只与 NodeAI 交互；Provider 是 NodeAI 的内部实现细节，类似 ISP 用户不需要知道骨干网路由。

| 层级 | 用户可见 | 用户不可见 |
|------|----------|------------|
| 接入 | `localhost:8787/v1`、`sk-nodeai-{app}` | Provider API Key（**简易 BYOK 除外**，见 §5.12） |
| 模型 | 对话顶栏下拉（智能 + 精选模型） | Provider 配置、原始 slug |
| 信任 | 「由 Vercel 提供 AI 基础设施」徽章 + 健康状态 | Provider 切换、Failover 链配置 |
| 账单 | NodeAI 统一费用估算 | 各 Provider 分项账单 |

**信任展示（Confidence UI）:**

- 侧边栏 / 设置页展示 **Infrastructure Badge**：Logo + 名称 + 状态点（正常 / 降级）
- 文案示例：「AI 基础设施由 **Vercel** 提供 · 100+ 模型 · 企业级 SLA」
- 路由日志可显示模型族（如 Gemini Flash），但不引导用户去 Vercel 控制台
- 未来多 Provider：展示「NodeAI 网络」主品牌，展开可看到活跃上游列表（只读）

**Provider Registry（内部）:**

```rust
trait UpstreamProvider {
    fn id(&self) -> &str;           // "vercel-gateway"
    fn display_name(&self) -> &str; // "Vercel" — 用于 UI 信任徽章
    fn health(&self) -> HealthStatus;
    async fn complete(&self, req: ChatRequest) -> Result<ChatResponse>;
}

// Phase 1: 仅 VercelGatewayProvider
// Phase 2+: OpenRouterProvider, DirectAnthropicProvider ...
// Smart Router 在 Registry 内选择，用户无感
```

**用户侧凭证模型：**

- **含额度：** 登录 NodeAI 账号；Session 在 Keychain；推理经云端
- **BYOK：** Key 在 Keychain；**推理不经 NodeAI 服务器**；可选登录仅用于 Pro 功能授权（非推理路径）

---

## 6. 技术架构

### 6.1 总体架构（边缘 + 云端）

NodeAI 是 **桌面边缘 + NodeAI 云端后端** 混合架构；**含额度**走云端中继，**BYOK** 走 **桌面本地闭环**（零 NodeAI 推理服务器）。

- **桌面**：Tauri UI、托盘、`127.0.0.1:8787` 边缘代理、**BYOK 全栈 Runtime**（路由/压缩/格式转换）、本地 Memory/日志、Session（Keychain）+ **BYOK Key（Keychain，不上云）**。
- **NodeAI 云端后端**：**仅服务含额度路径** — 账号/订阅/额度、计费、Smart Route、格式转换、Gateway Registry、团队审计。
- **上游**：含额度 — 后端 → Vercel Gateway；BYOK — **桌面直连** 用户 Provider。

```
  Cursor / Cline / Continue          内置 Chat (WebView)
           │                                  │
           └────────────┬─────────────────────┘
                        │ OpenAI 兼容
                        ▼
┌───────────────────────────────────────────────────────────────┐
│              NodeAI Desktop — 边缘 (Rust / Tauri)              │
│  Local Edge Proxy (8787) · App Key · Memory · SQLite            │
│  ┌─────────────────────┐    ┌─────────────────────────────┐  │
│  │ BYOK 本地 Runtime    │    │ 含额度：relay → Cloud API    │  │
│  │ Route·Compress·翻译  │    │ （Session，无 Provider Key）│  │
│  └──────────┬──────────┘    └──────────────┬──────────────┘  │
└─────────────┼───────────────────────────────┼─────────────────┘
              │ 直连 HTTPS                     │ HTTPS Session
              ▼                                ▼
     用户 Provider API                 ┌─────────────────────┐
     (OpenAI/Anthropic/…)             │  NodeAI Cloud API   │
              ▲                        │  额度·计费·Route    │
              │ 不经 NodeAI 服务器       └──────────┬──────────┘
              │                                   ▼
              │                        Vercel AI Gateway …
              └─ BYOK 路径零云端推理 ─────────── (含额度 only)
```

**两条典型路径：**

| 路径 | 流量 |
|------|------|
| **含额度 · 外部 App / Chat** | → `8787` → **NodeAI API** → Gateway → 流式回传 |
| **BYOK · 外部 App / Chat** | → `8787` → **桌面 Runtime** → 用户 Provider → 流式回传（**零 NodeAI 服务器**） |

边缘与后端分工见 §6.1.1。

### 6.1.1 边缘 vs 云端职责

| 能力 | 含额度路径 | BYOK 路径 |
|------|------------|-----------|
| OpenAI 兼容 `8787` | 边缘 relay | 边缘 **本地闭环** |
| App 专用码识别 | 边缘 → 云端归因 | 边缘 **本地**统计 |
| Smart Route / Fallback | **云端**权威 | **桌面**权威 |
| RTK / Caveman / Prune | **云端**计量 | **桌面**执行 |
| 格式转换 | **云端** | **桌面** |
| Provider Key | 云端 Platform Key | **Keychain only** |
| Memory | 桌面 SQLite | 桌面 SQLite |
| 账单 / 预算 | **云端**权威 | **本地**统计 |
| NodeAI Cloud API | ✅ 推理中继 | ❌ **不参与** |

**设计原则：** 含额度 — 商业与 Gateway 密钥在云端；BYOK — **推理与 Key 不出本机**（除直连用户 Provider）。Memory 默认本地；含额度请求体经后端转发时遵循 §5.11 隐私说明。

### 6.2 技术选型

| 层 | 选型 | 理由 |
|----|------|------|
| 核心 | Rust | 内存安全、单二进制、适合常驻代理 |
| 桌面壳 | Tauri 2 | 比 Electron 轻量一个数量级 |
| 本地 HTTP | axum + hyper | 成熟 async 生态 |
| 存储 | SQLite (rusqlite) | 日志、记忆、配置 |
| 密钥 | keyring / 系统 Keychain | Session + **BYOK Key 仅本地**；Gateway Key 仅云端 |
| UI | React/Vue + Tailwind 或纯 HTML 原型 → 后续 Tauri WebView | 快速迭代 |

### 6.3 上游 Provider 集成（内部）

**含额度（后端侧）：** Phase 1 默认 **Vercel AI Gateway**。**Gateway API Key 仅存在于 NodeAI 云端后端**；桌面 Keychain 存 NodeAI Session。

- **凭证:** Platform Key 仅后端；桌面 **不** 持有 Gateway Key
- **模型发现 / 分类 / 转发 / Failover:** 后端 Registry；边缘缓存 catalog 供 `GET /models` 与 UI

**BYOK（桌面侧）：** 用户 Base URL + Key + 格式；**测试连接、models 拉取、chat 转发均在桌面完成**，不调用 NodeAI 推理 API。

```rust
enum TrafficPath {
    HostedQuota,  // edge relay → NodeAI API → upstream
    ByokLocal,    // edge runtime → user provider direct
}
```

```rust
struct RouteDecision {
    model: String,              // internal: "openai/gpt-5.4"
    upstream: UpstreamId,       // "vercel-gateway"
    reason: RouteReason,
    compression: CompressionProfile,
}
```

### 6.4 与 9Router 的差异对照

| 维度 | 9Router | NodeAI |
|------|---------|--------|
| 目标用户 | 开发者 CLI/IDE | 小白 + 开发者 |
| 上游 | 40+ 自管 Provider OAuth | Phase 1 统一 AI Gateway |
| UI 隐喻 | Dashboard / 技术面板 | VPN 连接 + 地区 |
| 安装 | npm global | 原生安装包（dmg/exe/deb） |
| App 识别 | 通用 API Key | 应用名 Key + 审计 |
| 记忆 | 无强调 | 核心差异化 |
| MITM 桥 | 有（IDE 订阅拦截） | Phase 3 评估（合规风险） |

---

## 7. 用户流程

### 7.1 首次使用（Happy Path ≤ 2 分钟）

1. 安装并打开 NodeAI → 登录
2. （可选）选择 Agent 工作文件夹
3. 直接进入对话 — 顶栏默认「智能路由」
4. 输入第一条消息，体验 Agent 读写文件
5. 若用 Cursor：侧栏 **外部接入** → 复制 URL + Key

### 7.2 切换模型

1. 点击对话顶栏 **模型下拉**
2. 选「智能路由」或某一具体模型 — 立即生效
3. 外部 App 用 `nodeai-auto` 时跟随此默认

### 7.3 查看费用

1. 侧栏 **计费** — 对话 + 各 App 合并账单
2. 托盘可看今日 / 剩余预算

---

## 8. 非功能需求

| 类别 | 指标 |
|------|------|
| 性能 | 代理额外延迟 P95 < 15ms（不含 LLM）；压缩处理 < 50ms |
| 内存 | 空闲 < 80MB；峰值 < 200MB |
| 安装包 | < 25MB（Tauri 目标） |
| 安全 | 上游凭证 NodeAI 托管；App Key 可吊销；本地日志可加密 |
| 隐私 | **含额度**：请求体经 NodeAI 云端后端转发上游；**BYOK**：Prompt 直连用户 Provider，**不经 NodeAI 服务器**；Memory 默认本地；遥测默认 OFF |
| 跨平台 | macOS / Windows / Linux（Phase 1: macOS + Windows） |

---

## 9. MVP 范围（v0.1 — 8 周）

### In Scope

- [ ] **NodeAI 对话为主路径**：场景 chip + Smart Route；小美激活 = 首次 Chat 成功（非必须连 Cursor）
- [ ] **应用识别**：专用接入码 + 显示名 + 状态 + 首次连接 Toast（开发者进阶）
- [ ] **使用总览**：Activity 侧栏 + 总览页（预算环、用量走势、各应用 live、最近调用）
- [ ] Chat（流式、历史、Markdown）+ Agent 工具链 v1 + **Embeddings**（PDF/RAG 后台）
- [ ] **格式转换 v1**：OpenAI ↔ Anthropic（Chat + streaming + tools）
- [ ] **简易 BYOK**：名称 + API 地址 + Key + 格式三选一 + 测试连接；Smart Route 可选纳入
- [ ] **记忆 Phase 1**：本地库 + 记忆页 +「记住这条」+ Onboarding 偏好写入 + Chat 默认注入
- [ ] Token 压缩：RTK + Caveman L1；账单分项节省
- [ ] Smart Route + Gateway Failover；Always-on 代理 + 连接应用页
- [ ] i18n zh / en

### Out of Scope (Post-MVP)

- OAuth 多 Provider 矩阵（Claude Code / Copilot 订阅一键 OAuth）— 用简易 BYOK + 精选 OAuth 替代
- BYOK 同 Provider 多账号轮询
- Caveman L2–3 默认全开 / Prune 全自动（MVP 可手动开关）
- Memory 自动 LLM 提取（Phase 2）
- 团队策略下发、Cloud Sync Tunnel、MITM IDE 桥接（Phase 3 评估）

### 9.1 功能全景清单（规划基准 · 原型应对齐）

与 [9Router](https://9router.com/) 能力面对照；✓ = 规划包含，阶段见 §5.10 / 路线图。

| 类别 | 功能项 | NodeAI 规划 | 9Router |
|------|--------|-------------|---------|
| **代理** | OpenAI 兼容端点 | ✓ | ✓ |
| | 改端口 | ✓ | ✓ |
| | Always-on | ✓ | ✓ |
| | 九类 API | ✓ 分阶段 | ✓ 全开 |
| **路由** | Smart Route / Combo | ✓ | ✓ |
| | 三层 Fallback | ✓ 含额度+BYOK | ✓ 订阅→便宜→免费 |
| | 任务/场景分类 | ✓ | 部分 |
| **压缩** | RTK | ✓ | ✓ |
| | Caveman（多级） | ✓ L1→L3 | ✓ 5 级 |
| | Prune | ✓ | 弱 |
| **转换** | OpenAI↔Anthropic | ✓ v0.1 | ✓ |
| | OpenAI↔Gemini | ✓ v0.2 | ✓ |
| | Responses 降级 | ✓ v0.2 | ✓ |
| **上游** | NodeAI 含额度 Gateway | ✓ **核心** | ✗ |
| | 简易 BYOK（URL+Key+格式） | ✓ | 复杂矩阵 |
| | 60+ Provider OAuth | Post-MVP 精选 | ✓ |
| | MITM IDE 桥 | Phase 3 评估 | ✓ |
| **识别** | 专用 App 接入码 | ✓ | ✗ |
| | App 状态机 + 审计 | ✓ | 弱 |
| **记忆** | 跨 App Memory | ✓ | ✗ |
| | 对话内记住 | ✓ | ✗ |
| **Chat** | 内置对话 + Agent | ✓ | ✗ |
| | 场景 chip | ✓ | ✗ |
| **账单** | 统一订阅账单 + ROI | ✓ | 弱 |
| | 按 App / 模型矩阵 | ✓ | 弱 |
| | 省钱分项 | ✓ | 部分 |
| **商业** | 免费/Pro/团队 | ✓ | ✗ |
| **分发** | Tauri 安装包 | ✓ | npm/Docker |
| **i18n** | 全界面 zh/en | ✓ | README 多语言 |

### 9.2 版本交付节奏（全貌）

**v0.1 — Token 中枢核心**

- Chat + Embeddings + 代理 + 格式转换（OpenAI↔Anthropic）
- RTK + Caveman L1 + Smart Route + Gateway Failover
- Memory（记忆页 + 记住这条 + 跨 App 开关）
- 简易 BYOK（单来源表单 + 测试连接）
- App 识别 + 连接向导 + 账单/总览/Activity
- 场景 chip、i18n、托盘

**v0.2 — 九类 API 扩面 + 成长用户**

- TTS、STT、Vision、Image Gen、Search、Fetch
- Gemini 格式转换、Caveman L2、Prune 可选
- BYOK 纳入 Fallback 链、多来源列表
- 连接 Claude Code / Codex / OpenClaw 等模板

**v0.3 — 极客与团队**

- Video、BYOK 多 Key 轮询、团队审计
- OAuth 精选 Provider（非 60 矩阵）
- MITM / Tunnel 合规评估

### 9.3 原型对齐检查（Built-in Bonus · §3.7）

演示与评审时确认 `prototypes/dashboard.html` 已体现：

- [ ] 对话页 Activity **默认展开**，节省 banner 含压缩 / 简洁 / 选模型三行
- [ ] Activity 展示 **Failover：今日断工 0 次**
- [ ] 总览 Hub **「内置能力」** 卡片网格（ON + 今日贡献 ¥ 或状态文案）
- [ ] 账单 **「怎么省的」** 含智能压缩、简洁回复、智能选模型、合计（四格）
- [ ] Chat **上下文条** + ROI banner；不说 RTK/Caveman/BYOK
- [ ] 套餐页 ROI 脚注覆盖 **压缩 + 选模型 + 不断工** 叙事

---

## 10. 成功指标

| 指标 | MVP 目标 | 测量方式 |
|------|----------|----------|
| 激活率 | 安装 → 首次成功请求 > 60% | 匿名 opt-in 统计 |
| 时间到首次请求 | < 5 min P50 | 漏斗 |
| 压缩率 | 平均 input Token −25%（RTK）；output 可选 Caveman 收益 | 本地日志 |
| 记忆采用率 | 「记住这条」/ 注入命中 > 30% 活跃用户 | 本地统计 |
| 用户感知省钱 | NPS 子项「省钱」≥ 8/10 | 应用内调研 |
| 崩溃率 | < 0.1% Session | 崩溃上报 |

---

## 11. 风险与缓解

| 风险 | 影响 | 缓解 |
|------|------|------|
| Gateway 单点依赖 | 上游不可用 | Gateway 内置 failover + 本地缓存模型列表 |
| 合规（MITM） | 法律/ToS | MVP 不做 MITM；仅 OpenAI 兼容配置 |
| 小白仍不懂 Base URL | 激活失败 | 分应用图文向导 + 检测工具 |
| Rust 团队学习曲线 | 交付延迟 | 代理核心 Rust，UI 可 Web 技术 |
| 记忆隐私 | 用户信任 | 默认本地、可视化记忆条目、一键清空 |

---

## 12. 路线图

```
2026 Q2  MVP v0.1     Chat+Embed+Translator+Memory+简易BYOK+代理+计费
2026 Q3  v0.2         TTS/STT/Vision/Search/Fetch/Image + Gemini 转换
2026 Q4  v0.3         Video + BYOK 多 Key + 团队版
2027     v1.0         OAuth 精选 Provider（可选）+ 插件市场
```

---

## 13. 附录

### A. 本地 API 示例

```bash
# 列出模型
curl http://127.0.0.1:8787/v1/models \
  -H "Authorization: Bearer sk-nodeai-cursor"

# Chat（Smart Route）
curl http://127.0.0.1:8787/v1/chat/completions \
  -H "Authorization: Bearer sk-nodeai-my-app" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "nodeai-auto",
    "messages": [{"role":"user","content":"写一个快排"}]
  }'
```

### B. 原型页与 PRD 映射

| 原型（`prototypes/`） | PRD |
|---------------------|-----|
| 对话 + 场景 chip | §5.1、§5.13 |
| 总览 · 九类 API 网格 | §5.10 |
| 连接应用 | §5.5、§5.6 |
| 记忆 | §5.8 |
| 模型来源 + Fallback | §5.12、§5.4 |
| 账单 / 套餐 | §5.14、§3.5 |
| 设置 | §5.7、§5.11 |
| auth Onboarding | §3.6、§4 |

### C. 名词表

| 术语 | 定义 |
|------|------|
| App Key | 以应用名标识的本地代理密钥，非 Provider 真密钥 |
| Smart Route | 按任务类型自动选择模型的默认模式 |
| RTK | Reduce Tool Kludge，输入侧无损 Token 压缩 |
| Caveman | 输出侧简洁化压缩 |
| Prune | 上下文剪枝 / 旧消息摘要 |
| Memory Layer | 跨 App 本地长效记忆存储与注入 |
| 9Router | 参考竞品；本地 OpenAI 兼容 Router + RTK/Caveman |
| 地区 | 用户可见的模型策略档位，类比 VPN 节点 |

### C. 参考链接

- [Vercel AI Gateway 文档](https://vercel.com/docs/ai-gateway)
- [9Router 官网](https://9router.com/)
- [9Router GitHub](https://github.com/decolua/9router)
- [AI SDK Providers](https://ai-sdk.dev/docs/foundations/providers-and-models)

---

*文档维护: NodeAI Team · 下次评审: MVP Kickoff*
