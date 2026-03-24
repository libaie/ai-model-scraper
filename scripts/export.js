const fs = require('fs');
const path = require('path');

const INPUT = path.join(__dirname, 'model_providers_grouped.json');
const MD_OUTPUT = path.join(__dirname, 'AI_Models_List.md');
const OPML_OUTPUT = path.join(__dirname, 'AI_Models_MindMap.opml');

const data = JSON.parse(fs.readFileSync(INPUT, 'utf8'));

function formatPrice(pricing) {
    if (!pricing) return '免费/未知';
    let promptPrice = parseFloat(pricing.prompt);
    let compPrice = parseFloat(pricing.completion);
    
    if (isNaN(promptPrice) && isNaN(compPrice)) return '免费/未知';
    if (promptPrice === 0 && compPrice === 0) return '免费';
    
    // Calculate price per 1M tokens
    let pPrompt = promptPrice * 1000000;
    let pComp = compPrice * 1000000;
    
    // Formatting dynamically based on price range
    let fmtPrompt = pPrompt < 0.01 ? pPrompt.toFixed(4) : pPrompt.toFixed(2);
    let fmtComp = pComp < 0.01 ? pComp.toFixed(4) : pComp.toFixed(2);
    
    // Strip trailing zeros after decimal if any
    return `输入 $${parseFloat(fmtPrompt)}/1M, 输出 $${parseFloat(fmtComp)}/1M`;
}

// 1. Generate Markdown
let md = '# 最新 AI 模型全景图 (基于 OpenRouter)\n\n';
md += '> 本文档由自动化脚本抓取并分类生成。价格基于 OpenRouter 的 1M Tokens 计费标准。\n\n';

data.forEach(provider => {
  md += `## 🏢 ${provider.name} (${provider.totalModels} 个模型)\n\n`;
  provider.families.forEach(family => {
    md += `### 📂 ${family.familyName}\n\n`;
    md += `| 模型名称 | ID | 上下文 | 价格 (1M Tokens) | 描述 |\n`;
    md += `| :--- | :--- | :--- | :--- | :--- |\n`;
    family.models.forEach(model => {
      let priceInfo = formatPrice(model.pricing);
      let contextInfo = model.contextLength ? (model.contextLength >= 1000 ? (model.contextLength/1000)+'K' : model.contextLength) : '未知';
      let desc = model.description.replace(/\n/g, ' '); // remove newlines for table
      md += `| **${model.name}** | \`${model.id}\` | ${contextInfo} | ${priceInfo} | ${desc} |\n`;
    });
    md += '\n';
  });
});

fs.writeFileSync(MD_OUTPUT, md);

// 2. Generate OPML (Mind Map format)
const escapeXml = (unsafe) => {
    if (!unsafe) return '';
    return unsafe.toString().replace(/[<>&'"]/g, c => {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
        }
    });
};

let opml = `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <head>
    <title>最新 AI 模型全景图</title>
  </head>
  <body>
    <outline text="AI 供应商与模型全景图">
`;

data.forEach(provider => {
  opml += `      <outline text="${escapeXml('🏢 ' + provider.name)}">\n`;
  provider.families.forEach(family => {
    opml += `        <outline text="${escapeXml('📂 ' + family.familyName)}">\n`;
    family.models.forEach(model => {
        let priceInfo = formatPrice(model.pricing);
        let contextInfo = model.contextLength ? (model.contextLength >= 1000 ? (model.contextLength/1000)+'K' : model.contextLength) : '未知';
        let note = `ID: ${model.id}\n上下文: ${contextInfo}\n价格: ${priceInfo}\n描述: ${model.description}`;
        // Create an outline for the model, and sub-outlines for context/price to make mind map cleaner
        opml += `          <outline text="${escapeXml(model.name)}" _note="${escapeXml(note)}">\n`;
        opml += `            <outline text="${escapeXml('上下文: ' + contextInfo)}" />\n`;
        opml += `            <outline text="${escapeXml('价格: ' + priceInfo)}" />\n`;
        opml += `          </outline>\n`;
    });
    opml += `        </outline>\n`;
  });
  opml += `      </outline>\n`;
});

opml += `    </outline>
  </body>
</opml>`;

fs.writeFileSync(OPML_OUTPUT, opml);

console.log('Export completed:');
console.log(`- Markdown: ${MD_OUTPUT}`);
console.log(`- OPML (Mind Map): ${OPML_OUTPUT}`);