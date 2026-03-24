const axios = require('axios');
const fs = require('fs');
const path = require('path');

const OUTPUT_FILE = path.join(__dirname, 'model_providers.json');

const STATIC_EMBEDDINGS = [
  { providerId: 'openai', id: 'openai/text-embedding-3-small', name: 'OpenAI: Text Embedding 3 Small', description: 'Highly efficient and cost-effective embedding model.', contextLength: 8191, pricing: { prompt: "0.00000002", completion: "0" }, architecture: { input_modalities: ["text"], output_modalities: ["embedding"] } },
  { providerId: 'openai', id: 'openai/text-embedding-3-large', name: 'OpenAI: Text Embedding 3 Large', description: 'High performance embedding model for advanced tasks.', contextLength: 8191, pricing: { prompt: "0.00000013", completion: "0" }, architecture: { input_modalities: ["text"], output_modalities: ["embedding"] } },
  { providerId: 'openai', id: 'openai/text-embedding-ada-002', name: 'OpenAI: Text Embedding Ada 002', description: 'Previous generation OpenAI embedding model.', contextLength: 8191, pricing: { prompt: "0.0000001", completion: "0" }, architecture: { input_modalities: ["text"], output_modalities: ["embedding"] } },
  { providerId: 'cohere', id: 'cohere/embed-english-v3.0', name: 'Cohere: Embed English v3.0', description: 'Industry-leading English text embedding model.', contextLength: 512, pricing: { prompt: "0.0000001", completion: "0" }, architecture: { input_modalities: ["text"], output_modalities: ["embedding"] } },
  { providerId: 'cohere', id: 'cohere/embed-multilingual-v3.0', name: 'Cohere: Embed Multilingual v3.0', description: 'Multilingual text embedding model supporting 100+ languages.', contextLength: 512, pricing: { prompt: "0.0000001", completion: "0" }, architecture: { input_modalities: ["text"], output_modalities: ["embedding"] } },
  { providerId: 'google', id: 'google/text-embedding-004', name: 'Google: Text Embedding 004', description: 'Google Gemini text embedding model.', contextLength: 2048, pricing: { prompt: "0.000000025", completion: "0" }, architecture: { input_modalities: ["text"], output_modalities: ["embedding"] } },
  { providerId: 'mistralai', id: 'mistralai/mistral-embed', name: 'Mistral: Mistral Embed', description: 'Mistral state-of-the-art text embedding model.', contextLength: 8192, pricing: { prompt: "0.0000001", completion: "0" }, architecture: { input_modalities: ["text"], output_modalities: ["embedding"] } },
  { providerId: 'voyageai', id: 'voyageai/voyage-3', name: 'Voyage AI: Voyage 3', description: 'State-of-the-art general-purpose embedding model.', contextLength: 32000, pricing: { prompt: "0.00000012", completion: "0" }, architecture: { input_modalities: ["text"], output_modalities: ["embedding"] } },
  { providerId: 'voyageai', id: 'voyageai/voyage-3-lite', name: 'Voyage AI: Voyage 3 Lite', description: 'Fast and cost-effective general-purpose embedding model.', contextLength: 32000, pricing: { prompt: "0.00000004", completion: "0" }, architecture: { input_modalities: ["text"], output_modalities: ["embedding"] } },
  { providerId: 'nomic', id: 'nomic/nomic-embed-text-v1.5', name: 'Nomic: Embed Text v1.5', description: 'High-performing, fully auditable open embedding model.', contextLength: 8192, pricing: { prompt: "0.00000001", completion: "0" }, architecture: { input_modalities: ["text"], output_modalities: ["embedding"] } },
  { providerId: 'jina', id: 'jina/jina-embeddings-v3', name: 'Jina: Embeddings v3', description: 'High-performance multilingual text embedding model with task-specific LoRA adapters.', contextLength: 8192, pricing: { prompt: "0.00000001", completion: "0" }, architecture: { input_modalities: ["text"], output_modalities: ["embedding"] } }
];

