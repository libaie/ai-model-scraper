const fs = require('fs');
const axios = require('axios');
const path = require('path');

const INPUT = path.join(__dirname, 'model_providers.json');
const OUTPUT = path.join(__dirname, 'model_providers_zh.json');

// Cache to store already translated descriptions
const translationCache = new Map();

async function loadCache() {
  if (fs.existsSync(OUTPUT)) {
    try {
      const existingData = JSON.parse(fs.readFileSync(OUTPUT, 'utf8'));
      existingData.forEach(provider => {
        provider.models.forEach(model => {
          if (model.description && model.description !== '暂无描述。') {
            translationCache.set(model.id, model.description);
          }
        });
      });
      console.log(`Loaded ${translationCache.size} translations from cache.`);
    } catch (e) {
      console.log('No valid cache found, starting fresh.');
    }
  }
}

async function translateText(text, retries = 3) {
  if (!text || text === 'No description provided.' || text.trim() === '') return '暂无描述。';
  
  for (let i = 0; i < retries; i++) {
    try {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=zh-CN&dt=t&q=${encodeURIComponent(text)}`;
      const res = await axios.get(url, { timeout: 10000 });
      let translated = '';
      res.data[0].forEach(item => {
        if (item[0]) translated += item[0];
      });
      return translated;
    } catch (e) {
      if (i === retries - 1) return text; // fallback to English if it fails after retries
      await new Promise(r => setTimeout(r, 1000 * (i + 1))); // exponential backoff
    }
  }
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function run() {
  await loadCache();
  const data = JSON.parse(fs.readFileSync(INPUT, 'utf8'));
  
  let totalModels = 0;
  data.forEach(p => totalModels += p.models.length);
  console.log(`Starting translation for ${totalModels} models...`);
  
  let count = 0;
  let newlyTranslated = 0;

  for (const provider of data) {
    for (const model of provider.models) {
      if (translationCache.has(model.id)) {
        model.description = translationCache.get(model.id);
      } else if (model.description) {
        model.description = await translateText(model.description);
        newlyTranslated++;
        await sleep(300); // delay to avoid rate limits
      } else {
         model.description = '暂无描述。';
      }
      count++;
      if (count % 50 === 0) console.log(`Processed ${count}/${totalModels} models...`);
    }
  }
  
  fs.writeFileSync(OUTPUT, JSON.stringify(data, null, 2));
  console.log(`Translation complete! Used ${translationCache.size} cached items, translated ${newlyTranslated} new items. Saved to ${OUTPUT}`);
}

run();