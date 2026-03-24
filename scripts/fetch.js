const axios = require('axios');
const fs = require('fs');
const path = require('path');

const OUTPUT_FILE = path.join(__dirname, 'model_providers.json');

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
  'stepfun': 'stepfun.com'
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

    models.forEach(model => {
      const parts = model.id.split('/');
      let providerId = parts.length > 1 ? parts[0].toLowerCase() : 'unknown';
      let providerName = providerId.charAt(0).toUpperCase() + providerId.slice(1);

      if (!providersMap.has(providerName)) {
        // Resolve domain
        let domain = DOMAIN_MAP[providerId] || `${providerId}.com`;
        
        providersMap.set(providerName, {
          name: providerName,
          // Use unpkg or clearbit to get the logo using the correct domain
          logoUrl: `https://www.google.com/s2/favicons?sz=128&domain=${domain}`, 
          apiUrl: 'https://openrouter.ai/api/v1/chat/completions',
          models: []
        });
      }

      providersMap.get(providerName).models.push({
        id: model.id,
        name: model.name,
        description: model.description || 'No description provided.',
        contextLength: model.context_length,
        pricing: model.pricing,
        architecture: model.architecture
      });
    });

    const result = Array.from(providersMap.values());
    result.sort((a, b) => a.name.localeCompare(b.name));

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(result, null, 2));
    
    console.log(`Success! Fetched ${models.length} models across ${result.length} providers.`);
    console.log(`Data saved to: ${OUTPUT_FILE}`);

  } catch (error) {
    console.error('Error fetching data:', error.message);
  }
}

fetchModels();