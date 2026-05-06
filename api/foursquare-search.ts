import type { VercelRequest, VercelResponse } from '@vercel/node';

// Proxy serverless para a Foursquare Service API.
// Motivo: o endpoint places-api.foursquare.com não envia headers CORS,
// então o navegador bloqueia chamadas diretas. Aqui rodamos server-side.

const FSQ_URL = 'https://places-api.foursquare.com/places/search';
const FSQ_API_VERSION = '2025-06-17';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET' && req.method !== 'OPTIONS') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'x-fsq-key, accept, content-type');
    res.setHeader('Access-Control-Max-Age', '86400');
    return res.status(204).end();
  }

  const apiKey =
    typeof req.headers['x-fsq-key'] === 'string' ? req.headers['x-fsq-key'] : undefined;
  if (!apiKey) {
    return res.status(400).json({ error: 'Missing X-Fsq-Key header' });
  }

  // Repassa todos os query params recebidos
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(req.query)) {
    if (typeof v === 'string') params.set(k, v);
    else if (Array.isArray(v) && typeof v[0] === 'string') params.set(k, v[0]);
  }

  try {
    const upstream = await fetch(`${FSQ_URL}?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'X-Places-Api-Version': FSQ_API_VERSION,
        Accept: 'application/json',
      },
    });
    const text = await upstream.text();
    res.status(upstream.status);
    res.setHeader('Content-Type', 'application/json');
    // cache curto pra reduzir hits no Foursquare em buscas repetidas
    if (upstream.ok) res.setHeader('Cache-Control', 'public, max-age=300');
    res.send(text);
  } catch (e) {
    res
      .status(502)
      .json({ error: e instanceof Error ? e.message : 'Proxy upstream error' });
  }
}
