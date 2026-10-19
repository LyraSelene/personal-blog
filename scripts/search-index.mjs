import fs from 'node:fs/promises';
import * as pagefind from 'pagefind';
try {
  const created = await pagefind.createIndex();
  if (created.errors.length || !created.index) throw new Error(created.errors.join('\n'));
  const output = process.env.TEST_BUILD === '1' ? '.local/test-dist' : 'dist';
  let count = 0;
  for (const file of await fs.readdir(`${output}/articles`, { recursive: true })) {
    if (!file.endsWith('.html')) continue;
    const content = await fs.readFile(`${output}/articles/${file}`, 'utf8');
    if (!content.includes('data-pagefind-body')) continue;
    const result = await created.index.addHTMLFile({ url: `/articles/${file.replaceAll('\\', '/').replace(/index\.html$/, '')}`, content });
    if (result.errors.length) throw new Error(result.errors.join('\n'));
    count++;
  }
  if (count) {
    const written = await created.index.writeFiles({ outputPath: `${output}/pagefind` });
    if (written.errors.length) throw new Error(written.errors.join('\n'));
  } else {
    await fs.mkdir(`${output}/pagefind`, { recursive: true });
    await fs.writeFile(`${output}/pagefind/pagefind.js`, 'export async function init() {}\nexport async function options() {}\nexport async function search() { return { results: [] }; }\n');
  }
  console.log(`Pagefind: ${count} 篇已发布文章。`);
} finally { await pagefind.close(); }
