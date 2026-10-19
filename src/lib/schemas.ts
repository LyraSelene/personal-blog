import { z } from 'astro/zod';
const localImage = z.string().regex(/^\/(?!\/)/, '图片使用以 / 开头的 public/ 路径');
const media = z.string().refine(value => /^\/(?!\/)/.test(value) || /^https:\/\//.test(value), '媒体使用本地路径或 HTTPS 地址');
const common = { draft: z.boolean().default(true) };
export const postSchema = z.object({
  title: z.string().min(1), description: z.string().min(1), pubDate: z.coerce.date(),
  updatedDate: z.coerce.date().optional(), category: z.string().min(1), tags: z.array(z.string()).default([]),
  cover: localImage.optional(), example: z.boolean().default(false), ...common,
});
export const projectSchema = z.object({
  name: z.string().min(1), description: z.string().min(1), stack: z.array(z.string()).default([]),
  cover: localImage.optional(), source: z.httpUrl().optional(), demo: z.httpUrl().optional(),
  featured: z.boolean().default(false), example: z.boolean().default(false), ...common,
});
export const albumSchema = z.object({
  title: z.string().min(1), description: z.string().default(''), date: z.coerce.date(), cover: localImage.optional(),
  photos: z.array(z.object({ src: localImage, alt: z.string().min(1), caption: z.string().optional() })).default([]), ...common,
});
export const musicSchema = z.object({
  title: z.string().min(1), artist: z.string().min(1), audio: media, cover: localImage.optional(),
  lyrics: z.string().default(''), ...common,
});
export const momentSchema = z.object({
  date: z.coerce.date(), photos: z.array(localImage).default([]), ...common,
});
export const schemas = { posts: postSchema, projects: projectSchema, albums: albumSchema, music: musicSchema, moments: momentSchema };
