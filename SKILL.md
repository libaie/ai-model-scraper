---
name: ai-model-scraper
description: Fetch the latest AI model landscape from OpenRouter, translate descriptions to Chinese, group models by product families, and export to Markdown and OPML mind map formats with pricing. Use when users want an updated list or mind map of all major AI models.
---

# AI Model Scraper Skill

This skill automates the extraction, translation, and organization of the global AI model landscape (covering OpenAI, Anthropic, Google, Meta, DeepSeek, Mistral, etc.) using the OpenRouter API.

## When to Use

Use this skill when the user asks:
- "Fetch all AI models in the market"
- "Update the AI model list"
- "Generate an AI model mind map"
- "Show me what LLMs are available"
- "How much does GPT-5 / Claude 4 cost?"

## Features included
- **Translation Caching**: Ensures models that were already translated are skipped to prevent API rate limits.
- **Pricing Details**: Calculates pricing per 1M tokens based on OpenRouter data.
- **One-Click Execution**: All orchestration is handled via a single Node entrypoint.

## Prerequisites

Ensure dependencies are installed in the skill's `scripts` directory:
\`\`\`bash
cd scripts && npm install
\`\`\`

## Workflow

Execute the unified entry script using the `exec` tool.

\`\`\`bash
node scripts/index.js
\`\`\`

This automatically triggers:
1. **Fetch**: Fetches data from OpenRouter.
2. **Translate**: Incrementally translates new models using Google Translate.
3. **Group**: Groups models by recognizable product families.
4. **Export**: Generates structured `.md` and `.opml` files.

## Output

Once the workflow is complete, inform the user that the process finished successfully and provide them with the file paths:
- `scripts/model_providers.json`
- `scripts/model_providers_grouped.json`
- `scripts/AI_Models_List.md`
- `scripts/AI_Models_MindMap.opml`