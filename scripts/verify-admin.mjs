import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext();
const page = await context.newPage();
try {
  await page.goto('http://127.0.0.1:4545/');
  await page.getByRole('button', {name:'新建文章',exact:true}).click();
  await page.locator('#file').fill('verification-only.md');
  await page.locator('#field-title').fill('控制台验证内容');
  await page.locator('#field-description').fill('仅用于验证，结束后移至本机回收站。');
  await page.locator('#field-category').fill('测试');
  await page.locator('#body').fill('## 测试正文\n\n保存、预览与恢复验证。\n\n<script>alert(1)</script>');
  await page.getByRole('button',{name:'预览 Markdown',exact:true}).click();
  await page.locator('#markdown-preview').waitFor({state:'visible'});
  await page.getByRole('button',{name:'保存到本机',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('已保存到本机'));
  const raw = await fs.readFile('src/content/posts/verification-only.md','utf8');
  assert.match(raw,/draft: true/);
  const bootstrap = await context.request.get('http://127.0.0.1:4545/api/bootstrap');
  const {token} = await bootstrap.json();
  const headers = {'origin':'http://127.0.0.1:4545','x-admin-token':token};
  const bad = await context.request.post('http://127.0.0.1:4545/api/save',{data:{kind:'posts',file:'../../escape.md'},headers});
  assert.equal(bad.status(),400);
  const csrf = await context.request.post('http://127.0.0.1:4545/api/profile',{data:{}});
  assert.equal(csrf.status(),403);
  const item = await (await context.request.get('http://127.0.0.1:4545/api/item?kind=posts&file=verification-only.md')).json();
  const conflict = await context.request.post('http://127.0.0.1:4545/api/save',{data:{...item,revision:'stale'},headers});
  assert.equal(conflict.status(),409);
  const preview = await (await context.request.post('http://127.0.0.1:4545/api/preview',{data:{body:'<script>bad()</script><img src="x" onerror="bad()">'},headers})).json();
  assert.doesNotMatch(preview.html,/<script|onerror/);
  const upload = await context.request.post('http://127.0.0.1:4545/api/upload',{data:{name:'check.webp',base64:(await fs.readFile('public/images/sakiko.webp')).toString('base64')},headers});
  assert.equal(upload.status(),200);
  const uploaded = await upload.json();
  await fs.unlink('public'+uploaded.path);
  page.on('dialog',dialog=>dialog.accept());
  await page.getByRole('button',{name:'移至本机回收站'}).click();
  await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('已移至'));
  for (const [label,filename] of [['音乐','verification-music.md'],['说说','verification-moment.md']]) {
    await page.getByRole('button',{name:label,exact:true}).click();
    await page.getByRole('button',{name:'新建'+label,exact:true}).click();
    await page.locator('#file').fill(filename);
    if (label==='音乐') {
      await page.locator('#field-title').fill('音乐验证');
      await page.locator('#field-artist').fill('测试');
      await page.locator('#field-audio').fill('https://example.com/audio.mp3');
    } else await page.locator('#body').fill('控制台说说验证。');
    await page.getByRole('button',{name:'保存到本机',exact:true}).click();
    await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('已保存到本机'));
    await page.getByRole('button',{name:'移至本机回收站'}).click();
    await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('已移至'));
  }
  await page.getByRole('button',{name:'相册',exact:true}).click();
  await page.getByRole('button',{name:'新建相册',exact:true}).click();
  await page.locator('#file').fill('verification-album.md');
  await page.locator('#field-title').fill('相册验证');
  await page.locator('#field-photos').fill(JSON.stringify([{src:'/images/sakiko.webp',alt:'角色图'}]));
  await page.getByRole('button',{name:'保存到本机',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('已保存到本机'));
  await page.getByRole('button',{name:'移至本机回收站'}).click();
  await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('已移至'));
  await page.getByRole('button',{name:'站点设置',exact:true}).click();
  await page.getByRole('button',{name:'保存站点设置',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('站点设置已保存'));
  await page.getByRole('button',{name:'文章',exact:true}).click();
  await fs.mkdir('artifacts',{recursive:true});
  await page.screenshot({path:'artifacts/admin-desktop.png',fullPage:true});
  await page.setViewportSize({width:390,height:844});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.screenshot({path:'artifacts/admin-mobile.png',fullPage:true});
  console.log('本机控制台通过：创建/保存/回收、草稿、相册、设置、图片上传、Markdown 清理、CSRF、路径与覆盖冲突检查。');
} finally {
  for (const file of ['src/content/posts/verification-only.md','src/content/albums/verification-album.md','src/content/music/verification-music.md','src/content/moments/verification-moment.md']) {
    try { await fs.rename(file,'.local/'+file.split('/').pop()); } catch(error) { if(error.code!=='ENOENT') throw error; }
  }
  await browser.close();
}
