// lib/resize-image.ts
/**
 * Resize & compress an image in the browser with <canvas>.
 * Returns a Blob ready for upload.
 */
export async function resizeAndCompress(
  file: File,
  { maxWidth = 1920, quality = 0.8 }: { maxWidth?: number; quality?: number } = {},
): Promise<Blob> {
  // Load image
  const img = await createImageBitmap(file)
  const scale = Math.min(1, maxWidth / img.width)
  const width = Math.round(img.width * scale)
  const height = Math.round(img.height * scale)

  // Draw to canvas
  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext("2d")!
  ctx.drawImage(img, 0, 0, width, height)

  // Convert to JPEG blob
  return new Promise<Blob>((res, rej) => {
    canvas.toBlob((b) => (b ? res(b) : rej(new Error("Canvas toBlob returned null"))), "image/jpeg", quality)
  })
}
