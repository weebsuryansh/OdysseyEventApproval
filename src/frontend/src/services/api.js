export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080'

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

export const uploadFiles = async (url, files = []) => {
  const target = url.startsWith('http') ? url : `${API_BASE}${url}`
  const formData = new FormData()
  files.forEach((file) => formData.append('files', file))

  let response
  try {
    response = await fetch(target, {
      credentials: 'include',
      body: formData,
      method: 'POST',
    })
  } catch (_) {
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

export const resolveApiUrl = (url) => (url.startsWith('http') || url.startsWith('data:') ? url : `${API_BASE}${url}`)

export const downloadFile = async (url, filename) => {
  const target = url.startsWith('http') ? url : `${API_BASE}${url}`
  let response
  try {
    response = await fetch(target, {
      credentials: 'include',
      headers: optionsHeaders(),
    })
  } catch (_) {
    throw new Error('Network error. Please check your connection and try again.')
  }

  if (!response.ok) {
    const text = await response.text()
    let errorMessage = text || 'Request failed'
    try {
      const data = text ? JSON.parse(text) : null
      if (data?.message) errorMessage = data.message
    } catch (_) {
      // ignore
    }
    const error = new Error(errorMessage)
    error.status = response.status
    throw error
  }

  const blob = await response.blob()
  const link = document.createElement('a')
  const href = window.URL.createObjectURL(blob)
  link.href = href
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(href)
}

const optionsHeaders = () => ({
  Accept: 'application/pdf',
})
