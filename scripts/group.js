const fs = require('fs');
const path = require('path');

const INPUT = path.join(__dirname, 'model_providers_zh.json');
const OUTPUT = path.join(__dirname, 'model_providers_grouped.json');

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

function run() {
  const data = JSON.parse(fs.readFileSync(INPUT, 'utf8'));
  
  const groupedData = data.map(provider => {
    const familiesMap = new Map();
    
    provider.models.forEach(model => {
      let cleanName = model.name.replace(new RegExp('^' + provider.name + '\\s*:\\s*', 'i'), '');
      const familyName = getFamily(cleanName);
      model.tag = getModalityTag(model.architecture, cleanName); // Added Tag
      
      if (!familiesMap.has(familyName)) {
        familiesMap.set(familyName, {
          familyName: familyName,
          models: []
        });
      }
      familiesMap.get(familyName).models.push(model);
    });
    
    const families = Array.from(familiesMap.values()).sort((a, b) => a.familyName.localeCompare(b.familyName));
    
    return {
      name: provider.name,
      logoUrl: provider.logoUrl,
      apiUrl: provider.apiUrl,
      totalModels: provider.models.length,
      families: families
    };
  });
  
  fs.writeFileSync(OUTPUT, JSON.stringify(groupedData, null, 2));
  console.log(`Dynamic grouping complete! Saved to ${OUTPUT}`);
  
  console.log('\n--- Grouping Preview (Refined) ---');
  ['Openai', 'Anthropic', 'Google', 'Meta-llama', 'Deepseek'].forEach(name => {
    const p = groupedData.find(x => x.name === name);
    if (p) {
      console.log(`\n🏢 ${p.name} (${p.totalModels} models):`);
      p.families.forEach(f => {
        console.log(`  📂 ${f.familyName} (${f.models.length} 迭代/变体)`);
        f.models.slice(0, 2).forEach(m => console.log(`      - ${m.name}`));
        if (f.models.length > 2) console.log(`      ...`);
      });
    }
  });
}

run();