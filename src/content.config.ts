import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { schemas } from './lib/schemas';
const loader = (name: string) => glob({ pattern: '**/*.{md,mdx}', base: `${process.env.TEST_BUILD === '1' ? './tests/fixtures/content' : './src/content'}/${name}` });
export const collections = {
  posts: defineCollection({ loader: loader('posts'), schema: schemas.posts }),
  projects: defineCollection({ loader: loader('projects'), schema: schemas.projects }),
  albums: defineCollection({ loader: loader('albums'), schema: schemas.albums }),
  music: defineCollection({ loader: loader('music'), schema: schemas.music }),
  moments: defineCollection({ loader: loader('moments'), schema: schemas.moments }),
};
