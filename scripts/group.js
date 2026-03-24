const fs = require('fs');
const path = require('path');

const INPUT = path.join(__dirname, 'model_providers_zh.json');
const OUTPUT = path.join(__dirname, 'model_providers_grouped.json');

// List of known official providers (with native APIs or major corporate backings)
const OFFICIAL_PROVIDERS = [
  'openai', 'anthropic', 'google', 'mistralai', 'deepseek', 'qwen', 
  'cohere', 'perplexity', 'nvidia', 'x-ai', 'moonshotai', 'minimax', 
  'zhipuai', 'yi', 'stepfun', 'baichuan', 'groq', 'together', 
  'voyageai', 'jina', 'meta-llama', 'amazon', 'alibaba', 'baidu', 
  'bytedance', 'tencent', 'xiaomi', 'z-ai', 'lingyi', '01-ai', 
  'upstage', 'phind', 'liquid', 'inflection', 'fireworks', 'lepton', 
  'deepinfra', 'mancer', 'nebius', 'novita', 'ollama', 'cloudflare'
];

function getFamily(modelName) {
  const name = modelName.toLowerCase();
  
  // Dynamic matching for major brands
  let match;
  
  // OpenAI GPT-x.y
  match = name.match(/gpt-?(\d+(?:\.\d+)?(?:[a-z]+)?)/i);
  if (match) {
    let ver = match[1];
    if (ver.includes('o')) return 'GPT-' + ver.toUpperCase() + ' 系列'; // handle 4o
    return 'GPT-' + ver + ' 系列';
  }
  
  // OpenAI o-series (o1, o3, etc.)
  match = name.match(/o(\d+)/i);
  if (match && (name.includes('openai') || name.startsWith('o'))) return 'o' + match[1] + ' 系列';
  
  // Anthropic Claude
  match = name.match(/claude (?:(?:sonnet|opus|haiku) )?(\d+(?:\.\d+)?)/i);
  if (match) return 'Claude ' + match[1] + ' 系列';
  match = name.match(/claude (sonnet|opus|haiku|instant)/i);
  if (match) return 'Claude ' + match[1].charAt(0).toUpperCase() + match[1].slice(1) + ' 系列';
  
  // Google Gemini
  match = name.match(/gemini (\d+(?:\.\d+)?)/i);
  if (match) return 'Gemini ' + match[1] + ' 系列';
  if (name.includes('gemini')) return 'Gemini 早期系列';
  
  // Google Gemma
  match = name.match(/gemma (\d+(?:\.\d+)?|\d+[a-z]+)/i);
  if (match) return 'Gemma ' + match[1] + ' 系列';
  
  // Meta Llama
  match = name.match(/llama (\d+(?:\.\d+)?)/i);
  if (match) return 'Llama ' + match[1] + ' 系列';
  if (name.includes('llama guard')) return 'Llama Guard 安全系列';
  
  // Mistral / Mixtral
  if (name.includes('mixtral')) return 'Mixtral (MoE) 系列';
  if (name.includes('pixtral')) return 'Pixtral 多模态系列';
  match = name.match(/mistral (large|small|nemo|medium)/i);
  if (match) return 'Mistral ' + match[1].charAt(0).toUpperCase() + match[1].slice(1) + ' 系列';
  if (name.includes('mistral')) return 'Mistral 标准系列';
  
  // Qwen
  match = name.match(/qwen\s?(\d+(?:\.\d+)?)/i);
  if (match) return 'Qwen ' + match[1] + ' 系列';
  if (name.includes('qwen')) return 'Qwen 基础系列';
  
  // DeepSeek
  if (name.includes('deepseek coder')) return 'DeepSeek Coder 代码系列';
  match = name.match(/deepseek[\s-]?(v\d+(?:\.\d+)?|r\d+)/i);
  if (match) return 'DeepSeek ' + match[1].toUpperCase() + ' 系列';
  if (name.includes('deepseek')) return 'DeepSeek 其他模型';

  // Fallback: Generic First word grouping
  match = name.match(/^([a-zA-Z]+)(?:[- \d]|$)/);
  if (match) {
    let family = match[1];
    if (family.length > 2 && !['the', 'a', 'an'].includes(family.toLowerCase())) {
      return family.charAt(0).toUpperCase() + family.slice(1).toLowerCase() + ' 家族模型';
    }
  }
  
  return '其他独立模型';
}

function getModalityTag(arch, name) {
  const lowerName = name.toLowerCase();
  
  // Explicit names fallback
  if (lowerName.includes('embedding') || lowerName.includes('embed')) return '🔢 向量/Embedding';
  if (lowerName.includes('dall-e') || lowerName.includes('midjourney') || lowerName.includes('stable diffusion') || lowerName.includes('flux')) return '🎨 图像生成';
  if (lowerName.includes('whisper')) return '🎵 音频处理';
  
  if (arch) {
    const inputs = arch.input_modalities || [];
    const outputs = arch.output_modalities || [];

    if (outputs.includes('image')) return '🎨 图像生成';
    
    // Evaluate multiple inputs
    let isVision = inputs.includes('image');
    let isAudio = inputs.includes('audio');
    let isVideo = inputs.includes('video');
    
    if (isVision && isAudio && isVideo) return '🌌 全模态 (图/文/音/视)';
    if (isVision && isAudio) return '👁️🎵 多模态 (视+听)';
    if (isVision) return '👁️ 视觉多模态';
    if (isAudio) return '🎵 音频多模态';
    if (isVideo) return '🎥 视频多模态';
  }
  
  // Fallback heuristics
  if (lowerName.includes('vision') || lowerName.includes('-vl') || lowerName.includes('omni') || lowerName.includes('multimodal')) return '👁️ 视觉多模态';
  if (lowerName.includes('audio')) return '🎵 音频多模态';
  if (lowerName.includes('coder') || lowerName.includes('codex') || lowerName.includes('-coder')) return '💻 代码模型';
  if (lowerName.includes('math')) return '🧮 数学模型';
  
  return '📝 语言模型';
}

