// CORS proxy for ERGIO Engines API — bypasses browser CORS restrictions
const ENGINES_URL = 'https://ergio-engines.onrender.com';

export default async function handler(req, res) {
  // Set CORS headers for the browser
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // Get path from query param or URL
  let path = req.query?.path || '';
  if (!path) {
    path = (req.url || '').replace(/^\/api\/engines-proxy/, '').split('?')[0];
  }
  if (!path) path = '/';
  if (!path.startsWith('/')) path = '/' + path;

  const targetUrl = ENGINES_URL + path;

  try {
    const options = {
      method: req.method,
      headers: { 'Content-Type': 'application/json' },
    };

    if (req.method === 'POST' && req.body) {
      options.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    }

    const response = await fetch(targetUrl, options);
    const data = await response.text();
    res.status(response.status).send(data);
  } catch (err) {
    res.status(502).json({ error: 'Engines proxy error', message: err.message });
  }
}
