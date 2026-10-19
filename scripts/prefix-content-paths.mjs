import fs from 'node:fs/promises';
import { loadEnv } from 'vite';
const env = { ...loadEnv(process.env.NODE_ENV || 'production', process.cwd(), ''), ...process.env };
const base = (env.SITE_BASE_PATH || '/').replace(/\/$/, '');
const output = env.TEST_BUILD === '1' ? '.local/test-dist' : 'dist';
// Components resolve their own paths; this also covers links written directly in Markdown/MDX.
if (base) for (const file of await fs.readdir(output, { recursive: true })) {
  if (!file.endsWith('.html')) continue;
  const target = `${output}/${file}`;
  const html = await fs.readFile(target, 'utf8');
  const updated = html.replace(/\b(src|href|poster)=("|')(\/(?!\/)[^"']*)\2/g, (match, attribute, quote, value) => {
    if (value === base || value.startsWith(`${base}/`)) return match;
    return `${attribute}=${quote}${base}${value}${quote}`;
  });
  if (updated !== html) await fs.writeFile(target, updated);
}