function getModelTypes(arch, name) {
  const lowerName = name.toLowerCase();
  const types = new Set();
  
  // Name heuristics for embeddings
  if (lowerName.includes('embedding') || lowerName.includes('embed')) {
    types.add('embeddings');
    types.add('vector');
    return Array.from(types); 
  }
  
  // Name heuristics for image generation
  if (lowerName.includes('dall-e') || lowerName.includes('midjourney') || lowerName.includes('stable diffusion') || lowerName.includes('flux')) {
    types.add('imageGen');
    types.add('text'); // accepts text prompt
  }

  let inputs = [];
  let outputs = [];
  if (arch) {
    inputs = arch.input_modalities || [];
    outputs = arch.output_modalities || [];
  }

  // Output modalities
  if (outputs.includes('text') || outputs.length === 0) types.add('text');
  if (outputs.includes('image')) types.add('imageGen');
  
  // Input modalities & vision heuristics
  if (inputs.includes('text') || inputs.length === 0) types.add('text');
  if (inputs.includes('image') || lowerName.includes('vision') || lowerName.includes('-vl') || lowerName.includes('omni') || lowerName.includes('multimodal')) types.add('image');
  if (inputs.includes('audio') || lowerName.includes('audio') || lowerName.includes('whisper')) types.add('audio');
  if (inputs.includes('video')) types.add('video');

  return Array.from(types).sort();
}

function getProviderTypes(providerModels) {
  const types = new Set();
  providerModels.forEach(m => {
    const tag = m.tag || '';
    if (tag.includes('语言') || tag.includes('代码') || tag.includes('数学')) types.add('LLM');
    if (tag.includes('视觉') || tag.includes('多模态') || tag.includes('图') || tag.includes('视频') || tag.includes('视')) types.add('VLM');
    if (tag.includes('图像生成') || tag.includes('🎨')) types.add('IMAGE');
    if (tag.includes('音频') || tag.includes('🎵')) types.add('AUDIO');
    if (tag.includes('视频') || tag.includes('🎥')) types.add('VIDEO');
    if (tag.includes('向量') || tag.includes('Embedding') || tag.includes('🔢')) types.add('EMBEDDING');
    if (tag.includes('全模态') || tag.includes('🌌')) {
      types.add('OMNI');
    }
  });
  return Array.from(types).sort();
}

function run() {
  const data = JSON.parse(fs.readFileSync(INPUT, 'utf8'));
  
  // New map for grouped providers
  const finalProvidersMap = new Map();

  data.forEach(p => {
    const providerId = p.models[0].id.split('/')[0].toLowerCase();
    const isOfficial = OFFICIAL_PROVIDERS.includes(providerId);
    
    let targetProviderName = isOfficial ? p.name : 'OpenRouter';
    
    if (!finalProvidersMap.has(targetProviderName)) {
        finalProvidersMap.set(targetProviderName, {
            name: targetProviderName,
            logoUrl: isOfficial ? p.logoUrl : 'https://www.google.com/s2/favicons?sz=128&domain=openrouter.ai',
            openrouterApiUrl: p.openrouterApiUrl,
            nativeApiUrl: isOfficial ? p.nativeApiUrl : 'https://openrouter.ai/api/v1',
            models: [],
            familiesMap: new Map() // Internal map for families
        });
    }
    
    const targetP = finalProvidersMap.get(targetProviderName);
    
    p.models.forEach(model => {
      let cleanName = model.name.replace(new RegExp('^' + p.name + '\\s*:\\s*', 'i'), '');
      
      // Decision: for Non-official, family = original provider name
      // For official, family = calculated from model name
      const familyName = isOfficial ? getFamily(cleanName) : p.name;
      
      model.tag = getModalityTag(model.architecture, cleanName);
      model.type = getModelTypes(model.architecture, cleanName);
      
      targetP.models.push(model); // Still keep flat list for type counting
      
      if (!targetP.familiesMap.has(familyName)) {
        targetP.familiesMap.set(familyName, {
          familyName: familyName,
          models: []
        });
      }
      targetP.familiesMap.get(familyName).models.push(model);
    });
  });
  
  // Transform Map back to Array and finalize
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
      // Put OpenRouter at the end
      if (a.name === 'OpenRouter') return 1;
      if (b.name === 'OpenRouter') return -1;
      return a.name.localeCompare(b.name);
  });

  fs.writeFileSync(OUTPUT, JSON.stringify(result, null, 2));
  console.log(`Aggregated grouping complete! Saved to ${OUTPUT}`);
  console.log(`Consolidated into ${result.length} provider entries.`);
}

run();