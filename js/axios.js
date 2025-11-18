// js/axios.js
window.axios = {
  get: async function(url, opts = {}) {
    // opts.params => appended query params
    let u = url;
    if (opts.params) {
      const parsed = new URL(u, window.location.origin);
      Object.keys(opts.params).forEach(k => {
        if (opts.params[k] !== undefined && opts.params[k] !== null) parsed.searchParams.set(k, opts.params[k]);
      });
      u = parsed.toString();
    }
    const res = await fetch(u, { method: 'GET', headers: opts.headers || {} });
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) return res.json();
    return res.text();
  },
  post: async function(url, data = {}, opts = {}) {
    const res = await fetch(url, {
      method: 'POST',
      headers: Object.assign({ 'Content-Type': 'application/json' }, opts.headers || {}),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }
};