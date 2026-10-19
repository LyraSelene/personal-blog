import { preview } from 'astro';
import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
process.env.ASTRO_TELEMETRY_DISABLED = '1';
const server = await preview({ server: { host: '127.0.0.1', port: 4324 } });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const page = await browser.newPage();
  const base = `http://127.0.0.1:4324${process.env.SITE_BASE_PATH || '/'}`;
  for (const route of ['', 'articles/', 'projects/', 'albums/', 'music/', 'moments/', 'about/', 'search/']) {
    const response = await page.goto(base + route);
    assert.equal(response.status(), 200);
    assert.equal(await page.locator('h1').isVisible(), true);
    for (const src of await page.locator('img').evaluateAll(imgs => imgs.map(img => img.src))) {
      assert.equal((await page.request.get(src)).status(), 200, src);
    }
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  }
  await page.goto(base + 'search/?q=hello');
  await page.getByRole('status').filter({ hasText: '没有找到' }).waitFor();
  assert.equal(await page.locator('#search-results a').count(), 0);
  for (const route of ['admin/', 'articles/astro-static-notes/', 'albums/stage-notes/', 'rss.xml']) {
    assert.equal((await page.request.get(base + route)).status(), 404);
  }
  assert.equal((await fs.readdir('dist')).includes('admin'), false);
  await page.goto(base);
  await fs.mkdir('artifacts', { recursive: true });
  await page.screenshot({ path: 'artifacts/production-home.png', fullPage: true });
  console.log('正式空站通过：全部栏目、媒体、空搜索、示例与控制台隔离、子路径。');
} finally { await browser.close(); await server.stop(); }
