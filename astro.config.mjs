import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { loadEnv } from 'vite';

const { SITE_URL, SITE_BASE_PATH = '/' } = { ...loadEnv(process.env.NODE_ENV || 'production', process.cwd(), ''), ...process.env };

export default defineConfig({
  // Set SITE_URL to your real domain before publishing.
  site: SITE_URL || 'https://example.com',
  base: SITE_BASE_PATH,
  outDir: process.env.TEST_BUILD === '1' ? './.local/test-dist' : './dist',
  cacheDir: process.env.TEST_BUILD === '1' ? './.local/test-cache' : './node_modules/.astro',
  trailingSlash: 'always',
  integrations: [mdx(), sitemap({ filter: page => !page.endsWith('/404/') && !page.endsWith('/search/') })],
  markdown: { shikiConfig: { themes: { light: 'github-light-high-contrast', dark: 'github-dark' }, defaultColor: false } },
  vite: { plugins: [tailwindcss()] },
});
