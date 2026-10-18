const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/v1'

async function request(path, options = {}) {
  let res
  try {
    res = await fetch(BASE + path, { headers: { 'Content-Type': 'application/json' }, ...options })
  } catch {
    throw new Error('Cannot reach the server. Is the FastAPI backend running?')
  }
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    // FastAPI sends a string `detail` for HTTPException, a list for 422 validation errors
    throw new Error(typeof body?.detail === 'string' ? body.detail : `Request failed (${res.status})`)
  }
  return res.status === 204 ? null : res.json()
}

const json = (method, data) => ({ method, body: JSON.stringify(data) })

export const api = {
  list: () => request('/todos'),
  create: (data) => request('/todos', json('POST', data)),
  update: (id, data) => request(`/todos/${id}`, json('PATCH', data)),
  remove: (id) => request(`/todos/${id}`, { method: 'DELETE' }),
}
