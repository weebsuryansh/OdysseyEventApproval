export const CHROMIUM_IMAGE_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'image/bmp',
  'image/svg+xml',
]

export const CHROMIUM_IMAGE_ACCEPT = CHROMIUM_IMAGE_TYPES.join(',')

export const INVOICE_FILE_TYPES = [...CHROMIUM_IMAGE_TYPES, 'application/pdf']

export const INVOICE_FILE_ACCEPT = INVOICE_FILE_TYPES.join(',')

export const filterChromiumImages = (files = []) => {
  const accepted = []
  const rejected = []

  files.forEach((file) => {
    if (CHROMIUM_IMAGE_TYPES.includes(file.type)) {
      accepted.push(file)
    } else {
      rejected.push(file)
    }
  })

  return { accepted, rejected }
}

export const filterInvoiceFiles = (files = []) => {
  const accepted = []
  const rejected = []

  files.forEach((file) => {
    if (INVOICE_FILE_TYPES.includes(file.type)) {
      accepted.push(file)
    } else {
      rejected.push(file)
    }
  })

  return { accepted, rejected }
}
