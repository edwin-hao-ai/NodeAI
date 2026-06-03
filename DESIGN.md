# Design System — NodeAI

**Version:** 1.0  
**Last updated:** 2026-05-31  
**Status:** Approved for MVP  
**Platform:** macOS / Windows / Linux (Tauri desktop)  
**Reference:** [Material Design 3](https://m3.material.io/) · [Google Fonts](https://fonts.google.com/)

---

## Product Context

- **What this is:** NodeAI 是 **桌面 AI 用量中枢** — 把 Cursor 等应用接到一起，识别谁在调用、统一账单、**默认省钱（RTK/Caveman/Smart Route）** 与 **跨 App 记忆**；内置对话为快捷入口。
- **Who it's for:** 同时使用 Cursor / Claude Code 的开发者（Primary）；需要统一计费与省钱可视化的用户（Secondary）。
- **Reference peers:** Cursor Agent View、ChatGPT Desktop、**[9Router](https://9router.com/)**（压缩与路由思路）。
- **Project type:** **Hub-first 感知**（Activity 面板 / Hub 页常驻数据）+ Chat 默认首屏 + 系统托盘 HUD + 二级「接入 / 计费 / 应用」页。

---

## Design Principles

| # | Principle | NodeAI 含义 |
|---|-----------|-------------|
| 1 | **Focus on the user** | 首屏可对话，但**右侧始终展示「谁在用」**；文案面向小美，不用 BYOK/App Key。 |
| 2 | **Simplicity is power** | 连接 = 选应用名 + 复制两处；状态用「使用中 / 等待首次使用」。 |
| 3 | **Design for trust** | Agent 工具调用可见；写/删需确认。 |
| 4 | **Delight in details** | 流式输出、tool 卡片、代码块样式精致。 |
| 5 | **Be consistent** | Chat 与设置页共用 M3 Token。 |

### UX Metaphors（修订）

1. **谁在用** — 像 Cursor Agent 侧栏：应用**显示名**、状态、用量走势、最近调用。
2. **Chat 快捷入口** — 像 ChatGPT Composer；Hint 说明「其他应用费用在右侧」。
3. **连接应用** — 按 Cursor / Cline 分卡片；共用地址 + 专用接入码 + 折叠步骤。
4. **Always-on** — 无连接开关；「服务已开启」pill。
5. **省钱可视化** — `--savings`；用户文案：**智能压缩**（RTK）、**简洁回复**（Caveman）、**智能选模型**；PRD/设计文档可写内部名。
6. **记忆可感知** — 独立「记忆」页 + 对话「记住这条」；不说 Memory Layer。

---

## Aesthetic Direction

- **Direction:** Calm Infrastructure — Google Home / Google One VPN 的克制与可信，叠加 Raycast 的工具感。
- **Decoration level:** Intentional — 背景有极淡 mesh gradient，不抢内容；无装饰性 blob。
- **Mood:** 安静、专注对话；像 Claude / ChatGPT Desktop，不像网络工具面板。
- **Reference sites:**
  - ChatGPT / Claude Desktop（布局与 Composer）
  - Cursor Agent View / Codex 侧栏（Activity 面板信息密度与 sparkline）
  - Material Design 3（Token 与组件）
  - Raycast（侧边栏密度）

### Anti-patterns（禁止）

- 默认紫色/蓝色 AI gradient hero
- 三列等宽 Feature Grid 营销风
- Emoji 作为 UI 图标（仅文案区可用）
- 过度 glassmorphism 导致对比度不足
- 连接态与断开态仅改文字、不改颜色

---

## Typography

采用 Google 官方字体栈，与 Android / Chrome OS 生态一致。

| Role | Font | Weight | Usage |
|------|------|--------|-------|
| **Display** | Roboto | 500 | 窗口标题、连接状态大标题 |
| **Headline** | Roboto | 500 | Panel 标题 (20sp) |
| **Title** | Roboto | 500 | 卡片标题、Nav 选中项 (16sp) |
| **Body** | Roboto | 400 | 正文、描述 (14sp) |
| **Label** | Roboto | 500 | 按钮、Chip、表格头 (12–14sp) |
| **Code / Data** | Roboto Mono | 400, 500 | URL、API Key、路由日志；`font-variant-numeric: tabular-nums` |

### Type Scale（Desktop, 1.25 ratio）

| Token | Size | Line height | Weight |
|-------|------|-------------|--------|
| `display-lg` | 32px | 40px | 500 |
| `display-sm` | 24px | 32px | 500 |
| `headline-md` | 20px | 28px | 500 |
| `title-md` | 16px | 24px | 500 |
| `body-md` | 14px | 20px | 400 |
| `body-sm` | 12px | 16px | 400 |
| `label-md` | 14px | 20px | 500 |
| `label-sm` | 12px | 16px | 500 |
| `mono-md` | 13px | 20px | 400 |

### Loading

```html
<link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500&family=Roboto+Mono:wght@400;500&display=swap" rel="stylesheet">
```

Tauri 生产环境：自托管 woff2 于 `assets/fonts/`，避免运行时网络依赖。

---

## Color

**Approach:** M3 语义 token；支持 **浅色 / 深色** + **多套品牌色相**。Chat 主界面默认跟随系统，设置里可固定。

### 主题策略

| 维度 | 建议 |
|------|------|
| 默认 | **跟随系统**（macOS/Windows 深浅色） |
| MVP | 实现 1 深 + 1 浅即可上线；其余品牌色 Post-MVP |
| 切换 | 设置 → 外观：浅色 / 深色 / 跟随系统 |
| 实现 | `data-theme="forest-dark"` 等属性切换 CSS 变量，禁止硬编码 hex |

---

### 方向 A · Forest（当前默认）— 「省钱 / 生长 / 可信」

**气质：** 像 Google One、健康类工具；绿色强调「节省、运行正常」。  
**适合：** 强调计费省钱、Always-on 运行态。  
**风险：** 绿色 AI 产品较多；Chat 场景下略「工具感」，不够「对话产品」。

#### Forest · Dark（默认）

| Token | Hex | Role |
|-------|-----|------|
| `primary` | `#6DD58C` | 主按钮、Smart 图标、节省数字 |
| `on-primary` | `#003822` | 主按钮文字 |
| `primary-container` | `#005233` | 选中、模型菜单高亮 |
| `on-primary-container` | `#92F5AC` | 容器内强调 |
| `secondary` | `#A8C7FA` | 链接、用户消息标签、信息 |
| `secondary-container` | `#004A77` | Nav 选中背景 |
| `tertiary` | `#D0BCFF` | 记忆、特殊标签 |
| `error` | `#FFB4AB` | 错误、危险操作 |
| `warn` | `#FFB951` | 预算告警 |
| `surface` | `#141218` | 主内容背景 |
| `surface-low` | `#1D1B20` | 侧栏 |
| `surface-container` | `#211F26` | 卡片、Composer |
| `surface-high` | `#2B2930` | Hover |
| `surface-highest` | `#36343B` | 菜单、Toast |
| `on-surface` | `#E6E1E5` | 正文 |
| `on-surface-variant` | `#CAC4D0` | 次要文字 |
| `outline-variant` | `#49454F` | 边框 |

#### Forest · Light

| Token | Hex | Role |
|-------|-----|------|
| `primary` | `#006C44` | 主色（深绿，保证对比度） |
| `on-primary` | `#FFFFFF` | 主按钮文字 |
| `primary-container` | `#A8F5C5` | 选中背景 |
| `on-primary-container` | `#002114` | 选中文字 |
| `secondary` | `#00659E` | 链接、信息 |
| `secondary-container` | `#CFE5FF` | Nav 选中 |
| `surface` | `#FFFBFE` | 主背景 |
| `surface-low` | `#F7F2FA` | 侧栏 |
| `surface-container` | `#F3EDF7` | 卡片、Composer |
| `surface-high` | `#ECE6F0` | Hover |
| `surface-highest` | `#E6E0E9` | 浮层 |
| `on-surface` | `#1C1B1F` | 正文 |
| `on-surface-variant` | `#49454F` | 次要 |
| `outline-variant` | `#CAC4D0` | 边框 |
| `scene-bg` | `#ECECEC` | 窗口外背景（预览用） |

Light 注意：Primary 用 **深绿** 而非亮绿；「节省」仍可用 `#00875A` 语义色，不用 neon。

---

### 方向 B · Slate（推荐 Chat 主界面）— 「对话 / 中性 / 基础设施」

**气质：** 接近 ChatGPT / Claude Desktop — 灰阶为主，**蓝色**作交互强调；绿色仅用于「省钱 / 成功」语义。  
**适合：** Chat-first 产品定位；长时间阅读友好。  
**与 Vercel 徽章：** 中性 UI 不抢 Logo；信任感更稳。

#### Slate · Dark

| Token | Hex |
|-------|-----|
| `primary` | `#82B1FF` |
| `on-primary` | `#002F65` |
| `primary-container` | `#004A77` |
| `on-primary-container` | `#D3E3FD` |
| `secondary` | `#6DD58C` | ← 仅「节省 / 运行正常」 |
| `surface` | `#0F1117` |
| `surface-low` | `#161922` |
| `surface-container` | `#1C1F28` |
| `surface-high` | `#252932` |
| `on-surface` | `#E8EAED` |
| `outline-variant` | `#3D424D` |

#### Slate · Light

| Token | Hex |
|-------|-----|
| `primary` | `#1A73E8` |
| `on-primary` | `#FFFFFF` |
| `primary-container` | `#D3E3FD` |
| `on-primary-container` | `#041E49` |
| `secondary` | `#188038` | ← 节省金额 |
| `surface` | `#FFFFFF` |
| `surface-low` | `#F8F9FA` |
| `surface-container` | `#F1F3F4` |
| `surface-high` | `#E8EAED` |
| `on-surface` | `#202124` |
| `outline-variant` | `#DADCE0` |
| `scene-bg` | `#E8EAED` |

---

### 方向 C · Indigo — 「AI 产品感 / 年轻」

**气质：** Linear、Notion AI 一类；靛紫主色，偏「智能」而非「省钱」。  
**适合：** 弱化「路由器/账单」、强化 Agent 能力。  
**风险：** 与大量 AI SaaS 同质；省钱叙事需靠图标/文案而非主色。

| | Dark | Light |
|---|------|-------|
| `primary` | `#A4B4FF` | `#4F46E5` |
| `surface` | `#12101A` | `#FAFAFA` |
| `secondary`（省钱） | `#6DD58C` | `#059669` |

---

### 方向 D · Warm Paper — 「写作 / 文档 Agent」

**气质：** 暖灰纸感背景 + 青绿点缀（Teal）；适合「改文档、写 README」场景。  
**参考：** iA Writer、Ulysses 的克制暖色。

| | Dark | Light |
|---|------|-------|
| `primary` | `#5EEAD4` | `#0D9488` |
| `surface` | `#1A1918` | `#FAFAF9` |
| `surface-low` | `#242220` | `#F5F5F4` |
| `on-surface` | `#E7E5E4` | `#292524` |

---

### 推荐决策（Chat-first 阶段）

| 优先级 | 主题 | 理由 |
|--------|------|------|
| **P0 默认** | **Slate Light + Slate Dark** | 最像用户熟悉的 Chat 产品；绿色留给「省钱」 |
| P0 备选 | Forest 深/浅 | 已有资产；若品牌坚持「省钱绿色」可保留 |
| P1 | Indigo | A/B 测试「更 AI」感知 |
| P2 | Warm Paper | 垂直场景（写作 Agent）可选 |

**Semantic 色（各主题共用逻辑）：**

| 语义 | 推荐色 | 用途 |
|------|--------|------|
| 运行 / 成功 / 节省 | Green `#6DD58C` / `#188038` | 托盘、节省金额、Tool 完成 |
| 信息 / 链接 | Blue | 用户消息、外部链接 |
| 告警 | Amber `#FFB951` | 预算 80% |
| 错误 / 删除 | Red `#FFB4AB` / `#BA1A1A` | 危险确认 |

### Semantic Colors（Forest Dark 基准）

| State | Token | Hex | Usage |
|-------|-------|-----|-------|
| Connected / 运行 | `status-connected` | `#6DD58C` | 托盘、状态 pill |
| Disconnected | `status-disconnected` | `#FFB4AB` | 已废弃「断开」主流程 |
| Degraded | `status-degraded` | `#FFB951` | Fallback |
| Savings | `status-savings` | Green 语义色 | 「今日节省」 |
| Info | `status-info` | Blue 语义色 | Gateway、链接 |

Light 模式：Semantic 色单独校准对比度，不直接 invert。

---

## Spacing

- **Base unit:** 4px
- **Density:** Comfortable（桌面工具，非移动端紧凑）

| Token | Value | Usage |
|-------|-------|-------|
| `space-0` | 0 | — |
| `space-1` | 4px | Icon padding |
| `space-2` | 8px | Inline gap |
| `space-3` | 12px | Card inner compact |
| `space-4` | 16px | Card padding default |
| `space-5` | 20px | Section gap small |
| `space-6` | 24px | Panel padding |
| `space-8` | 32px | Section gap |
| `space-10` | 40px | Hero padding |
| `space-12` | 48px | Large section |

---

## Layout

- **Approach:** Grid-disciplined — 12 column logical grid，实际 UI 以 Navigation Rail + Content 两栏为主。
- **Window default size:** 960 × 640 px（min 800 × 560）
- **Navigation Rail width:** 80px（icon-only）或 240px（expanded，默认）
- **Content max width:** 720px（主内容区居中，避免超宽屏空荡）
- **Grid columns:** 12（content area）；Region cards: 4 col desktop / 2 col narrow

### Shape（M3 Corner Radius）

| Token | Value | Usage |
|-------|-------|-------|
| `shape-xs` | 4px | Chip、Tag |
| `shape-sm` | 8px | Button、Input |
| `shape-md` | 12px | Card |
| `shape-lg` | 16px | Hero panel |
| `shape-xl` | 28px | Connection ring outer |
| `shape-full` | 9999px | FAB、Toggle |

### Elevation（Dark theme = surface tint, not shadow-heavy）

| Level | Treatment |
|-------|-----------|
| 0 | `surface-container-low` — flat |
| 1 | `surface-container` + 1px `outline-variant` |
| 2 | `surface-container-high` — hover |
| 3 | `surface-container-highest` — modal、toast |

---

## Components

### Navigation Rail

- Width 240px expanded；Logo + 4 nav items + footer Gateway badge
- Active: `secondary-container` 背景 + `primary` 左侧 3px indicator bar
- Icon 24px；Label `label-md`

### Provider Trust Badge（基础设施信任）

用户不配置 Provider，但需感知「谁在背后提供服务」以建立置信度。

| 元素 | 规格 |
|------|------|
| 位置 | Navigation Rail 底部；Settings「基础设施」区；Hero 下方可选一行 |
| 结构 | Provider SVG Logo (20px) + 名称 + 状态点 (8px pulse when healthy) |
| 文案 | 「AI 基础设施由 **Vercel** 提供」— 品牌名用 `on-surface`，其余 `on-surface-variant` |
| 状态 | `healthy` 绿点 pulse · `degraded`  amber 静态 · `offline` 灰点 |
| 交互 | 点击展开只读详情：模型数量、延迟、最近 failover（无配置项） |
| 多 Provider | 主徽章显示「NodeAI 网络」；展开列表各 Provider 只读状态 |

**禁止:** 让用户粘贴 Provider API Key 的主界面入口；禁止「切换到 OpenRouter」类操作在主路径。

### Chat Layout（主界面）

**三列结构（MVP）：** 侧栏（220px）+ 对话区（flex, max 680px 内容）— **无右侧 Activity 栏**（实时用量在 **总览顶栏** + **菜单栏托盘**）。

- **侧栏（对话视图）：** 新对话、**迷你预算 HUD**（预算剩余 + 今日节省 → 点进总览）、历史、导航
- **对话顶栏：** 当前线路只读 chip + **今日节省 chip**（有数据时）+ 轻量「总览」入口
- **上下文条：** 「AI 已知道：…」— 来自 **设置默认回复语言** + **live 记忆摘要** + 可选「仅改这条对话…」（注入 system，不写进历史）
- **对话区：** Composer Hint：「支持文件与图片 · 实时用量见托盘或总览」
- **Agent 工作区：** 仅 Agent 开启时显示于 Composer 下方

> **Post-MVP / Hub 页：** Activity 面板（300px）与完整 HUD Strip（sparkline + 预算环）保留在 **总览** 与 **账单** 页，不在对话页占宽。

| 区块 | 位置 | 规格 |
|------|------|------|
| 预算环 | 总览 / 账单 | SVG ring 56px；≥80% 用 `--warn` |
| 省钱 Banner | 总览 / 对话 ROI（首条消息内） | `--savings` tint |
| 用量走势 | 总览 `hub-live-block` + 托盘 sparkline | 260×40 / 64×24 SVG |
| 正在使用的应用 | 总览 Live 区块 | icon + 显示名 + 状态 badge |
| 最近调用 | 总览 / 账单 | **Cursor** → 写代码 → ¥（禁止 slug） |

### 应用识别（Connect Apps 页）

| 元素 | 规格 |
|------|------|
| 共用接入地址 | 一处复制；说明「粘贴到应用的自定义 API 地址」 |
| 每应用卡片 | 显示名 + icon + **Cursor 专用接入码** + 状态 |
| 状态 badge | `使用中` green · `等待首次使用` muted · `刚刚连上` pulse |
| 分步引导 | `<details>` 折叠 3–5 步，按应用模板不同 |
| 首次连上 | Toast「检测到 Cursor 已连上」+ Activity 高亮 30s |
| 添加应用 | 图标网格选模板 → 连接示意图 + 双复制按钮 → 列表出现「○ 等待首次使用」 |

### 用户文案禁忌（P0）

| 禁止 | 改用 |
|------|------|
| BYOK Hub | 总览 / Usage overview |
| App Key / API Key | 专用接入码 / Access code |
| localhost / endpoint | 接入地址 / Shared address |
| OpenAI 兼容 | （不写；只说「自定义 API 地址」） |
| RTK / Smart Route | 智能压缩 / 智能选模型 |
| Token flow | 实时用量 / Usage trend |
| cursor（slug） | Cursor |

App 色 token：`--app-cursor` · `--app-claude` · `--app-chat`

### Hub Dashboard（使用总览 · 全屏页）

- **Stat Grid（3 列）：** 今日节省（highlight）· 今日 Token · 预算剩余 + 预计天数
- **7 日柱图：** SVG/CSS bar；当日柱用 `--primary` 强调
- **按 App Donut：** 42/31/27 占比 legend
- **App 卡片列表：** live pill、流速、今日费用、share bar
- 侧栏「总览」与迷你 HUD 均可跳转

### i18n（zh / en）

- **范围：** 导航、设置、HUD 标签、Composer placeholder/hint、Hub/Billing 标题、toast
- **实现：** `data-i18n` / `data-i18n-placeholder` + 字典 `I18N.zh` / `I18N.en`；`localStorage nodeai-lang`
- **切换：** 菜单栏 + 设置页「语言」；按钮显示目标语言（中文界面显示 `EN`）
- **模型名：** Smart Route 等可本地化；模型 ID（claude-sonnet-4）保持英文
- **数字：** 货币 `¥` + tabular-nums；不强制 locale 格式化 MVP

### Model Dropdown（模型切换 · 唯一入口）

- 触发器：pill 按钮，左侧 icon（Smart = `auto_awesome`），当前模型名，`expand_more`
- 菜单：首项「智能路由」+ divider + 精选模型列表（名称 + 一行 sub）
- Selected：`primary-container` 背景
- **禁止** 分段控件、独立路由页、连接态 gating

### Message Bubble

- User：role 标签「你」+ 正文；code inline 用 mono chip
- Assistant：role「NodeAI」或「NodeAI · {model}」
- 最大宽度 720px 居中

### Tool Call Card（Agent）

- 行内卡片：`surface-container` + icon（folder_open / edit_document / delete / search）
- 结构：工具名 + mono 路径/细节
- Running：primary  tint border；Done：默认

### Composer

- 圆角 16px 容器；多行 textarea；左侧 **文件 + 图片** attach 按钮；选中后在 textarea 上方显示 attachment chips（可移除）
- 右侧 send（filled primary circle）
- Hint 文案：Agent 能力 + 附件说明，11px muted 居中

### Tooltips（icon-only 区域）

- 使用 `data-i18n-tip` + `setTooltips()`，随 `lang` 切换更新 `title`；文案用通俗中英，避免 BYOK/RTK 术语

### Code Block（消息内 · Chat）

- 结构：`.chat-code-block` — 顶栏（语言标签 + **复制**）+ `Roboto Mono` 正文区
- 背景：`surface-low` / 边框 `outline-variant`；横向滚动，不撑破 680px 消息宽
- 流式输出与完成后 **同一套 Markdown 渲染**（避免纯文本 → MD 跳变）
- **语法高亮**：`rehype-highlight`（lowlight / highlight.js 子集）+ `hljs-chat.css` 仅用 M3 token 配色
- 表格：外层横向滚动；链接：主题色 + 系统浏览器打开

### Gateway Page（外部接入 · 二级）

- 状态 pill「运行中」— 非连接按钮
- URL + Key 复制字段；Cursor 配置示例

### Endpoint Field

- `surface-container-lowest` 背景；mono 文字 `secondary`
- Trailing Copy button：Outlined style

### Stats Card

- 3 列 grid；`title-md` 数值 + `body-sm` 标签
- 正向 delta 用 `primary`；比较基准用 `on-surface-variant`

### App Table

- Header：`label-sm` uppercase tracking
- Row hover：`surface-container-high`
- Usage bar：4px height，`primary` fill on `surface-container-highest` track

### Memory Card

- Tag：Filled tonal chip — **Pref**=`secondary`, **Project**=`primary`, **Fact**=`tertiary`, **Summary**=`outline`
- Meta line：`body-sm` muted — 来源 App（Cursor / NodeAI 对话）+ 相对时间
- Row actions：删除（icon `delete`）；hover 显示 `surface-container-high`
- 列表最大宽度与 Chat 一致；空态插画 +「还没有记忆，对话里点「记住这条」」

### Memory Page（记忆 · `memory`）

| 区块 | 规格 |
|------|------|
| 页头 | 标题「记忆」+ 副标题「Cursor 与对话共享，不用重复介绍自己」 |
| 统计条 | 3 格：Pref / Project / Fact 计数（icon + 数字） |
| 卡片列表 | 按时间倒序；每条 = chip + 正文 2 行 ellipsis + 来源 |
| 空态 | `psychology` icon + 引导至 Chat「记住这条」 |
| 危险操作 | 页底 Text button「清空全部记忆」→ 确认 dialog |

### Remember Action（对话内）

- 位置：Assistant 消息底部，Text button + icon `bookmark_add`
- 文案：**记住这条** / *Remember this*
- 点击：Toast「已加入记忆」；可选展开编辑类型（Pref/Project/Fact）— Post-MVP
- 与 Memory Page 数据同源（原型用静态 `MEMORIES` 数组）

### Compression Savings（账单 · Activity）

用户可见拆分（对应 PRD §5.7）：

| UI 标签 | 内部 | 图标 | 说明 |
|---------|------|------|------|
| 智能压缩 | RTK | `compress` | 输入侧：代码、日志、diff |
| 简洁回复 | Caveman | `short_text` | 输出侧：减少啰嗦 |
| 智能选模型 | Smart Route | `auto_awesome` | 任务感知选模型 |
| 上下文整理 | Prune | `content_cut` | Post-MVP；设置里可占位开关 |

- 账单「怎么省的」：**3 列 + 合计**（MVP 不含 Prune 金额，或 gray 0）
- Activity 节省 banner 副行：压缩 % · 简洁回复 ¥ · 选模型 ¥（不用 RTK/Caveman 字样）
- Hub 总览：今日节省 foot 可双行展示「智能压缩 −34% · 简洁回复 −12%」

### Settings — 记忆与压缩

| 设置项 | 默认 | 说明 |
|--------|------|------|
| 启用记忆 | ON | 总开关 |
| 允许 Cursor 读取 | ON | 注入 memory 块 |
| 允许 Cursor 写入 | OFF | Phase 1 仅手动「记住这条」 |
| 智能压缩 | ON | RTK |
| 简洁回复 | ON | Caveman L1 |
| 上下文整理 | OFF | Prune ·「即将推出」badge |

### Toast

- Bottom center；`surface-container-highest`；`shape-full`

### Billing Dashboard（账单页）

- **周期切换：** 今日 / 7 日 / 本月 pill tabs
- **Hero 四格：** 花费 · 预算剩余 · 节省 · Token 总量（图标优先，少段落）
- **各模型费用（P0）：** 顶部彩色堆叠条 + 逐模型行（icon · 占比条 · 调用次数 · Token · ¥）
- **7 日模型堆叠柱：** 每天一柱，按模型分色 — 看「是不是 Sonnet 烧太多」
- **占比环 + legend：** 模型名 · % · ¥
- **应用 × 模型矩阵：** 行=Cursor 等，列=Sonnet/Flash/mini，单元格 ¥ + 微进度条
- **明细表：** 时间 / 应用 / 模型 / Token / 费用
- **省钱拆分（P0）：** 智能压缩 · 简洁回复 · 智能选模型 · 合计（见 Compression Savings）
- **Activity 侧栏：** 今日模型堆叠条 + Top3 模型迷你列表 + 节省 banner 分项

**禁止:** 只展示应用占比不展示模型；用户无法回答「哪个模型最贵」。

### System Tray Popover

- 宽度 300px；顶部「NodeAI 运行中」— **无 Switch**
- Token sparkline + 今日 / 剩余 / 节省
- Actions：打开对话、计费

### Tray Icon States

| State | SVG | Badge |
|-------|-----|-------|
| connected | Green hex shield | none |
| degraded | Amber shield | none |
| disconnected | Gray shield | none |
| budget_warn | Green shield | Red dot 6px |

---
- Duration 2.5s；enter/exit 200ms

---

## Motion

- **Approach:** Intentional — 连接态、数据流、面板切换有动效；设置页静态。

| Token | Duration | Easing | Usage |
|-------|----------|--------|-------|
| `motion-micro` | 100ms | `cubic-bezier(0.2, 0, 0, 1)` | Toggle、Copy feedback |
| `motion-short` | 200ms | `cubic-bezier(0.2, 0, 0, 1)` | Card select、Nav |
| `motion-medium` | 300ms | `cubic-bezier(0.2, 0, 0, 1)` | Connect/disconnect hero |
| `motion-pulse` | 2000ms | `ease-in-out` | Connected ring、status dot |
| `motion-flow` | 1200ms | `linear` | SVG dash line 数据流（infinite） |
| `motion-stagger` | 400ms | `cubic-bezier(0.2, 0, 0, 1)` | Region cards 依次入场，delay 50ms/step |
| `motion-slide-up` | 350ms | `cubic-bezier(0, 0, 0.2, 1)` | 路由 log 新条目 |

### SVG 资产规范

| Asset | 格式 | 说明 |
|-------|------|------|
| Brand mark | Inline SVG | 六边形 hub + 中心节点，可 CSS `stroke-dashoffset` 动画 |
| Connection flow | Inline SVG | Hero 内 App→NodeAI→Provider |
| Region icons | Inline SVG 32×32 | 每档模型独有图形，不用 emoji |
| Provider logos | Inline SVG 或官方 monochrome | Vercel ▲ 20px；未来 Provider 同尺寸 |
| Status shield | Inline SVG 48px | 连接/断开 morph（CSS opacity crossfade） |

- 所有 SVG：`currentColor` 或 CSS variable 填色，支持主题切换
- 装饰性背景：2–3 个 `radial-gradient` orb，`blur(80px)`，slow float animation

- **Enter:** ease-out decelerate
- **Exit:** ease-in accelerate
- **Reduced motion:** `@media (prefers-reduced-motion: reduce)` 禁用 pulse、flow、float，保留 opacity 切换

---

## Iconography

- **Library:** [Material Symbols Outlined](https://fonts.google.com/icons)（Google 官方）
- **Size:** 20px inline / 24px nav / 32px region cards
- **Style:** Outlined default；Filled 仅用于 active nav
- **禁止:** Emoji 作为 icon slot

常用映射：

| Concept | Symbol name |
|---------|-------------|
| 连接 | `shield` / `vpn_lock` |
| 应用 | `apps` |
| 记忆 | `psychology` |
| 设置 | `settings` |
| 极速 | `bolt` |
| 均衡 | `balance` |
| 深度 | `neurology` |
| 智能 | `auto_awesome` |

---

## Accessibility

- **Contrast:** 正文 vs surface ≥ 4.5:1（WCAG AA）；Primary button ≥ 4.5:1
- **Focus:** 所有 interactive 元素 visible focus ring — 2px `primary` offset 2px
- **Touch/Click target:** 最小 40×40px（桌面 mouse 可 32px 但 padding 补足）
- **Screen reader:** Connection state 用 `aria-live="polite"`；Toggle 带 `aria-checked`
- **Language:** 默认 zh-CN；用户可切 en；`lang` / `data-lang` 同步；数字与货币格式跟随系统 locale

---

## Screen Inventory

| Screen | Route / Panel | Priority |
|--------|---------------|----------|
| **对话（Chat + Agent + Activity）** | `chat` | P0 · 默认 |
| **使用总览** | `hub` | P0 |
| **连接应用**（去连接 / 已在用 Tab） | `gateway` | P0 |
| 账单与预算 | `billing` | P0 · 「更多」菜单 |
| **记忆** | `memory` | P0 · 「更多」菜单 |
| 套餐与额度 | `plan` | P0 · 账号入口 |
| 设置 | `settings` | P0 · 「更多」菜单 |
| **登录 / 注册 / Onboarding** | `auth` | P0 |
| 系统托盘 Popover | `tray` | P0 |

原型文件：`prototypes/auth.html`（账号）、`prototypes/dashboard.html`（主应用）

---

## CSS Custom Properties Reference

实现时复制以下 block 为单一 source of truth：

```css
:root {
  --md-sys-color-primary: #6DD58C;
  --md-sys-color-on-primary: #003822;
  --md-sys-color-primary-container: #005233;
  --md-sys-color-on-primary-container: #92F5AC;
  --md-sys-color-secondary: #A8C7FA;
  --md-sys-color-secondary-container: #004A77;
  --md-sys-color-tertiary: #D0BCFF;
  --md-sys-color-error: #FFB4AB;
  --md-sys-color-on-error: #690005;
  --md-sys-color-surface: #141218;
  --md-sys-color-surface-container-low: #1D1B20;
  --md-sys-color-surface-container: #211F26;
  --md-sys-color-surface-container-high: #2B2930;
  --md-sys-color-surface-container-highest: #36343B;
  --md-sys-color-on-surface: #E6E1E5;
  --md-sys-color-on-surface-variant: #CAC4D0;
  --md-sys-color-outline-variant: #49454F;
  --font-brand: 'Roboto', system-ui, sans-serif;
  --font-mono: 'Roboto Mono', monospace;
  --shape-md: 12px;
  --shape-lg: 16px;
  --space-4: 16px;
  --space-6: 24px;
  --motion-short: 200ms cubic-bezier(0.2, 0, 0, 1);
}
```

---

## Decisions Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-05-31 | Chat-first 改版 | 主界面改为对话；去掉连接开关 |
| 2026-05-31 | 多主题色板 | Forest / Slate / Indigo / Paper；推荐 Slate 为 Chat 默认 |
| 2026-05-31 | Primary 用 Green 而非 Google Blue | 连接/安全隐喻；Blue 留给 secondary/info |
| 2026-05-31 | Roboto + Roboto Mono 字体栈 | Google 官方格式；跨平台一致 |
| 2026-05-31 | Material Symbols 替代 Emoji icons | 专业感；符合 Google icon 规范 |
| 2026-05-31 | Navigation Rail 240px expanded | 比 icon-only 更适合小白读 label |
| 2026-05-31 | 上游 Provider 不对用户暴露 | 降低小白门槛；信任徽章替代配置界面 |
| 2026-05-31 | Hero 内嵌 SVG 数据流动画 | 强化 VPN/流量中枢隐喻，提升精致度 |
| 2026-05-31 | BYOK Hub + Activity 面板 | 核心感知：App 调用、Token、省钱可视化；参考 Cursor Agent View |
| 2026-05-31 | 全界面 i18n zh/en | 菜单栏与设置切换；`data-i18n` 模式 |
| 2026-06-02 | Chat 单列 + 用量在总览/托盘 | 对话专注；Activity 300px 移至 Hub；对齐 `nodeai-prototype.mdc` |
| 2026-06-02 | Tauri Overlay titlebar | 去掉 Web 假交通灯；`data-tauri-drag-region` 于 Menubar |

---

## Implementation Notes

1. **Tauri:** WebView 内加载与 prototype 相同 token；原生 titlebar 使用 `titleBarStyle: Overlay`（macOS）。
2. **Tray icon:** 三态 SVG — connected (green), degraded (amber), disconnected (gray/red)。
3. **QA 对照:** 任何 UI PR 需对照本文件 token；偏离须更新 Decisions Log。

---

*Maintained by NodeAI design · See also [docs/PRD.md](docs/PRD.md)*
