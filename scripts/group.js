const fs = require('fs');
const path = require('path');

const INPUT = path.join(__dirname, 'model_providers_zh.json');
const OUTPUT = path.join(__dirname, 'model_providers_grouped.json');

// Refined list of Top-Tier Official Providers (Companies with verifiable official APIs)
const TOP_TIER_PROVIDERS = [
  'openai', 'anthropic', 'google', 'meta-llama', 'mistralai', 'deepseek', 
  'qwen', 'zhipuai', 'z-ai', 'moonshotai', 'minimax', 'stepfun', 'yi', 
  'cohere', 'perplexity', 'amazon', 'baidu', 'alibaba', 'bytedance', 
  'tencent', 'xiaomi', 'x-ai', 'nvidia', 'arcee-ai', 'fireworks', 
  'together', 'groq', 'voyageai', 'jina', 'upstage'
];

function getFamily(modelName) {
  const name = modelName.toLowerCase();
  let match;
  
  // GPT-x
  match = name.match(/gpt-?(\d+(?:\.\d+)?(?:[a-z]+)?)/i);
  if (match) {
    let ver = match[1];
    if (ver.includes('o')) return 'GPT-' + ver.toUpperCase() + ' 系列';
    return 'GPT-' + ver + ' 系列';
  }
  
  // o-series
  match = name.match(/o(\d+)/i);
  if (match && (name.includes('openai') || name.startsWith('o'))) return 'o' + match[1] + ' 系列';
  
  // Claude
  match = name.match(/claude (?:(?:sonnet|opus|haiku) )?(\d+(?:\.\d+)?)/i);
  if (match) return 'Claude ' + match[1] + ' 系列';
  match = name.match(/claude (sonnet|opus|haiku|instant)/i);
  if (match) return 'Claude ' + match[1].charAt(0).toUpperCase() + match[1].slice(1) + ' 系列';
  
  // Gemini
  match = name.match(/gemini (\d+(?:\.\d+)?)/i);
  if (match) return 'Gemini ' + match[1] + ' 系列';
  
  // Llama
  match = name.match(/llama (\d+(?:\.\d+)?)/i);
  if (match) return 'Llama ' + match[1] + ' 系列';
  
  // Qwen
  match = name.match(/qwen\s?(\d+(?:\.\d+)?)/i);
  if (match) return 'Qwen ' + match[1] + ' 系列';
  
  // DeepSeek
  match = name.match(/deepseek[\s-]?(v\d+(?:\.\d+)?|r\d+)/i);
  if (match) return 'DeepSeek ' + match[1].toUpperCase() + ' 系列';

  return '其他型号/迭代';
}

function getModalityTag(arch, name, types) {
  const lowerName = name.toLowerCase();
  
  if (types.includes('embeddings')) return '🔢 Embedding';
  if (types.includes('imageGen')) return '🎨 图像生成';
  
  if (arch) {
    const inputs = arch.input_modalities || [];
    if (inputs.includes('image') && inputs.includes('audio') && inputs.includes('video')) return '🌌 全模态 (图/文/音/视)';
    if (inputs.includes('image')) return '👁️ 视觉多模态';
    if (inputs.includes('audio')) return '🎵 音频多模态';
  }
  
  if (lowerName.includes('vision') || lowerName.includes('-vl')) return '👁️ 视觉多模态';
  return '📝 语言模型';
}

function getModelTypes(arch, name) {
  const lowerName = name.toLowerCase();
  const types = new Set();
  
  // 1. Inputs Analysis
  let inputs = arch ? arch.input_modalities || [] : [];
  if (inputs.includes('text')) types.add('text');
  if (inputs.includes('image')) types.add('image');
  if (inputs.includes('audio')) types.add('audio');
  if (inputs.includes('video')) types.add('video');

  // 2. Outputs Analysis
  let outputs = arch ? arch.output_modalities || [] : [];
  if (outputs.includes('text')) types.add('text');
  if (outputs.includes('image')) types.add('imageGen');
  if (outputs.includes('embedding')) types.add('embeddings');

  // 3. Name Heuristics (Fallback and Refinement)
  if (lowerName.includes('embedding') || lowerName.includes('embed') || lowerName.includes('voyage')) {
    types.add('embeddings');
  }
  if (lowerName.includes('dall-e') || lowerName.includes('flux') || lowerName.includes('midjourney')) {
    types.add('imageGen');
  }
  if (lowerName.includes('vision') || lowerName.includes('-vl')) {
    types.add('image');
  }
  if (lowerName.includes('whisper')) {
    types.add('audio');
  }

  // 4. Default for LLMs
  if (types.size === 0 || (types.size === 1 && types.has('text'))) {
      types.add('text');
  }

  return Array.from(types).sort();
}

function getProviderTypes(providerModels) {
  const types = new Set();
  providerModels.forEach(m => {
    (m.type || []).forEach(t => {
        if (t === 'text') types.add('LLM');
        if (t === 'image') types.add('VLM');
        if (t === 'imageGen') types.add('IMAGE');
        if (t === 'audio') types.add('AUDIO');
        if (t === 'embeddings') types.add('EMBEDDING');
    });
  });
  return Array.from(types).sort();
}

function run() {
  const data = JSON.parse(fs.readFileSync(INPUT, 'utf8'));
  const finalProvidersMap = new Map();

  data.forEach(p => {
    const isOfficial = p.nativeApiUrl && p.nativeApiUrl !== 'Unknown';
    let targetProviderName = isOfficial ? p.name : 'OpenRouter';
    
    if (!finalProvidersMap.has(targetProviderName)) {
        finalProvidersMap.set(targetProviderName, {
            name: targetProviderName,
            logoUrl: isOfficial ? p.logoUrl : 'https://www.google.com/s2/favicons?sz=128&domain=openrouter.ai',
            openrouterApiUrl: p.openrouterApiUrl,
            nativeApiUrl: isOfficial ? p.nativeApiUrl : 'https://openrouter.ai/api/v1',
            models: [],
            familiesMap: new Map()
        });
    }
    
    const targetP = finalProvidersMap.get(targetProviderName);
    
    p.models.forEach(model => {
      // Safer clean name logic
      let cleanName = model.name.includes(':') ? model.name.split(':')[1].trim() : model.name;
      
      model.type = getModelTypes(model.architecture, cleanName);
      model.tag = getModalityTag(model.architecture, cleanName, model.type);
      
      const familyName = isOfficial ? getFamily(cleanName) : p.name;
      
      targetP.models.push(model);
      
      if (!targetP.familiesMap.has(familyName)) {
        targetP.familiesMap.set(familyName, {
          familyName: familyName,
          models: []
        });
      }
      targetP.familiesMap.get(familyName).models.push(model);
    });
  });
  
  const result = Array.from(finalProvidersMap.values()).map(p => {
    const families = Array.from(p.familiesMap.values()).sort((a, b) => a.familyName.localeCompare(b.familyName));
    const providerTypes = getProviderTypes(p.models);
    return {
        name: p.name,
        type: providerTypes,
        logoUrl: p.logoUrl,
        openrouterApiUrl: p.openrouterApiUrl,
        nativeApiUrl: p.nativeApiUrl,
        totalModels: p.models.length,
        families: families
    };
  }).sort((a, b) => {
      if (a.name === 'OpenRouter') return 1;
      if (b.name === 'OpenRouter') return -1;
      return a.name.localeCompare(b.name);
  });

  fs.writeFileSync(OUTPUT, JSON.stringify(result, null, 2));
  console.log(`Aggregation successful. Total Providers: ${result.length}`);
}

run();