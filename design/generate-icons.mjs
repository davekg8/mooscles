// Génère les icônes et logos de l'app à partir des images de design/.
// Usage : node design/generate-icons.mjs
import sharp from 'sharp'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const src = (f) => path.join(root, 'design', f)
const out = (f) => path.join(root, 'public', f)
const BG = { r: 9, g: 10, b: 13, alpha: 1 } // #090A0D, fond de l'app

// L'emblème a un fond blanc : on rend transparent le blanc relié aux bords (pot de peinture).
async function emblemTransparent() {
  const { data, info } = await sharp(src('emblem-original.png')).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const { width: w, height: h } = info
  const isWhite = (i) => data[i] > 235 && data[i + 1] > 235 && data[i + 2] > 235
  const seen = new Uint8Array(w * h)
  const stack = []
  for (let x = 0; x < w; x++) stack.push(x, (h - 1) * w + x)
  for (let y = 0; y < h; y++) stack.push(y * w, y * w + w - 1)
  while (stack.length) {
    const p = stack.pop()
    if (seen[p]) continue
    seen[p] = 1
    if (!isWhite(p * 4)) continue
    data[p * 4 + 3] = 0
    const x = p % w
    const y = (p / w) | 0
    if (x > 0) stack.push(p - 1)
    if (x < w - 1) stack.push(p + 1)
    if (y > 0) stack.push(p - w)
    if (y < h - 1) stack.push(p + w)
  }
  return sharp(data, { raw: { width: w, height: h, channels: 4 } }).png().toBuffer().then((b) => sharp(b).trim().png().toBuffer())
}

// Icône carrée sur fond sombre, avec une marge (ratio = taille du logo / taille de l'icône)
async function squareIcon(logo, size, ratio, file) {
  const inner = Math.round(size * ratio)
  const resized = await sharp(logo).resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).toBuffer()
  await sharp({ create: { width: size, height: size, channels: 4, background: BG } })
    .composite([{ input: resized, gravity: 'center' }])
    .png({ compressionLevel: 9 })
    .toFile(out(file))
}

const emblem = await emblemTransparent()

await squareIcon(emblem, 180, 0.9, 'apple-touch-icon.png')
await squareIcon(emblem, 64, 0.94, 'pwa-64x64.png')
await squareIcon(emblem, 192, 0.9, 'pwa-192x192.png')
await squareIcon(emblem, 512, 0.9, 'pwa-512x512.png')
await squareIcon(emblem, 512, 0.72, 'maskable-icon-512x512.png') // zone de sécurité Android
await sharp(emblem).resize(48, 48, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toFile(out('favicon-48.png'))

// Logos utilisés dans l'interface
await sharp(emblem).resize(160, 160, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).webp({ quality: 85 }).toFile(out('brand/emblem.webp'))
await sharp(src('mascot-original.png')).trim().resize({ width: 640 }).webp({ quality: 82 }).toFile(out('brand/mascot.webp'))

console.log('Icônes générées ✔')
