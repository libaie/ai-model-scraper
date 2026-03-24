# 🤖 AI Model Scraper (OpenClaw Skill)

[![OpenClaw Skill](https://img.shields.io/badge/OpenClaw-Skill-blue.svg)](https://skills.sh)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

[English](#english) | [中文说明](#中文说明)

---

## English

An OpenClaw skill to automatically fetch, translate, and organize the global AI model landscape (via OpenRouter) into beautiful Markdown tables and OPML Mind Maps.

### ✨ Features

- 🌐 **Comprehensive Data**: Fetches 350+ models from 55+ providers (OpenAI, Anthropic, Google, Meta, DeepSeek, Mistral, etc.).
- 🧠 **Auto-Translation & Caching**: Translates model descriptions into Chinese using incremental caching to avoid API rate limits and speed up subsequent runs.
- 📂 **Smart Grouping**: Automatically categorizes models into product families (e.g., *GPT-4o Series*, *Claude 3.5 Series*, *Llama 3 Series*).
- 💰 **Pricing & Context**: Accurately extracts and formats token pricing (USD / 1M tokens) and maximum context window limits.
- 🏷️ **Modality Tagging**: Analyzes model architecture and names to automatically tag them as text (LLMs), multimodal (Vision/Audio), image generation, embeddings, etc.
- 🖼️ **Logo Resolution**: Automatically fetches accurate provider logos using the Google Favicon API.
- 🗺️ **Multi-Format Export**: Generates structured `Markdown` documents and `OPML` files for mind mapping tools (e.g., XMind, MindNode, FreeMind).

### 📦 Installation

Install this skill globally in your OpenClaw or compatible agent environment:

```bash
npx skills add libaie/ai-model-scraper
```

### 🚀 Usage

Once installed, you can ask your agent to run the scraper, or manually execute the pipeline:

```bash
cd scripts
npm install
node index.js
```

### 📁 Output Files

After running, the following files will be generated in the `scripts/` directory:
- `AI_Models_List.md`: The finalized Markdown table with all models, pricing, and context lengths.
- `AI_Models_MindMap.opml`: A mind map file ready to be imported into XMind/MindNode.
- `model_providers_grouped.json`: The fully structured JSON data (perfect for rendering in web apps).

---

## 中文说明

这是一个用于 OpenClaw 代理环境的自动化技能（Skill），能够一键抓取全网最新大模型列表，自动翻译、按系列归类，并生成包含价格与上下文长度的 Markdown 表格与 OPML 思维导图。

### ✨ 核心功能

- 🌐 **全景数据**：一键拉取 55+ 供应商的 350+ 个主流模型（涵盖 OpenAI, Anthropic, Google, DeepSeek, Meta 等）。
- 🧠 **增量翻译机制**：自带本地缓存机制，自动将官方英文描述翻译为中文，秒级完成增量更新，拒绝 API 封控。
- 📂 **智能家族分类**：根据模型命名自动进行家族归类（如 *GPT-4o 系列*、*Claude 3.5 系列*、*DeepSeek V3 系列* 等），告别杂乱无章。
- 💰 **价格与上下文**：自动计算并格式化每百万 Token (1M Tokens) 的输入/输出价格，提取最大上下文长度（如 128K）。
- 🏷️ **自动模态标记**：基于模型架构和命名惯例，自动打上“📝 语言模型”、“👁️ 视觉多模态”、“🎨 图像生成”、“🔢 向量/Embedding”等类型标签。
- 🖼️ **Logo 自动补全**：内置域名映射，通过 Google 接口自动获取各家 AI 厂商的高清 Logo 图标。
- 🗺️ **多格式完美导出**：一键生成结构化 Markdown 表格文档和 OPML 格式的思维导图（可直接导入 XMind、幕布等工具生成树状图）。

### 📦 安装

在你的 OpenClaw 环境（或任何支持 skills CLI 的代理环境）中全局安装：

```bash
npx skills add libaie/ai-model-scraper
```

### 🚀 使用方法

安装完成后，你可以直接让 AI 助手帮你运行（例如说：“帮我运行 AI Model Scraper 获取最新模型脑图”），或者手动执行：

```bash
cd scripts
npm install
node index.js
```

### 📁 产出文件

执行完成后，你将在 `scripts/` 目录下得到以下文件：
- 📄 `AI_Models_List.md`：带有详细价格、上下文长度的 Markdown 分类清单，适合直接阅读或发布。
- 🗺️ `AI_Models_MindMap.opml`：思维导图文件，拖入 XMind 等软件即可生成全网大模型图谱。
- ⚙️ `model_providers_grouped.json`：经过深度清洗和结构化的高质量 JSON 数据，非常适合前端开发者直接调用渲染。
