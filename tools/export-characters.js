// tools/export-characters.js
// Usage: npm i puppeteer && node tools/export-characters.js
// Renders every character preset x emotion to assets/dialogue/Characters/<Name>/<Name>_<Emotion>.svg
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const EMOTIONS = {
  Happy: 'smile',
  Sad: 'frown',
  Neutral: 'neutral',
  Angry: 'open'
};

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('file://' + path.resolve(__dirname, 'character_designer/index.html'));

  // Load presets list
  const presets = await page.evaluate(() => (window.CHARACTER_PRESETS || []).map(p => p.name));
  for (const name of presets) {
    await page.select('#characterPresetSelect', name);
    await page.click('#load-preset');
    for (const [emotion, mouth] of Object.entries(EMOTIONS)) {
      await page.select('#mouth-style', mouth);
      const svg = await page.$eval('#svg-container svg', el => el.outerHTML);
      const dir = path.resolve(__dirname, '..', 'assets', 'dialogue', 'Characters', name);
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, `${name}_${emotion}.svg`), svg);
    }
  }
  await browser.close();
  console.log('Done');
})();
