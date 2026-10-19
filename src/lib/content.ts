import { getCollection, type CollectionEntry } from 'astro:content';
import { withBase } from './paths';
export const publishedPosts = async () => (await getCollection('posts', ({ data }) => !data.draft))
  .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf() || a.id.localeCompare(b.id));
export const publishedProjects = () => getCollection('projects', ({ data }) => !data.draft);
export const dateLabel = (date: Date) => date.toISOString().slice(0, 10).replaceAll('-', '.');
export const postHref = (post: CollectionEntry<'posts'>) => withBase(`/articles/${post.id}/`);
export const projectHref = (project: CollectionEntry<'projects'>) => withBase(`/projects/${project.id}/`);
export const taxonomyHref = (kind: 'tag' | 'category', value: string) => withBase(`/articles/${kind}/${encodeURIComponent(value)}/`);
export const pageSize = 4;
export async function archivePaths() {
  const posts = await publishedPosts();
  const groups = [
    { base: '', label: '全部文章', kind: 'all', value: '', posts },
    ...(['category', 'tag'] as const).flatMap(kind => {
      const values = [...new Set(posts.flatMap(p => kind === 'tag' ? p.data.tags : [p.data.category]))];
      return values.map(value => ({ base: `${kind}/${value}`, label: value, kind, value,
        posts: posts.filter(p => kind === 'tag' ? p.data.tags.includes(value) : p.data.category === value) }));
    }),
  ];
  return groups.flatMap(group => {
    const total = Math.max(1, Math.ceil(group.posts.length / pageSize));
    return Array.from({ length: total }, (_, i) => ({
      params: { segments: [group.base, i ? String(i + 1) : ''].filter(Boolean).join('/') || undefined },
      props: { posts: group.posts.slice(i * pageSize, (i + 1) * pageSize),
        label: group.label, kind: group.kind, value: group.value, page: i + 1, total,
        count: group.posts.length, base: withBase(`/articles/${group.base ? group.base + '/' : ''}`) },
    }));
  });
}
