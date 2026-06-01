/* Auto-aligned with prototypes/dashboard.html demo constants */
export const DEMO = {
  "BUDGET": {
    "cap": 48,
    "used": 31.2,
    "today": 3.8,
    "saved": 12.4,
    "tokens": 820000
  },
  "APPS": [
    {
      "id": "cursor",
      "icon": "code",
      "color": "var(--app-cursor)",
      "share": 42,
      "rate": 840,
      "today": 1.6,
      "key": "sk-nodeai-cursor",
      "status": "live",
      "name": {
        "zh": "Cursor",
        "en": "Cursor"
      },
      "lastSeen": {
        "zh": "刚刚在用",
        "en": "Active now"
      },
      "steps": {
        "zh": [
          "打开 Cursor → Settings → Models",
          "开启 Override OpenAI Base URL",
          "粘贴上方共用地址",
          "API Key 粘贴 Cursor 专用码",
          "保存后问一句代码问题 — 右侧会出现 Cursor 正在调用"
        ],
        "en": [
          "Cursor → Settings → Models",
          "Enable Override OpenAI Base URL",
          "Paste shared address above",
          "Paste Cursor access code as API Key",
          "Ask a coding question — Cursor shows live on the right"
        ]
      }
    },
    {
      "id": "claude-code",
      "icon": "terminal",
      "color": "var(--app-claude)",
      "share": 31,
      "rate": 320,
      "today": 1.2,
      "key": "sk-nodeai-claude-code",
      "status": "live",
      "name": {
        "zh": "Claude Code",
        "en": "Claude Code"
      },
      "lastSeen": {
        "zh": "2 分钟前",
        "en": "2 min ago"
      },
      "steps": {
        "zh": [
          "在 Claude Code 设置中找到 API 配置",
          "填入共用地址与 Claude Code 专用码",
          "首次请求后此处显示「已连接」"
        ],
        "en": [
          "Open Claude Code API settings",
          "Paste shared address + Claude Code code",
          "First request marks as connected"
        ]
      }
    },
    {
      "id": "nodeai-chat",
      "icon": "chat",
      "color": "var(--app-chat)",
      "share": 27,
      "rate": 180,
      "today": 1,
      "key": "sk-nodeai-chat",
      "status": "live",
      "name": {
        "zh": "NodeAI 对话",
        "en": "NodeAI Chat"
      },
      "lastSeen": {
        "zh": "本窗口",
        "en": "This window"
      },
      "builtin": true
    },
    {
      "id": "cline",
      "icon": "extension",
      "color": "var(--app-bot)",
      "share": 0,
      "rate": 0,
      "today": 0,
      "key": "sk-nodeai-cline",
      "status": "wait",
      "name": {
        "zh": "Cline",
        "en": "Cline"
      },
      "lastSeen": {
        "zh": "尚未收到请求",
        "en": "No requests yet"
      },
      "steps": {
        "zh": [
          "在 VS Code 安装 Cline 扩展",
          "API 设置中填入地址与 Cline 专用码",
          "发送第一条消息后自动识别为 Cline"
        ],
        "en": [
          "Install Cline in VS Code",
          "Paste address + Cline code in API settings",
          "First message identifies as Cline"
        ]
      }
    }
  ],
  "INTENTS": [
    {
      "id": "code",
      "icon": "code",
      "nameKey": "intentCode",
      "modelType": "lang",
      "defaultModel": "alibaba/qwen3-coder"
    },
    {
      "id": "learn",
      "icon": "school",
      "nameKey": "intentLearn",
      "modelType": "lang",
      "defaultModel": "google/gemini-2.5-flash"
    },
    {
      "id": "write",
      "icon": "edit_note",
      "nameKey": "intentWrite",
      "modelType": "lang",
      "defaultModel": "anthropic/claude-sonnet-4.6"
    },
    {
      "id": "chat",
      "icon": "chat",
      "nameKey": "intentChat",
      "modelType": "lang",
      "defaultModel": "google/gemini-2.5-flash"
    },
    {
      "id": "image",
      "icon": "brush",
      "nameKey": "intentImage",
      "modelType": "image",
      "defaultModel": "bfl/flux-2-pro"
    },
    {
      "id": "video",
      "icon": "movie",
      "nameKey": "intentVideo",
      "modelType": "video",
      "defaultModel": "alibaba/wan-v2.6-t2v"
    },
    {
      "id": "research",
      "icon": "travel_explore",
      "nameKey": "intentResearch",
      "modelType": "lang",
      "defaultModel": "google/gemini-2.5-pro"
    },
    {
      "id": "embed",
      "icon": "data_array",
      "nameKey": "intentEmbed",
      "modelType": "embed",
      "defaultModel": "google/gemini-embedding-001"
    }
  ],
  "GATEWAY_MODELS": [
    {
      "id": "anthropic/claude-sonnet-4.6",
      "type": "lang",
      "provider": "Anthropic",
      "priceIn": 2.2,
      "priceOut": 11,
      "ctx": 200000,
      "speed": "balanced",
      "caps": [
        "tools",
        "vision",
        "reason",
        "long"
      ],
      "displayName": {
        "zh": "Claude Sonnet 4.6",
        "en": "Claude Sonnet 4.6"
      }
    },
    {
      "id": "anthropic/claude-opus-4",
      "type": "lang",
      "provider": "Anthropic",
      "priceIn": 4.5,
      "priceOut": 22,
      "ctx": 200000,
      "speed": "deep",
      "caps": [
        "tools",
        "vision",
        "reason",
        "long"
      ],
      "displayName": {
        "zh": "Claude Opus 4",
        "en": "Claude Opus 4"
      }
    },
    {
      "id": "anthropic/claude-haiku-3.5",
      "type": "lang",
      "provider": "Anthropic",
      "priceIn": 0.8,
      "priceOut": 4,
      "ctx": 200000,
      "speed": "fast",
      "caps": [
        "tools",
        "vision",
        "long"
      ],
      "displayName": {
        "zh": "Claude Haiku 3.5",
        "en": "Claude Haiku 3.5"
      }
    },
    {
      "id": "openai/gpt-4.1",
      "type": "lang",
      "provider": "OpenAI",
      "priceIn": 1.4,
      "priceOut": 5.6,
      "ctx": 1000000,
      "speed": "balanced",
      "caps": [
        "tools",
        "vision",
        "long"
      ],
      "displayName": {
        "zh": "GPT-4.1",
        "en": "GPT-4.1"
      }
    },
    {
      "id": "openai/gpt-4.1-mini",
      "type": "lang",
      "provider": "OpenAI",
      "priceIn": 0.28,
      "priceOut": 1.12,
      "ctx": 1000000,
      "speed": "fast",
      "caps": [
        "tools",
        "vision",
        "long"
      ],
      "displayName": {
        "zh": "GPT-4.1 Mini",
        "en": "GPT-4.1 Mini"
      }
    },
    {
      "id": "openai/o4-mini",
      "type": "lang",
      "provider": "OpenAI",
      "priceIn": 1.1,
      "priceOut": 4.4,
      "ctx": 200000,
      "speed": "deep",
      "caps": [
        "tools",
        "reason",
        "long"
      ],
      "displayName": {
        "zh": "o4-mini",
        "en": "o4-mini"
      }
    },
    {
      "id": "google/gemini-2.5-flash",
      "type": "lang",
      "provider": "Google",
      "priceIn": 0.35,
      "priceOut": 1.4,
      "ctx": 1000000,
      "speed": "fast",
      "caps": [
        "tools",
        "vision",
        "long"
      ],
      "displayName": {
        "zh": "Gemini 2.5 Flash",
        "en": "Gemini 2.5 Flash"
      }
    },
    {
      "id": "google/gemini-2.5-pro",
      "type": "lang",
      "provider": "Google",
      "priceIn": 1.25,
      "priceOut": 5,
      "ctx": 2000000,
      "speed": "balanced",
      "caps": [
        "tools",
        "vision",
        "reason",
        "long"
      ],
      "displayName": {
        "zh": "Gemini 2.5 Pro",
        "en": "Gemini 2.5 Pro"
      }
    },
    {
      "id": "alibaba/qwen3-coder",
      "type": "lang",
      "provider": "Alibaba",
      "priceIn": 0.55,
      "priceOut": 2.2,
      "ctx": 262144,
      "speed": "balanced",
      "caps": [
        "tools",
        "long"
      ],
      "displayName": {
        "zh": "Qwen3 Coder",
        "en": "Qwen3 Coder"
      }
    },
    {
      "id": "alibaba/qwen3-235b",
      "type": "lang",
      "provider": "Alibaba",
      "priceIn": 0.9,
      "priceOut": 3.6,
      "ctx": 131072,
      "speed": "balanced",
      "caps": [
        "tools",
        "reason",
        "long"
      ],
      "displayName": {
        "zh": "Qwen3 235B",
        "en": "Qwen3 235B"
      }
    },
    {
      "id": "deepseek/deepseek-chat-v3",
      "type": "lang",
      "provider": "DeepSeek",
      "priceIn": 0.27,
      "priceOut": 1.1,
      "ctx": 131072,
      "speed": "balanced",
      "caps": [
        "tools",
        "long"
      ],
      "displayName": {
        "zh": "DeepSeek V3",
        "en": "DeepSeek V3"
      }
    },
    {
      "id": "deepseek/deepseek-r1",
      "type": "lang",
      "provider": "DeepSeek",
      "priceIn": 0.55,
      "priceOut": 2.19,
      "ctx": 131072,
      "speed": "deep",
      "caps": [
        "reason",
        "long"
      ],
      "displayName": {
        "zh": "DeepSeek R1",
        "en": "DeepSeek R1"
      }
    },
    {
      "id": "meta/llama-4-maverick",
      "type": "lang",
      "provider": "Meta",
      "priceIn": 0.45,
      "priceOut": 1.8,
      "ctx": 1000000,
      "speed": "fast",
      "caps": [
        "tools",
        "vision",
        "long"
      ],
      "displayName": {
        "zh": "Llama 4 Maverick",
        "en": "Llama 4 Maverick"
      }
    },
    {
      "id": "meta/llama-4-scout",
      "type": "lang",
      "provider": "Meta",
      "priceIn": 0.18,
      "priceOut": 0.59,
      "ctx": 10000000,
      "speed": "fast",
      "caps": [
        "tools",
        "long"
      ],
      "displayName": {
        "zh": "Llama 4 Scout",
        "en": "Llama 4 Scout"
      }
    },
    {
      "id": "mistral/mistral-large",
      "type": "lang",
      "provider": "Mistral",
      "priceIn": 1,
      "priceOut": 3,
      "ctx": 131072,
      "speed": "balanced",
      "caps": [
        "tools",
        "long"
      ],
      "displayName": {
        "zh": "Mistral Large",
        "en": "Mistral Large"
      }
    },
    {
      "id": "xai/grok-3",
      "type": "lang",
      "provider": "xAI",
      "priceIn": 1.5,
      "priceOut": 6,
      "ctx": 131072,
      "speed": "balanced",
      "caps": [
        "tools",
        "reason",
        "long"
      ],
      "displayName": {
        "zh": "Grok 3",
        "en": "Grok 3"
      }
    },
    {
      "id": "xai/grok-3-mini",
      "type": "lang",
      "provider": "xAI",
      "priceIn": 0.3,
      "priceOut": 0.5,
      "ctx": 131072,
      "speed": "fast",
      "caps": [
        "tools",
        "long"
      ],
      "displayName": {
        "zh": "Grok 3 Mini",
        "en": "Grok 3 Mini"
      }
    },
    {
      "id": "moonshot/kimi-k2",
      "type": "lang",
      "provider": "Moonshot",
      "priceIn": 0.6,
      "priceOut": 2.5,
      "ctx": 200000,
      "speed": "balanced",
      "caps": [
        "tools",
        "long"
      ],
      "displayName": {
        "zh": "Kimi K2",
        "en": "Kimi K2"
      }
    },
    {
      "id": "zhipu/glm-4.6",
      "type": "lang",
      "provider": "Zhipu",
      "priceIn": 0.5,
      "priceOut": 2,
      "ctx": 200000,
      "speed": "balanced",
      "caps": [
        "tools",
        "long"
      ],
      "displayName": {
        "zh": "GLM-4.6",
        "en": "GLM-4.6"
      }
    },
    {
      "id": "minimax/minimax-m2",
      "type": "lang",
      "provider": "MiniMax",
      "priceIn": 0.3,
      "priceOut": 1.2,
      "ctx": 1000000,
      "speed": "fast",
      "caps": [
        "tools",
        "long"
      ],
      "displayName": {
        "zh": "MiniMax M2",
        "en": "MiniMax M2"
      }
    },
    {
      "id": "amazon/nova-pro",
      "type": "lang",
      "provider": "Amazon",
      "priceIn": 0.8,
      "priceOut": 3.2,
      "ctx": 300000,
      "speed": "balanced",
      "caps": [
        "tools",
        "vision",
        "long"
      ],
      "displayName": {
        "zh": "Nova Pro",
        "en": "Nova Pro"
      }
    },
    {
      "id": "perplexity/sonar-pro",
      "type": "lang",
      "provider": "Perplexity",
      "priceIn": 3,
      "priceOut": 15,
      "ctx": 200000,
      "speed": "balanced",
      "caps": [
        "tools",
        "long"
      ],
      "displayName": {
        "zh": "Sonar Pro",
        "en": "Sonar Pro"
      }
    },
    {
      "id": "cohere/command-a",
      "type": "lang",
      "provider": "Cohere",
      "priceIn": 2.5,
      "priceOut": 10,
      "ctx": 256000,
      "speed": "balanced",
      "caps": [
        "tools",
        "long"
      ],
      "displayName": {
        "zh": "Command A",
        "en": "Command A"
      }
    },
    {
      "id": "bfl/flux-2-pro",
      "type": "image",
      "provider": "BFL",
      "priceIn": 0,
      "priceOut": 0.45,
      "priceUnit": "image",
      "speed": "balanced",
      "caps": [],
      "displayName": {
        "zh": "FLUX 2 Pro",
        "en": "FLUX 2 Pro"
      }
    },
    {
      "id": "bfl/flux-2-schnell",
      "type": "image",
      "provider": "BFL",
      "priceIn": 0,
      "priceOut": 0.06,
      "priceUnit": "image",
      "speed": "fast",
      "caps": [],
      "displayName": {
        "zh": "FLUX 2 Schnell",
        "en": "FLUX 2 Schnell"
      }
    },
    {
      "id": "openai/gpt-image-1",
      "type": "image",
      "provider": "OpenAI",
      "priceIn": 0,
      "priceOut": 0.32,
      "priceUnit": "image",
      "speed": "balanced",
      "caps": [],
      "displayName": {
        "zh": "GPT Image 1",
        "en": "GPT Image 1"
      }
    },
    {
      "id": "google/imagen-4",
      "type": "image",
      "provider": "Google",
      "priceIn": 0,
      "priceOut": 0.28,
      "priceUnit": "image",
      "speed": "balanced",
      "caps": [],
      "displayName": {
        "zh": "Imagen 4",
        "en": "Imagen 4"
      }
    },
    {
      "id": "stability/sd-3.5-large",
      "type": "image",
      "provider": "Stability",
      "priceIn": 0,
      "priceOut": 0.13,
      "priceUnit": "image",
      "speed": "fast",
      "caps": [],
      "displayName": {
        "zh": "SD 3.5 Large",
        "en": "SD 3.5 Large"
      }
    },
    {
      "id": "ideogram/ideogram-v3",
      "type": "image",
      "provider": "Ideogram",
      "priceIn": 0,
      "priceOut": 0.3,
      "priceUnit": "image",
      "speed": "balanced",
      "caps": [],
      "displayName": {
        "zh": "Ideogram v3",
        "en": "Ideogram v3"
      }
    },
    {
      "id": "alibaba/wan-v2.6-t2v",
      "type": "video",
      "provider": "Alibaba",
      "priceIn": 0,
      "priceOut": 2.8,
      "priceUnit": "video",
      "speed": "deep",
      "caps": [],
      "displayName": {
        "zh": "Wan 2.6 T2V",
        "en": "Wan 2.6 T2V"
      }
    },
    {
      "id": "google/veo-2",
      "type": "video",
      "provider": "Google",
      "priceIn": 0,
      "priceOut": 3.5,
      "priceUnit": "video",
      "speed": "deep",
      "caps": [],
      "displayName": {
        "zh": "Veo 2",
        "en": "Veo 2"
      }
    },
    {
      "id": "kuaishou/kling-2",
      "type": "video",
      "provider": "Kling",
      "priceIn": 0,
      "priceOut": 2.4,
      "priceUnit": "video",
      "speed": "deep",
      "caps": [],
      "displayName": {
        "zh": "Kling 2.0",
        "en": "Kling 2.0"
      }
    },
    {
      "id": "luma/ray-2",
      "type": "video",
      "provider": "Luma",
      "priceIn": 0,
      "priceOut": 3,
      "priceUnit": "video",
      "speed": "deep",
      "caps": [],
      "displayName": {
        "zh": "Ray 2",
        "en": "Ray 2"
      }
    },
    {
      "id": "google/gemini-embedding-001",
      "type": "embed",
      "provider": "Google",
      "priceIn": 0.02,
      "priceOut": 0,
      "ctx": 8192,
      "speed": "fast",
      "caps": [],
      "displayName": {
        "zh": "Gemini Embedding",
        "en": "Gemini Embedding"
      }
    },
    {
      "id": "openai/text-embedding-3-large",
      "type": "embed",
      "provider": "OpenAI",
      "priceIn": 0.04,
      "priceOut": 0,
      "ctx": 8191,
      "speed": "fast",
      "caps": [],
      "displayName": {
        "zh": "Embedding 3 Large",
        "en": "Embedding 3 Large"
      }
    },
    {
      "id": "cohere/embed-v4",
      "type": "embed",
      "provider": "Cohere",
      "priceIn": 0.03,
      "priceOut": 0,
      "ctx": 128000,
      "speed": "fast",
      "caps": [
        "long"
      ],
      "displayName": {
        "zh": "Embed v4",
        "en": "Embed v4"
      }
    },
    {
      "id": "voyage/voyage-3",
      "type": "embed",
      "provider": "Voyage",
      "priceIn": 0.06,
      "priceOut": 0,
      "ctx": 32000,
      "speed": "fast",
      "caps": [],
      "displayName": {
        "zh": "Voyage 3",
        "en": "Voyage 3"
      }
    },
    {
      "id": "jina/jina-embed-v3",
      "type": "embed",
      "provider": "Jina",
      "priceIn": 0.02,
      "priceOut": 0,
      "ctx": 8192,
      "speed": "fast",
      "caps": [],
      "displayName": {
        "zh": "Jina Embed v3",
        "en": "Jina Embed v3"
      }
    }
  ],
  "CURATED_MODEL_IDS": [
    "google/gemini-2.5-flash",
    "anthropic/claude-sonnet-4.6",
    "openai/gpt-4.1-mini",
    "alibaba/qwen3-coder",
    "deepseek/deepseek-chat-v3",
    "google/gemini-2.5-pro"
  ],
  "BONUS_ITEMS": [
    {
      "id": "compress",
      "icon": "compress",
      "on": true,
      "saveKey": "saveCompress",
      "name": {
        "zh": "智能压缩",
        "en": "Smart compress"
      },
      "sub": {
        "zh": "日志 / diff 自动瘦身",
        "en": "Slim logs & diffs"
      }
    },
    {
      "id": "concise",
      "icon": "short_text",
      "on": true,
      "saveKey": "saveConcise",
      "name": {
        "zh": "简洁回复",
        "en": "Concise replies"
      },
      "sub": {
        "zh": "减少啰嗦输出",
        "en": "Less verbose output"
      }
    },
    {
      "id": "route",
      "icon": "auto_awesome",
      "on": true,
      "saveKey": "saveRoute",
      "name": {
        "zh": "智能选模型",
        "en": "Auto model"
      },
      "sub": {
        "zh": "简单任务走便宜模型",
        "en": "Cheap model for easy tasks"
      }
    },
    {
      "id": "failover",
      "icon": "sync_alt",
      "on": true,
      "status": {
        "zh": "断工 0 次",
        "en": "0 outages"
      },
      "name": {
        "zh": "限流自动换路",
        "en": "Auto failover"
      },
      "sub": {
        "zh": "429 时无缝切换",
        "en": "Seamless on 429"
      }
    },
    {
      "id": "memory",
      "icon": "neurology",
      "on": true,
      "memCount": true,
      "name": {
        "zh": "记忆",
        "en": "Memory"
      },
      "sub": {
        "zh": "跨 App 共享偏好",
        "en": "Shared prefs across apps"
      }
    },
    {
      "id": "appbill",
      "icon": "apps",
      "on": true,
      "name": {
        "zh": "按应用账单",
        "en": "Per-app billing"
      },
      "sub": {
        "zh": "Cursor / Chat 分开算",
        "en": "Split Cursor vs Chat"
      }
    },
    {
      "id": "prune",
      "icon": "content_cut",
      "on": false,
      "name": {
        "zh": "上下文整理",
        "en": "Context prune"
      },
      "sub": {
        "zh": "长对话摘要 · v0.2",
        "en": "Long chat summary · v0.2"
      }
    }
  ],
  "MEMORIES": [
    {
      "tag": "pref",
      "text": {
        "zh": "回复用中文，代码注释用英文",
        "en": "Reply in Chinese; code comments in English"
      },
      "from": {
        "zh": "Onboarding",
        "en": "Onboarding"
      },
      "time": "2026-05-28"
    },
    {
      "tag": "project",
      "text": {
        "zh": "当前项目：NodeAI · Rust + Tauri 桌面端",
        "en": "Project: NodeAI · Rust + Tauri desktop"
      },
      "from": {
        "zh": "NodeAI 对话",
        "en": "NodeAI Chat"
      },
      "time": "2026-05-30"
    },
    {
      "tag": "fact",
      "text": {
        "zh": "部署目标：Fly.io，不用 Docker 本地跑生产",
        "en": "Deploy target: Fly.io, not Docker for prod"
      },
      "from": {
        "zh": "手动添加",
        "en": "Manual"
      },
      "time": "2026-05-29"
    }
  ],
  "SOURCES": [
    {
      "id": "nodeai",
      "default": true,
      "path": "hosted",
      "name": {
        "zh": "NodeAI 含额度",
        "en": "NodeAI allowance"
      },
      "url": "gateway://nodeai",
      "format": "openai",
      "status": {
        "zh": "正常 · 经云端",
        "en": "OK · via cloud"
      }
    },
    {
      "id": "byok-demo",
      "path": "local",
      "name": {
        "zh": "我的 DeepSeek",
        "en": "My DeepSeek"
      },
      "url": "https://api.deepseek.com/v1",
      "format": "openai",
      "status": {
        "zh": "本地直连",
        "en": "Local direct"
      }
    }
  ],
  "API_CAPS": [
    {
      "id": "chat",
      "icon": "chat",
      "on": true,
      "name": {
        "zh": "对话",
        "en": "Chat"
      },
      "sub": {
        "zh": "LLM · Agent",
        "en": "LLM · Agent"
      }
    },
    {
      "id": "embed",
      "icon": "data_array",
      "on": true,
      "name": {
        "zh": "嵌入",
        "en": "Embed"
      },
      "sub": {
        "zh": "PDF / RAG",
        "en": "PDF / RAG"
      }
    },
    {
      "id": "tts",
      "icon": "record_voice_over",
      "on": false,
      "name": {
        "zh": "朗读",
        "en": "TTS"
      },
      "sub": {
        "zh": "v0.2",
        "en": "v0.2"
      }
    },
    {
      "id": "stt",
      "icon": "mic",
      "on": false,
      "name": {
        "zh": "语音",
        "en": "STT"
      },
      "sub": {
        "zh": "v0.2",
        "en": "v0.2"
      }
    },
    {
      "id": "vision",
      "icon": "image_search",
      "on": false,
      "name": {
        "zh": "看图",
        "en": "Vision"
      },
      "sub": {
        "zh": "v0.2",
        "en": "v0.2"
      }
    },
    {
      "id": "image",
      "icon": "brush",
      "on": false,
      "name": {
        "zh": "生图",
        "en": "Image"
      },
      "sub": {
        "zh": "v0.2",
        "en": "v0.2"
      }
    },
    {
      "id": "video",
      "icon": "movie",
      "on": false,
      "name": {
        "zh": "视频",
        "en": "Video"
      },
      "sub": {
        "zh": "v0.3",
        "en": "v0.3"
      }
    },
    {
      "id": "search",
      "icon": "travel_explore",
      "on": false,
      "name": {
        "zh": "搜索",
        "en": "Search"
      },
      "sub": {
        "zh": "v0.2",
        "en": "v0.2"
      }
    },
    {
      "id": "fetch",
      "icon": "language",
      "on": false,
      "name": {
        "zh": "读网页",
        "en": "Fetch"
      },
      "sub": {
        "zh": "v0.2",
        "en": "v0.2"
      }
    }
  ],
  "APP_TEMPLATES": [
    {
      "id": "continue",
      "icon": "play_circle",
      "color": "#FF6B35",
      "name": {
        "zh": "Continue",
        "en": "Continue"
      }
    },
    {
      "id": "codex",
      "icon": "terminal",
      "color": "#10A37F",
      "name": {
        "zh": "OpenAI Codex",
        "en": "OpenAI Codex"
      }
    },
    {
      "id": "windsurf",
      "icon": "surfing",
      "color": "var(--secondary)",
      "name": {
        "zh": "Windsurf",
        "en": "Windsurf"
      }
    },
    {
      "id": "aider",
      "icon": "smart_toy",
      "color": "var(--app-claude)",
      "name": {
        "zh": "Aider",
        "en": "Aider"
      }
    },
    {
      "id": "openclaw",
      "icon": "pets",
      "color": "var(--app-bot)",
      "name": {
        "zh": "OpenClaw",
        "en": "OpenClaw"
      }
    },
    {
      "id": "hermes",
      "icon": "psychology",
      "color": "#B388FF",
      "name": {
        "zh": "Hermes Agent",
        "en": "Hermes Agent"
      }
    },
    {
      "id": "custom",
      "icon": "edit",
      "color": "var(--on-surface-variant)",
      "name": {
        "zh": "自定义",
        "en": "Custom"
      }
    }
  ],
  "BILL_PERIODS": {
    "today": {
      "spend": 3.8,
      "saved": 12.4,
      "tokens": 1200000,
      "reqs": 248,
      "models": [
        {
          "id": "claude-sonnet-4",
          "pct": 38,
          "amount": 1.44,
          "tokens": 456000,
          "reqs": 86
        },
        {
          "id": "gemini-flash",
          "pct": 29,
          "amount": 1.1,
          "tokens": 348000,
          "reqs": 102
        },
        {
          "id": "gpt-4o-mini",
          "pct": 21,
          "amount": 0.8,
          "tokens": 252000,
          "reqs": 48
        },
        {
          "id": "claude-haiku",
          "pct": 12,
          "amount": 0.46,
          "tokens": 144000,
          "reqs": 12
        }
      ],
      "saveCompress": 5.2,
      "saveConcise": 2.8,
      "saveRoute": 4.4
    },
    "week": {
      "spend": 28.4,
      "saved": 11.2,
      "tokens": 8900000,
      "reqs": 1842,
      "models": [
        {
          "id": "claude-sonnet-4",
          "pct": 41,
          "amount": 11.64,
          "tokens": 3200000,
          "reqs": 620
        },
        {
          "id": "gemini-flash",
          "pct": 32,
          "amount": 9.09,
          "tokens": 2850000,
          "reqs": 780
        },
        {
          "id": "gpt-4o-mini",
          "pct": 18,
          "amount": 5.11,
          "tokens": 1850000,
          "reqs": 310
        },
        {
          "id": "claude-haiku",
          "pct": 9,
          "amount": 2.56,
          "tokens": 1000000,
          "reqs": 132
        }
      ],
      "saveCompress": 4.8,
      "saveConcise": 2.4,
      "saveRoute": 4
    },
    "month": {
      "spend": 53.8,
      "saved": 12.4,
      "tokens": 16800000,
      "reqs": 3620,
      "models": [
        {
          "id": "claude-sonnet-4",
          "pct": 44,
          "amount": 23.67,
          "tokens": 6200000,
          "reqs": 1280
        },
        {
          "id": "gemini-flash",
          "pct": 28,
          "amount": 15.06,
          "tokens": 4700000,
          "reqs": 1420
        },
        {
          "id": "gpt-4o-mini",
          "pct": 19,
          "amount": 10.22,
          "tokens": 3800000,
          "reqs": 680
        },
        {
          "id": "claude-haiku",
          "pct": 9,
          "amount": 4.85,
          "tokens": 2100000,
          "reqs": 240
        }
      ],
      "saveCompress": 5.2,
      "saveConcise": 2.8,
      "saveRoute": 4.4
    }
  },
  "BILL_MATRIX": {
    "today": {
      "cols": [
        "claude-sonnet-4",
        "gemini-flash",
        "gpt-4o-mini"
      ],
      "rows": [
        {
          "appId": "cursor",
          "cells": [
            1.02,
            0.35,
            0.23
          ]
        },
        {
          "appId": "claude-code",
          "cells": [
            0.28,
            0.52,
            0.18
          ]
        },
        {
          "appId": "nodeai-chat",
          "cells": [
            0.14,
            0.23,
            0.39
          ]
        }
      ]
    }
  },
  "BILL_LEDGER": [
    {
      "time": "14:32",
      "appId": "cursor",
      "modelId": "claude-sonnet-4",
      "tokens": 12400,
      "cost": 0.18
    },
    {
      "time": "14:28",
      "appId": "cursor",
      "modelId": "gemini-flash",
      "tokens": 8200,
      "cost": 0.06
    },
    {
      "time": "14:15",
      "appId": "nodeai-chat",
      "modelId": "gpt-4o-mini",
      "tokens": 3100,
      "cost": 0.03
    },
    {
      "time": "13:58",
      "appId": "claude-code",
      "modelId": "gemini-flash",
      "tokens": 15600,
      "cost": 0.11
    },
    {
      "time": "13:41",
      "appId": "cursor",
      "modelId": "claude-sonnet-4",
      "tokens": 28400,
      "cost": 0.42
    },
    {
      "time": "13:22",
      "appId": "claude-code",
      "modelId": "claude-sonnet-4",
      "tokens": 9800,
      "cost": 0.14
    }
  ],
  "BILL_WEEK_STACK": [
    {
      "label": {
        "zh": "一",
        "en": "M"
      },
      "segs": [
        41,
        30,
        18,
        11
      ]
    },
    {
      "label": {
        "zh": "二",
        "en": "T"
      },
      "segs": [
        38,
        32,
        20,
        10
      ]
    },
    {
      "label": {
        "zh": "三",
        "en": "W"
      },
      "segs": [
        45,
        28,
        17,
        10
      ]
    },
    {
      "label": {
        "zh": "四",
        "en": "T"
      },
      "segs": [
        40,
        31,
        19,
        10
      ]
    },
    {
      "label": {
        "zh": "五",
        "en": "F"
      },
      "segs": [
        42,
        29,
        20,
        9
      ]
    },
    {
      "label": {
        "zh": "六",
        "en": "S"
      },
      "segs": [
        35,
        34,
        22,
        9
      ]
    },
    {
      "label": {
        "zh": "今",
        "en": "Today"
      },
      "segs": [
        38,
        29,
        21,
        12
      ]
    }
  ],
  "MODEL_META": null,
  "PLANS": [
    {
      "id": "free",
      "price": 0,
      "allowance": 12,
      "featured": false,
      "current": false,
      "feats": ["planFeatApps1", "planFeatAllow12", "planFeatCompressBasic", "planFeatBill7d", "planFeatNo"]
    },
    {
      "id": "pro",
      "price": 29,
      "allowance": 48,
      "featured": true,
      "current": true,
      "trial": true,
      "feats": ["planFeatAppsUnlim", "planFeatAllow48", "planFeatCompressFull", "planFeatLive", "planFeatMemory", "planFeatByok", "planFeatBillFull"]
    },
    {
      "id": "team",
      "price": 99,
      "allowance": 180,
      "featured": false,
      "current": false,
      "feats": ["planFeatSeats3", "planFeatAllow180", "planFeatCompressFull", "planFeatLive", "planFeatMemory", "planFeatByok", "planFeatAudit"]
    }
  ]
} as const;
