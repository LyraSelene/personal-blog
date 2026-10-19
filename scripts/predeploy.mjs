import { loadEnv } from 'vite';
const { SITE_URL } = { ...loadEnv('production', process.cwd(), ''), ...process.env };
let url;
try { url = new URL(SITE_URL); } catch { throw new Error('Set SITE_URL to your real HTTPS domain before deployment.'); }
if (url.protocol !== 'https:' || /(^|\.)(example\.(com|org|net)|localhost)$/.test(url.hostname) || url.hostname.endsWith('.example') || url.pathname !== '/' || url.search || url.hash) {
  throw new Error('SITE_URL must be a real HTTPS origin without a path, query, or fragment.');
}
console.log(`Deployment domain verified: ${url.origin}`);
