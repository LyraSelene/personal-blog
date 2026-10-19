import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs/promises';
const base = (process.env.SITE_BASE_PATH || '/').replace(/\/$/, '');
const route = (path: string) => `${base}${path}`;
test.beforeEach(async ({ page }) => {
  const navigate = page.goto.bind(page);
  page.goto = (url, options) => navigate(url.startsWith('/') ? route(url) : url, options);
});

test('static output excludes drafts and emits metadata', async ({ page }) => {
  for (const route of ['/', '/articles/', '/articles/2/', '/articles/category/学习笔记/', '/articles/tag/Astro/', '/projects/', '/projects/static-notebook/', '/albums/', '/albums/stage-notes/', '/music/', '/moments/', '/about/', '/search/']) {
    const response = await page.goto(route); expect(response?.status()).toBe(200);
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', new URL(`${base}${route}`, process.env.SITE_URL || 'https://example.com').href);
  }
  await page.goto('/articles/draft-example/'); await expect(page.getByRole('heading', { name: '这一页，还没有写下。' })).toBeVisible();
  const output = process.env.TEST_BUILD === '1' ? '.local/test-dist' : 'dist';
  for (const file of await fs.readdir(output, { recursive: true })) {
    if (String(file).endsWith('.html') || String(file).endsWith('.xml')) {
      const data = await fs.readFile(`${output}/${file}`, 'utf8'); expect(data).not.toMatch(/LYRA_PRIVATE_|未公开项目草稿|草稿示例：不应公开|不公开相册|私藏曲目|不公开的草稿/);
    }
  }
});

test('production search indexes body, handles no results and query history', async ({ page }) => {
  await page.goto('/search/?q=词法环境');
  await expect(page.locator('#search-results')).toContainText('重新理解闭包');
  await page.getByLabel('搜索文章', { exact: true }).fill('LYRA_PRIVATE_DRAFT_SENTINEL');
  await page.getByRole('button', { name: '搜索 ↗' }).click();
  await expect(page.getByRole('status')).not.toContainText('正在搜索');
  await expect(page.locator('#search-results a[href*="draft-example"]')).toHaveCount(0);
  await page.goBack(); await expect(page.locator('#search-results')).toContainText('重新理解闭包');
  await page.getByLabel('搜索文章', { exact: true }).fill('zzznomatchzzzz');
  await page.getByRole('button', { name: '搜索 ↗' }).click();
  await expect(page.getByRole('status')).toContainText('没有找到');
});

test('article contents, copy, filters and pagination work', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/articles/astro-static-notes/');
  await expect(page.getByRole('navigation', { name: '本文目录' })).toBeVisible();
  await page.getByRole('button', { name: '复制代码' }).first().click();
  await expect(page.getByRole('button', { name: '复制代码' }).first()).toHaveText('已复制');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain('getCollection');
  await page.goto('/articles/');
  await page.getByRole('link', { name: '下一页 →' }).click();
  await expect(page).toHaveURL(/\/articles\/2\//);
  await expect(page.locator('.post-item')).toHaveCount(1);
  await page.goto('/articles/tag/TypeScript/');
  await expect(page.locator('.post-item')).toHaveCount(1);
  await expect(page.locator('a[aria-current="page"]').filter({ hasText: '#TypeScript' })).toBeVisible();
  await page.goto('/articles/markdown-writing/');
  await expect(page.getByAltText('测试 Markdown 媒体路径')).toHaveAttribute('src', `${base}/images/og-default.png`);
});

test('mobile menu keyboard, theme persistence and system preference', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
  await page.goto('/'); await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  const menu = page.getByRole('button', { name: '菜单' });
  await menu.focus(); await page.keyboard.press('Enter');
  await expect(menu).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Escape'); await expect(menu).toBeFocused();
  await expect(menu).toHaveAttribute('aria-expanded', 'false');
  await menu.click(); await page.getByRole('button', { name: /切换主题/ }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.reload(); await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.goto('/articles/astro-static-notes/');
  await expect(page.locator('.toc details')).not.toHaveAttribute('open', '');
  await page.locator('.toc summary').click(); await expect(page.getByRole('navigation', { name: '本文目录' })).toBeVisible();
});

test('dashboard search, themes, particles and archive layout switch work', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.dashboard-feature-image')).toBeVisible();
  await expect(page.locator('.post-item')).toHaveCount(0);
  await page.getByRole('searchbox', { name:'搜索文章正文' }).fill('词法环境');
  await page.getByRole('button', { name:'提交搜索' }).click();
  await expect(page.locator('#search-results')).toContainText('重新理解闭包');
  await page.goto('/');
  await expect(page.locator('.dashboard-counts a').first()).toContainText('5');
  await expect(page.locator('.dashboard-clock')).toHaveText(/\d{2}:\d{2}:\d{2}/);
  await expect(page.locator('[data-home-audio]')).not.toHaveAttribute('autoplay');
  await page.emulateMedia({ reducedMotion:'no-preference' });
  const effects=page.getByRole('button',{name:'舞台浮尘 · 开',exact:true});
  await effects.click();
  await expect(page.locator('html')).toHaveAttribute('data-effects','off');
  await expect(page.locator('.stage-particles')).not.toBeVisible();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-effects','off');
  await page.getByRole('button',{name:'舞台浮尘 · 关',exact:true}).click();
  await expect(page.locator('.stage-particles')).toBeVisible();
  await page.emulateMedia({reducedMotion:'reduce'});
  await expect(page.locator('.stage-particles')).not.toBeVisible();
  await page.locator('[data-dashboard-theme]').click();
  await expect(page.locator('[data-theme-caption]')).toHaveText(/浅色模式|深色模式/);
  await page.getByRole('link',{name:'文章归档 沿时间，重新翻阅'}).click();
  await expect(page.locator('.archive-timeline li')).toHaveCount(5);
  await page.goto('/articles/');
  await page.getByRole('button', { name: '列表', exact: true }).click();
  await expect(page.locator('.archive-cards')).toHaveAttribute('data-view', 'list');
  await page.reload();
  await expect(page.getByRole('button', { name: '列表', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: '网格', exact: true }).click();
  await expect(page.locator('.archive-cards')).toHaveAttribute('data-view', 'grid');
});

