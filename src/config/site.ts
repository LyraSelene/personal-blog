import profile from './profile.json';
export const site = {
  ...profile,
  // Canonical and sitemap all use this domain. Set SITE_URL before deployment.
  url: import.meta.env.SITE_URL || 'https://example.com',
  navigation: [
    { label: '首页', href: '/' },
    { label: '文章', href: '/articles/' },
    { label: '项目', href: '/projects/' },
    { label: '相册', href: '/albums/' },
    { label: '音乐', href: '/music/' },
    { label: '说说', href: '/moments/' },
    { label: '关于', href: '/about/' },
    { label: '搜索', href: '/search/' },
  ],
  // Add only your real public profiles, e.g. { label: 'GitHub', href: 'https://github.com/your-name' }.
  socials: profile.socials as { label: string; href: string }[],
  friends: profile.friends as { name: string; href: string; description: string }[],
};
