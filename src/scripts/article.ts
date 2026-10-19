document.querySelectorAll<HTMLPreElement>('.prose pre').forEach(pre => {
  const wrapper = document.createElement('div'); wrapper.className = 'code-wrapper';
  pre.before(wrapper); wrapper.append(pre);
  pre.tabIndex = 0; pre.setAttribute('aria-label', '代码块，可横向滚动');
  const button = document.createElement('button'); button.type = 'button'; button.className = 'copy-code';
  button.textContent = '复制'; button.setAttribute('aria-label', '复制代码'); button.dataset.pagefindIgnore = '';
  const status = document.createElement('span'); status.className = 'sr-only'; status.setAttribute('aria-live', 'polite');
  wrapper.append(button, status);
  button.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(pre.querySelector('code')?.textContent || pre.textContent || '');
      button.textContent = '已复制'; status.textContent = '代码已复制';
    } catch { button.textContent = '复制失败'; status.textContent = '无法访问剪贴板，请手动选择代码复制'; }
    setTimeout(() => { button.textContent = '复制'; }, 2200);
  });
});
document.querySelectorAll<HTMLTableElement>('.prose table').forEach(table => {
  const wrapper = document.createElement('div'); wrapper.className = 'table-scroll'; wrapper.tabIndex = 0;
  wrapper.setAttribute('role', 'region'); wrapper.setAttribute('aria-label', '表格，可横向滚动');
  table.before(wrapper); wrapper.append(table);
});
const toc = document.querySelector<HTMLDetailsElement>('.toc details');
if (toc) {
  const media = matchMedia('(min-width: 1024px)');
  toc.open = media.matches;
  media.addEventListener('change', () => { toc.open = media.matches; });
}
