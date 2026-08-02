// CORS proxy for ERGIO Engines API — bypasses browser CORS restrictions
const ENGINES_URL = 'https://ergio-engines.onrender.com';

export default function handler(req, res) {
  // Set CORS headers for the browser
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // Extract the path after /api/engines-proxy
  const path = req.url.replace(/^\/api\/engines-proxy/, '') || '/';
  const targetUrl = ENGINES_URL + path;

  // Forward the request
  const options = {
    method: req.method,
    headers: { 'Content-Type': 'application/json' },
  };

  if (req.method === 'POST' && req.body) {
    options.body = JSON.stringify(req.body);
  }

  fetch(targetUrl, options)
    .then(async (response) => {
      const data = await response.text();
      res.status(response.status).send(data);
    })
    .catch((err) => {
      res.status(502).json({ error: 'Engines proxy error', message: err.message });
    });
}
