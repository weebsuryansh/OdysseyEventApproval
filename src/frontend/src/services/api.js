const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080'

export const api = async (url, options = {}) => {
  const target = url.startsWith('http') ? url : `${API_BASE}${url}`

  let response
  try {
    response = await fetch(target, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      ...options,
    })
  } catch (networkErr) {
    throw new Error('Network error. Please check your connection and try again.')
  }

  if (!response.ok) {
    const text = await response.text()
    let errorMessage = text || 'Request failed'
    try {
      const data = text ? JSON.parse(text) : null
      if (data?.message) errorMessage = data.message
    } catch (_) {
      // keep original fallback message
    }

    const error = new Error(errorMessage)
    error.status = response.status
    throw error
  }

  if (response.status === 204) return null
  return response.json()
}
