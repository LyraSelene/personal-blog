import { preview } from 'astro';
export default async function setup() {
  const server = await preview({ server: { host: '127.0.0.1', port: 4323 } });
  return async () => { await server.stop(); };
}
