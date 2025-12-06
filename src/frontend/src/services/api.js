const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080'

export const api = async (url, options = {}) => {
  const target = url.startsWith('http') ? url : `${API_BASE}${url}`
  const response = await fetch(target, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || 'Request failed')
  }

  if (response.status === 204) return null
  return response.json()
}
