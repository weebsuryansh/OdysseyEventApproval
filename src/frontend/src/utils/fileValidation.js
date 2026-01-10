export const CHROMIUM_IMAGE_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'image/bmp',
  'image/svg+xml',
]

export const CHROMIUM_IMAGE_ACCEPT = CHROMIUM_IMAGE_TYPES.join(',')

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
