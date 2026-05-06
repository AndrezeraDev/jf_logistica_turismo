import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Em dev (`npm run dev`), o Vite não roda funções serverless de /api/*.
 * Esse plugin imita a função `api/foursquare-search.ts` da Vercel
 * pra que a busca via Foursquare funcione localmente também.
 */
const foursquareDevProxy: Plugin = {
  name: 'foursquare-dev-proxy',
  configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
      if (!req.url || !req.url.startsWith('/api/foursquare-search')) return next();

      const url = new URL(req.url, 'http://localhost');
      const apiKey = req.headers['x-fsq-key'];
      if (typeof apiKey !== 'string' || !apiKey) {
        res.statusCode = 400;
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify({ error: 'Missing X-Fsq-Key header' }));
        return;
      }

      const target = `https://places-api.foursquare.com/places/search${url.search}`;
      try {
        const upstream = await fetch(target, {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'X-Places-Api-Version': '2025-06-17',
            Accept: 'application/json',
          },
        });
        const text = await upstream.text();
        res.statusCode = upstream.status;
        res.setHeader('content-type', 'application/json');
        const linkHeader = upstream.headers.get('link');
        if (linkHeader) {
          res.setHeader('link', linkHeader);
          res.setHeader('access-control-expose-headers', 'link');
        }
        res.end(text);
      } catch (e) {
        res.statusCode = 502;
        res.setHeader('content-type', 'application/json');
        res.end(
          JSON.stringify({
            error: e instanceof Error ? e.message : 'Proxy upstream error',
          }),
        );
      }
    });
  },
};

export default defineConfig({
  plugins: [react(), foursquareDevProxy],
  server: { host: true, port: 5173 },
});
