import { site } from '../config/site';
import { withBase } from '../lib/paths';
export function GET() { return new Response(`User-agent: *\nAllow: /\nSitemap: ${new URL(withBase('/sitemap-index.xml'), site.url)}\n`, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } }); }