test('albums, music and moments expose usable content controls', async ({ page }) => {
  await page.goto('/albums/');
  await page.getByRole('link', { name: '舞台光影记录', exact: true }).click();
  await page.getByRole('button', { name: '放大查看：舞台角色图' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(page.getByRole('button', { name: '放大查看：舞台角色图' })).toBeFocused();
  await page.goto('/music/');
  await expect(page.locator('audio').first()).toHaveAttribute('controls', '');
  await expect(page.locator('audio').first()).not.toHaveAttribute('autoplay');
  await page.getByText('歌词', { exact: true }).click();
  await expect(page.locator('.lyrics pre')).toContainText('这是测试歌词');
  await page.goto('/moments/');
  await expect(page.locator('.moment-item')).toHaveCount(1);
  await expect(page.locator('.moment-item')).toContainText('今天完成了一个小实验');
});

test('homepage music plays, pauses, seeks and switches tracks', async ({page})=>{
  const bytes=Buffer.alloc(44+16000*10);bytes.write('RIFF');bytes.writeUInt32LE(bytes.length-8,4);bytes.write('WAVEfmt ',8);bytes.writeUInt32LE(16,16);bytes.writeUInt16LE(1,20);bytes.writeUInt16LE(1,22);bytes.writeUInt32LE(8000,24);bytes.writeUInt32LE(16000,28);bytes.writeUInt16LE(2,32);bytes.writeUInt16LE(16,34);bytes.write('data',36);bytes.writeUInt32LE(bytes.length-44,40);
  await page.route('https://example.com/*.mp3',route=>{
    const range=route.request().headers().range;
    if(range){const start=Number(/bytes=(\d+)/.exec(range)?.[1]||0);return route.fulfill({status:206,contentType:'audio/wav',headers:{'accept-ranges':'bytes','content-range':`bytes ${start}-${bytes.length-1}/${bytes.length}`},body:bytes.subarray(start)});}
    return route.fulfill({contentType:'audio/wav',headers:{'accept-ranges':'bytes'},body:bytes});
  });
  await page.goto('/');
  const audio=page.locator('[data-home-audio]');
  await expect(audio).not.toHaveAttribute('autoplay');
  await page.getByRole('button',{name:'播放音乐',exact:true}).click();
  await expect(page.getByRole('button',{name:'暂停音乐',exact:true})).toBeVisible();
  await expect(page.locator('#home-music-seek')).toBeEnabled();
  await page.locator('#home-music-seek').fill('50');
  await page.waitForFunction(() => (document.querySelector('[data-home-audio]') as HTMLAudioElement)?.currentTime > 4);
  expect(await audio.evaluate((element:HTMLAudioElement)=>element.currentTime)).toBeGreaterThan(4);
  const previous=await page.locator('[data-track-title]').textContent();
  await page.getByRole('button',{name:'下一首',exact:true}).click();
  await expect(page.locator('[data-track-title]')).not.toHaveText(previous!);
  await page.getByRole('button',{name:'暂停音乐',exact:true}).click();
  expect(await audio.evaluate((element:HTMLAudioElement)=>element.paused)).toBe(true);
});

test('desktop and mobile layout, both themes, accessibility and screenshots', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await fs.mkdir('artifacts', { recursive: true });
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: width > 767 ? 1000 : 844 });
    for (const theme of ['dark', 'light']) {
      await page.addInitScript(value => localStorage.setItem('lyra-theme', value), theme);
      for (const route of ['/', '/articles/', '/articles/astro-static-notes/', '/projects/', '/albums/', '/albums/stage-notes/', '/music/', '/moments/', '/archive/', '/links/', '/about/', '/search/', '/404/']) {
        await page.goto(route); await page.evaluate(() => document.fonts.ready);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${route} ${width} ${theme}`).toBe(true);
        const scan = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
        expect(scan.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) })), `${route} ${width} ${theme}`).toEqual([]);
        if (width !== 320 && ['/', '/articles/', '/articles/astro-static-notes/'].includes(route)) {
          await page.locator('img').evaluateAll(images => images.forEach(img => img.setAttribute('loading', 'eager')));
          await page.evaluate(() => Promise.all([...document.images].map(img => img.decode().catch(() => {}))));
          await page.screenshot({ path: `artifacts/${route === '/' ? 'home' : route === '/articles/' ? 'archive' : 'article'}-${width}-${theme}.png`, fullPage: true });
        }
      }
    }
  }
});
