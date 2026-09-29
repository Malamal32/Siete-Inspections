// Cloudflare Pages "advanced mode" worker: handles /api/*, everything else is served from this folder.
// Bindings (set in Pages > Settings > Bindings): DB = D1 database, PHOTOS = R2 bucket.
const json = (d, status = 200) => new Response(JSON.stringify(d), { status, headers: { 'content-type': 'application/json' } });
const TABLES = { templates: 'templates', inspections: 'inspections' };

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith('/api/')) return env.ASSETS.fetch(request);
    try { return await api(request, env, url.pathname.slice(5).split('/').filter(Boolean)); }
    catch (e) { return json({ error: String(e && e.message || e) }, 500); }
  },
};

async function api(request, env, parts) {
  const [kind, rawId] = parts;
  const id = rawId ? decodeURIComponent(rawId) : null;
  const method = request.method;

  if (kind === 'health') return json({ ok: true });

  if (kind === 'photos') {
    if (!id) return json({ error: 'Photo id required' }, 400);
    if (method === 'PUT') {
      const buf = await request.arrayBuffer();
      if (buf.byteLength > 15 * 1024 * 1024) return json({ error: 'Photo too large' }, 413);
      await env.PHOTOS.put(id, buf, { httpMetadata: { contentType: request.headers.get('content-type') || 'image/jpeg' } });
      return json({ url: '/api/photos/' + encodeURIComponent(id) });
    }
    if (method === 'GET') {
      const obj = await env.PHOTOS.get(id);
      if (!obj) return new Response('Not found', { status: 404 });
      return new Response(obj.body, { headers: { 'content-type': obj.httpMetadata?.contentType || 'image/jpeg', 'cache-control': 'private, max-age=31536000, immutable' } });
    }
    if (method === 'DELETE') { await env.PHOTOS.delete(id); return new Response(null, { status: 204 }); }
    return json({ error: 'Method not allowed' }, 405);
  }

  const table = TABLES[kind];
  if (!table) return json({ error: 'Not found' }, 404);

  if (method === 'GET' && !id) {
    const { results } = await env.DB.prepare('SELECT data FROM ' + table + ' ORDER BY updated_at DESC').all();
    return json(results.map(r => JSON.parse(r.data)));
  }
  if (!id) return json({ error: 'Id required' }, 400);
  if (method === 'GET') {
    const row = await env.DB.prepare('SELECT data FROM ' + table + ' WHERE id = ?1').bind(id).first();
    return row ? json(JSON.parse(row.data)) : json({ error: 'Not found' }, 404);
  }
  if (method === 'PUT') {
    const body = await request.text();
    try { JSON.parse(body); } catch (e) { return json({ error: 'Invalid JSON' }, 400); }
    await env.DB.prepare('INSERT INTO ' + table + ' (id, data, updated_at) VALUES (?1, ?2, ?3) ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at')
      .bind(id, body, Date.now()).run();
    return new Response(null, { status: 204 });
  }
  if (method === 'DELETE') {
    await env.DB.prepare('DELETE FROM ' + table + ' WHERE id = ?1').bind(id).run();
    return new Response(null, { status: 204 });
  }
  return json({ error: 'Method not allowed' }, 405);
}
