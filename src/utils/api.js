// API client for web mode (when !isTauri() and served from the Express server).
// Auto-detects the base URL from window.location.origin.

export const isWebMode =
  typeof window !== 'undefined' &&
  !('__TAURI_INTERNALS__' in window) &&
  !['5173', '5174', '5175'].includes(window.location.port);

const base = () => (isWebMode ? window.location.origin : '');

export async function loadData(username) {
  const res = await fetch(`${base()}/api/data?user=${encodeURIComponent(username)}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function pushData(username, data) {
  const res = await fetch(`${base()}/api/data?user=${encodeURIComponent(username)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function deleteEntity(username, table, id) {
  const res = await fetch(`${base()}/api/data/${table}/${id}?user=${encodeURIComponent(username)}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
