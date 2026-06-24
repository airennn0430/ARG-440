const ALLOWED_ORIGINS = [
  'https://hidarling.vercel.app',
  'https://toraporta.vercel.app',
  'https://rienta.vercel.app',
  'https://s-lack.vercel.app',
];

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TTL_SECONDS = 7776000; // 90 days

function applyCors(req, res) {
  const origin = req.headers.origin;
  if (origin && (ALLOWED_ORIGINS.includes(origin) || /^https?:\/\/localhost(:\d+)?$/.test(origin))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

async function kvGet(key) {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  const r = await fetch(`${url}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!r.ok) throw new Error('kv get failed');
  const data = await r.json();
  return data.result;
}

async function kvSet(key, value, ttlSeconds) {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  const r = await fetch(
    `${url}/set/${encodeURIComponent(key)}/${encodeURIComponent(value)}/EX/${ttlSeconds}`,
    { method: 'POST', headers: { Authorization: `Bearer ${token}` } }
  );
  if (!r.ok) throw new Error('kv set failed');
}

module.exports = async function handler(req, res) {
  applyCors(req, res);

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method === 'GET') {
    const vid = typeof req.query.vid === 'string' ? req.query.vid : '';
    if (!UUID_RE.test(vid)) {
      res.status(200).json({ done: false });
      return;
    }
    try {
      const result = await kvGet(`vid:${vid}`);
      res.status(200).json({ done: result !== null && result !== undefined });
    } catch (e) {
      res.status(200).json({ done: false });
    }
    return;
  }

  if (req.method === 'POST') {
    const vid = req.body && typeof req.body.vid === 'string' ? req.body.vid : '';
    if (!UUID_RE.test(vid)) {
      res.status(400).json({ error: 'invalid vid' });
      return;
    }
    try {
      await kvSet(`vid:${vid}`, '1', TTL_SECONDS);
      res.status(200).json({ ok: true });
    } catch (e) {
      res.status(502).json({ error: 'storage unavailable' });
    }
    return;
  }

  res.status(405).json({ error: 'method not allowed' });
};
