interface SearchData { url: string; excerpt: string; meta: { title?: string } }
interface SearchResult { data: () => Promise<SearchData> }
interface Pagefind { init: () => Promise<void>; options: (options: { baseUrl: string }) => Promise<void>; search: (query: string) => Promise<{ results: SearchResult[] }> }
const form = document.querySelector<HTMLFormElement>('#search-form')!;
const input = document.querySelector<HTMLInputElement>('#search-input')!;
const status = document.querySelector<HTMLElement>('#search-status')!;
const results = document.querySelector<HTMLElement>('#search-results')!;
let pagefindPromise: Promise<Pagefind> | undefined;
let generation = 0;
const loadPagefind = () => pagefindPromise ??= (async () => {
  const path = `${import.meta.env.BASE_URL}pagefind/pagefind.js`;
  const module = await import(/* @vite-ignore */ path) as Pagefind;
  await module.options({ baseUrl: import.meta.env.BASE_URL });
  await module.init(); return module;
})().catch(error => { pagefindPromise = undefined; throw error; });
function safeExcerpt(markup: string) {
  const parsed = new DOMParser().parseFromString(markup, 'text/html');
  const fragment = document.createDocumentFragment();
  const append = (node: Node, target: Node) => {
    if (node.nodeType === Node.TEXT_NODE) target.appendChild(document.createTextNode(node.textContent || ''));
    else if (node instanceof Element) {
      const next = node.tagName === 'MARK' ? document.createElement('mark') : target;
      if (next !== target) target.appendChild(next);
      node.childNodes.forEach(child => append(child, next));
    }
  };
  parsed.body.childNodes.forEach(node => append(node, fragment)); return fragment;
}
async function search(updateUrl: boolean) {
  const query = input.value.trim(); const current = ++generation;
  if (updateUrl) { const url = new URL(location.href); query ? url.searchParams.set('q', query) : url.searchParams.delete('q'); history.pushState({}, '', url); }
  results.replaceChildren();
  if (!query) { results.removeAttribute('aria-busy'); status.textContent = '输入关键词，搜索已发布文章的完整正文。'; return; }
  status.textContent = '正在搜索…'; results.setAttribute('aria-busy', 'true');
  try {
    const engine = await loadPagefind(); const found = await engine.search(query);
    if (current !== generation) return;
    const entries = await Promise.all(found.results.slice(0, 20).map(r => r.data()));
    if (current !== generation) return;
    status.textContent = found.results.length ? `找到 ${found.results.length} 篇文章${found.results.length > 20 ? '，显示前 20 篇' : ''}` : `没有找到与“${query}”相关的文章。试试更短的关键词，或按分类浏览。`;
    entries.forEach(data => {
      const article = document.createElement('article'); const heading = document.createElement('h2'); const link = document.createElement('a');
      const url = new URL(data.url, location.origin);
      if (url.origin !== location.origin) return;
      link.href = url.pathname + url.search + url.hash; link.textContent = data.meta.title || '未命名文章';
      heading.append(link); const excerpt = document.createElement('p'); excerpt.append(safeExcerpt(data.excerpt)); article.append(heading, excerpt); results.append(article);
    });
  } catch { if (current === generation) status.textContent = import.meta.env.DEV ? '开发模式尚未生成搜索索引。请运行 npm run build，再运行 npm run preview 验证全文搜索。' : '搜索索引暂时无法加载，请重试或前往文章列表。'; }
  finally { if (current === generation) results.removeAttribute('aria-busy'); }
}
form.addEventListener('submit', event => { event.preventDefault(); void search(true); });
window.addEventListener('popstate', () => { input.value = new URLSearchParams(location.search).get('q') || ''; void search(false); });
input.value = new URLSearchParams(location.search).get('q') || '';
if (input.value.trim()) void search(false);