// Map of provider names to their actual website domains for better logo fetching
const DOMAIN_MAP = {
  'openai': 'openai.com',
  'anthropic': 'anthropic.com',
  'google': 'google.com',
  'meta-llama': 'meta.com',
  'mistralai': 'mistral.ai',
  'deepseek': 'deepseek.com',
  'qwen': 'aliyun.com',
  'cohere': 'cohere.com',
  'perplexity': 'perplexity.ai',
  'nvidia': 'nvidia.com',
  'x-ai': 'x.ai',
  'alibaba': 'alibaba.com',
  'amazon': 'amazon.com',
  'baidu': 'baidu.com',
  'bytedance': 'bytedance.com',
  'tencent': 'tencent.com',
  'moonshotai': 'moonshot.cn',
  'minimax': 'minimaxi.com',
  'zhipuai': 'zhipuai.cn',
  'stepfun': 'stepfun.com',
  'voyageai': 'voyageai.com',
  'nomic': 'nomic.ai',
  'jina': 'jina.ai'
};

const API_BASE_MAP = {
  'openai': 'https://api.openai.com/v1',
  'anthropic': 'https://api.anthropic.com/v1',
  'google': 'https://generativelanguage.googleapis.com/v1beta',
  'mistralai': 'https://api.mistral.ai/v1',
  'deepseek': 'https://api.deepseek.com',
  'qwen': 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  'cohere': 'https://api.cohere.ai/v1',
  'perplexity': 'https://api.perplexity.ai',
  'nvidia': 'https://integrate.api.nvidia.com/v1',
  'x-ai': 'https://api.x.ai/v1',
  'moonshotai': 'https://api.moonshot.cn/v1',
  'minimax': 'https://api.minimax.chat/v1',
  'zhipuai': 'https://open.bigmodel.cn/api/paas/v4',
  'yi': 'https://api.lingyiwanwu.com/v1',
  'stepfun': 'https://api.stepfun.com/v1',
  'baichuan': 'https://api.baichuan-ai.com/v1',
  'groq': 'https://api.groq.com/openai/v1',
  'together': 'https://api.together.xyz/v1',
  'voyageai': 'https://api.voyageai.com/v1',
  'jina': 'https://api.jina.ai/v1'
};

async function fetchModels() {
  console.log('Fetching model data from OpenRouter...');
  
  try {
    const response = await axios.get('https://openrouter.ai/api/v1/models');
    
    if (response.status !== 200 || !response.data || !response.data.data) {
      throw new Error(`Failed to fetch: HTTP ${response.status}`);
    }

    const models = response.data.data;
    const providersMap = new Map();

    const addModel = (providerId, modelData) => {
      let providerName = providerId.charAt(0).toUpperCase() + providerId.slice(1);
      
      if (!providersMap.has(providerName)) {
        let domain = DOMAIN_MAP[providerId] || `${providerId}.com`;
        providersMap.set(providerName, {
          name: providerName,
          logoUrl: `https://www.google.com/s2/favicons?sz=128&domain=${domain}`, 
          openrouterApiUrl: 'https://openrouter.ai/api/v1/chat/completions',
          nativeApiUrl: API_BASE_MAP[providerId] || 'Unknown',
          models: []
        });
      }

      providersMap.get(providerName).models.push(modelData);
    };

    models.forEach(model => {
      const parts = model.id.split('/');
      let providerId = parts.length > 1 ? parts[0].toLowerCase() : 'unknown';
      addModel(providerId, {
        id: model.id,
        name: model.name,
        description: model.description || 'No description provided.',
        contextLength: model.context_length,
        pricing: model.pricing,
        architecture: model.architecture
      });
    });

    // Inject static embedding models
    STATIC_EMBEDDINGS.forEach(em => {
      addModel(em.providerId, {
        id: em.id,
        name: em.name,
        description: em.description,
        contextLength: em.contextLength,
        pricing: em.pricing,
        architecture: em.architecture
      });
    });

    const result = Array.from(providersMap.values());
    result.sort((a, b) => a.name.localeCompare(b.name));

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(result, null, 2));
    
    console.log(`Success! Fetched ${models.length} API models + ${STATIC_EMBEDDINGS.length} static embedding models across ${result.length} providers.`);
    console.log(`Data saved to: ${OUTPUT_FILE}`);

  } catch (error) {
    console.error('Error fetching data:', error.message);
  }
}

fetchModels();