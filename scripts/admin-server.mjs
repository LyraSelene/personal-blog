import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { randomBytes, createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { parse, stringify } from 'yaml';
import { marked } from 'marked';
import sanitize from 'sanitize-html';
import { schemas } from '../src/lib/schemas.ts';

const root = fileURLToPath(new URL('../', import.meta.url));
const exec = promisify(execFile);
const port = Number(process.env.ADMIN_PORT || 4545);
const origin = `http://127.0.0.1:${port}`;
const token = randomBytes(32).toString('hex');
const kinds = Object.keys(schemas);
let job = { running: false, log: '', success: null };
let writing = false;
const revision = value => createHash('sha256').update(value).digest('hex');
const fail = (message, status = 400) => { throw Object.assign(new Error(message), { status }); };
function itemPath(kind, file) {
  if (!kinds.includes(kind) || !/^[a-z0-9][a-z0-9-]*\.(md|mdx)$/.test(file) || /^(tag|category|\d+)\./.test(file)) fail('文件名请使用小写英文、数字和连字符，且不能与分类、分页路由冲突。');
  return path.join(root, 'src', 'content', kind, file);
}
async function readItem(kind, file) {
  const raw = await fs.readFile(itemPath(kind, file), 'utf8');
  const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)([\s\S]*)$/.exec(raw);
  if (!match) fail('文件缺少 YAML 元数据。');
  return { kind, file, data: parse(match[1]), body: match[2], revision: revision(raw) };
}
async function backup(target) {
  const bytes = await fs.readFile(target).catch(error => { if (error.code !== 'ENOENT') throw error; return null; });
  if (bytes === null) return;
  const dir = path.join(root, '.local', 'backups'); await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, `${Date.now()}-${randomBytes(3).toString('hex')}-${path.basename(target)}`), bytes);
}
async function replace(target, value) {
  await backup(target); await fs.mkdir(path.dirname(target), { recursive: true });
  const temp = `${target}.${randomBytes(4).toString('hex')}.tmp`;
  await fs.writeFile(temp, value); await fs.rename(temp, target);
}
async function payload(req, limit = 12 * 1024 * 1024) {
  let size = 0; const chunks = [];
  for await (const chunk of req) { size += chunk.length; if (size > limit) fail('文件过大，单次最多 12MB。', 413); chunks.push(chunk); }
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
}
const publicProfile = data => {
  for (const key of ['name', 'author', 'description', 'about']) if (typeof data[key] !== 'string' || !data[key].trim() || data[key].length > 10000) fail(`请正确填写 ${key}`);
  if (!Array.isArray(data.socials) || data.socials.length > 12 || data.socials.some(v => !v.label || !/^https:\/\//.test(v.href))) fail('社交链接请使用 HTTPS 地址。');
  return Object.fromEntries(['name', 'author', 'description', 'about', 'socials'].map(key => [key, data[key]]));
};
async function runCommand(binary, args, env = {}) {
  const result = await exec(binary, args, { cwd: root, env: { ...process.env, ...env }, timeout: 240000, maxBuffer: 4 * 1024 * 1024, windowsHide: true });
  job.log += result.stdout + result.stderr; return result.stdout;
}
async function runJob(publish) {
  job = { running: true, log: publish ? '正在构建，成功后提交并推送到 GitHub…\n' : '正在构建静态网站…\n', success: null };
  try {
    const env = { ASTRO_TELEMETRY_DISABLED: '1', SITE_URL: 'https://lyraselene.github.io', SITE_BASE_PATH: '/personal-blog/' };
    const npm = process.env.npm_execpath;
    if (!npm) fail('请使用 npm run admin 启动控制台。');
    await runCommand(process.execPath, [npm, 'run', 'build'], env);
    if (publish) {
      const remote = (await runCommand('git', ['remote', 'get-url', 'origin'])).trim();
      if (remote !== 'https://github.com/LyraSelene/personal-blog.git') fail('远程仓库与目标不一致，请先检查 origin。');
      const branch = (await runCommand('git', ['branch', '--show-current'])).trim();
      if (branch !== 'main') fail('请切换到 main 分支后发布。');
      await runCommand('git', ['add', '--', 'src', 'public']);
      const changed = (await runCommand('git', ['diff', '--cached', '--name-only'])).trim();
      if (changed) await runCommand('git', ['commit', '--only', '-m', 'Update blog content', '--', 'src', 'public']);
      await runCommand('git', ['push', 'origin', 'main']);
      job.log += '\n已推送。GitHub Actions 将自动部署，请到发布记录查看结果。';
    }
    job.success = true;
  } catch (error) { job.success = false; job.log += '\n操作失败：' + error.message + '\n' + (error.stdout || '') + (error.stderr || ''); }
  finally { job.running = false; }
}
const json = (res, status, value) => { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(value)); };
async function handle(req, res) {
  res.setHeader('Cache-Control', 'no-store'); res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer'); res.setHeader('X-Frame-Options', 'DENY');
  if (req.headers.host !== `127.0.0.1:${port}`) return json(res, 403, { error: '仅允许本机地址访问。' });
  const url = new URL(req.url, origin);
  if (url.pathname === '/' && req.method === 'GET') {
    res.setHeader('Set-Cookie', `lyra-admin=${token}; HttpOnly; SameSite=Strict; Path=/`);
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; frame-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'");
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); return res.end(await fs.readFile(path.join(root, 'admin', 'index.html')));
  }
  if (['/app.js', '/styles.css'].includes(url.pathname)) {
    res.writeHead(200, { 'Content-Type': url.pathname.endsWith('.js') ? 'text/javascript' : 'text/css' }); return res.end(await fs.readFile(path.join(root, 'admin', url.pathname.slice(1))));
  }
  if (url.pathname.startsWith('/media/')) {
    const name = url.pathname.slice(7);
    if (!/^[a-z0-9-]+\.(webp|png|jpg|jpeg|gif|mp3|ogg|wav|m4a)$/.test(name)) fail('无效媒体路径。');
    const bytes = await fs.readFile(path.join(root, 'public', 'images', 'uploads', name));
    const types = { webp: 'image/webp', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', mp3: 'audio/mpeg', ogg: 'audio/ogg', wav: 'audio/wav', m4a: 'audio/mp4' };
    res.writeHead(200, { 'Content-Type': types[name.split('.').pop()] }); return res.end(bytes);
  }
  if (!url.pathname.startsWith('/api/')) fail('页面不存在。', 404);
  if (!req.headers.cookie?.split(';').some(c => c.trim() === `lyra-admin=${token}`)) fail('请先打开本机控制台首页。', 403);
  if (req.method !== 'GET' && (req.headers.origin !== origin || req.headers['x-admin-token'] !== token || !req.headers['content-type']?.startsWith('application/json'))) fail('请求验证失败，请刷新控制台。', 403);
  if (req.method === 'GET' && url.pathname === '/api/bootstrap') {
    const lists = {};
    for (const kind of kinds) {
      const dir = path.join(root, 'src', 'content', kind); await fs.mkdir(dir, { recursive: true });
      lists[kind] = await Promise.all((await fs.readdir(dir)).filter(f => /\.(md|mdx)$/.test(f)).map(async file => {
        try { const item = await readItem(kind, file); return { file, data: item.data }; }
        catch (error) { return { file, error: error.message, data: { title: file, draft: true } }; }
      }));
    }
    return json(res, 200, { token, lists, profile: JSON.parse(await fs.readFile(path.join(root, 'src/config/profile.json'), 'utf8')), job });
  }
  if (req.method === 'GET' && url.pathname === '/api/item') return json(res, 200, await readItem(url.searchParams.get('kind'), url.searchParams.get('file')));
  if (req.method === 'GET' && url.pathname === '/api/job') return json(res, 200, job);
  if (req.method !== 'POST') fail('不支持此操作。', 405);
  const data = await payload(req);
  if (url.pathname === '/api/preview') return json(res, 200, { html: sanitize(await marked.parse(String(data.body || '')), { allowedTags: sanitize.defaults.allowedTags.concat(['img']), allowedAttributes: { ...sanitize.defaults.allowedAttributes, img: ['src', 'alt', 'width', 'height'] } }) });
  if (writing || job.running) fail('正在保存或构建，请稍后再试。', 409);
  writing = true;
  try {
    if (url.pathname === '/api/save') {
      const target = itemPath(data.kind, data.file);
      const sibling = target.replace(/\.(md|mdx)$/, data.file.endsWith('.md') ? '.mdx' : '.md');
      if (await fs.stat(sibling).then(() => true, () => false)) fail('已存在相同路径的 Markdown/MDX 文件，请使用另一个文件名。', 409);
      const previous = await fs.readFile(target, 'utf8').catch(e => { if (e.code !== 'ENOENT') throw e; return null; });
      if (previous !== null && revision(previous) !== data.revision) fail('文件已经更改，请重新打开后编辑，避免覆盖。', 409);
      if (previous === null && data.revision) fail('原文件已被移动，请重新打开。', 409);
      const result = schemas[data.kind].safeParse(data.data);
      if (!result.success) fail(result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('\n'));
      const raw = `---\n${stringify(result.data)}---\n\n${String(data.body || '').trim()}\n`;
      await replace(target, raw); return json(res, 200, { revision: revision(raw) });
    }
    if (url.pathname === '/api/trash') {
      const target = itemPath(data.kind, data.file); const raw = await fs.readFile(target, 'utf8');
      if (revision(raw) !== data.revision) fail('文件已更改，请重新打开后移除。', 409);
      const dir = path.join(root, '.local', 'trash', data.kind); await fs.mkdir(dir, { recursive: true });
      await fs.rename(target, path.join(dir, `${Date.now()}-${data.file}`)); return json(res, 200, { ok: true });
    }
    if (url.pathname === '/api/profile') {
      await replace(path.join(root, 'src/config/profile.json'), JSON.stringify(publicProfile(data), null, 2) + '\n'); return json(res, 200, { ok: true });
    }
    if (url.pathname === '/api/upload') {
      const bytes = Buffer.from(String(data.base64 || ''), 'base64');
      const ext = String(data.name || '').split('.').pop().toLowerCase();
      const valid = (['jpg','jpeg'].includes(ext) && bytes[0] === 255 && bytes[1] === 216) || (ext === 'png' && bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) || (ext === 'webp' && bytes.toString('ascii',0,4) === 'RIFF' && bytes.toString('ascii',8,12) === 'WEBP') || (ext === 'gif' && bytes.toString('ascii',0,3) === 'GIF') || (ext === 'mp3' && (bytes.toString('ascii',0,3) === 'ID3' || (bytes[0] === 255 && (bytes[1] & 224) === 224))) || (ext === 'ogg' && bytes.toString('ascii',0,4) === 'OggS') || (ext === 'wav' && bytes.toString('ascii',0,4) === 'RIFF' && bytes.toString('ascii',8,12) === 'WAVE') || (ext === 'm4a' && bytes.toString('ascii',4,8) === 'ftyp');
      if (!valid || bytes.length > 8 * 1024 * 1024) fail('支持 PNG/JPG/WebP/GIF 和 MP3/OGG/WAV/M4A，单文件最多 8MB。');
      const name = `${Date.now()}-${randomBytes(6).toString('hex')}.${ext}`;
      const dir = path.join(root, 'public/images/uploads'); await fs.mkdir(dir, { recursive: true }); await fs.writeFile(path.join(dir, name), bytes);
      return json(res, 200, { path: `/images/uploads/${name}` });
    }
    if (url.pathname === '/api/build' || url.pathname === '/api/publish') {
      void runJob(url.pathname.endsWith('publish')); return json(res, 202, { ok: true });
    }
    fail('操作不存在。', 404);
  } finally { writing = false; }
}
const server = http.createServer((req, res) => handle(req, res).catch(error => {
  if (res.headersSent) return res.end();
  json(res, error.code === 'ENOENT' ? 404 : error.status || 500, { error: error.status ? error.message : error.code === 'ENOENT' ? '文件不存在。' : '操作失败，请检查本机终端。' });
}));
server.requestTimeout = 30000;
server.listen(port, '127.0.0.1', () => console.log(`Lyra 本机内容控制台：${origin}\n只监听本机，不会部署到 GitHub Pages。关闭此终端即可停止。`));
