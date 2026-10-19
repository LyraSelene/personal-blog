const menuButton = document.querySelector<HTMLButtonElement>('.menu-toggle');
const navigation = document.querySelector<HTMLElement>('#main-navigation');
if (menuButton && navigation) {
  menuButton.hidden = false;
  document.documentElement.classList.add('has-menu-js');
  const close = () => { menuButton.setAttribute('aria-expanded', 'false'); navigation.classList.remove('is-open'); };
  menuButton.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') !== 'true';
    menuButton.setAttribute('aria-expanded', String(open)); navigation.classList.toggle('is-open', open);
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && navigation.classList.contains('is-open')) { close(); menuButton.focus(); } });
  document.addEventListener('click', e => { if (e.target instanceof Node && !navigation.contains(e.target) && !menuButton.contains(e.target)) close(); });
  navigation.querySelectorAll('a').forEach(a => a.addEventListener('click', close));
  matchMedia('(min-width: 768px)').addEventListener('change', close);
}
const themeButton = document.querySelector<HTMLButtonElement>('.theme-toggle');
if (themeButton) {
  const root = document.documentElement;
  const media = matchMedia('(prefers-color-scheme: dark)');
  const labels: Record<string, string> = { system: '系统', light: '浅色', dark: '深色' };
  const apply = (preference: string) => {
    root.dataset.preference = preference;
    root.dataset.theme = preference === 'dark' || (preference === 'system' && media.matches) ? 'dark' : 'light';
    themeButton.textContent = labels[preference];
    themeButton.setAttribute('aria-label', `切换主题，当前${labels[preference]}，点击切换为${labels[preference === 'system' ? 'light' : preference === 'light' ? 'dark' : 'system']}`);
  };
  themeButton.hidden = false;
  apply(root.dataset.preference && root.dataset.preference in labels ? root.dataset.preference : 'system');
  themeButton.addEventListener('click', () => {
    const next = root.dataset.preference === 'system' ? 'light' : root.dataset.preference === 'light' ? 'dark' : 'system';
    try { localStorage.setItem('lyra-theme', next); } catch {}
    apply(next);
  });
  media.addEventListener('change', () => { if (root.dataset.preference === 'system') apply('system'); });
  new MutationObserver(() => {
    const preference = root.dataset.preference || 'system';
    const label = labels[preference] || labels.system;
    if (themeButton.textContent !== label) {
      themeButton.textContent = label;
      themeButton.setAttribute('aria-label', `切换主题，当前${label}，点击切换为${labels[preference === 'system' ? 'light' : preference === 'light' ? 'dark' : 'system']}`);
    }
  }).observe(root, { attributes: true, attributeFilter: ['data-preference'] });
}
const updateVisibility = () => document.documentElement.toggleAttribute('data-page-hidden', document.hidden);
document.addEventListener('visibilitychange', updateVisibility);
updateVisibility();
