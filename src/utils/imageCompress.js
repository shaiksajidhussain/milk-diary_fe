/**
 * Resize and encode an image file as a JPEG data URL for API storage.
 * @param {File} file
 * @param {{ maxWidth?: number, quality?: number }} opts
 * @returns {Promise<string>}
 */
export function compressImageFileToDataUrl(file, { maxWidth = 1280, quality = 0.82 } = {}) {
  return new Promise((resolve, reject) => {
    if (!file?.type?.startsWith('image/')) {
      reject(new Error('Please choose an image file'))
      return
    }
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      try {
        const w = img.naturalWidth
        const h = img.naturalHeight
        const scale = w > maxWidth ? maxWidth / w : 1
        const cw = Math.max(1, Math.round(w * scale))
        const ch = Math.max(1, Math.round(h * scale))
        const canvas = document.createElement('canvas')
        canvas.width = cw
        canvas.height = ch
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Could not process image'))
          return
        }
        ctx.drawImage(img, 0, 0, cw, ch)
        let q = quality
        let dataUrl = canvas.toDataURL('image/jpeg', q)
        while (dataUrl.length > 480000 && q > 0.38) {
          q -= 0.08
          dataUrl = canvas.toDataURL('image/jpeg', q)
        }
        resolve(dataUrl)
      } catch (e) {
        reject(e instanceof Error ? e : new Error('Could not process image'))
      }
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Could not read image'))
    }
    img.src = url
  })
}
