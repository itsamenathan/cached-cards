import fs from 'node:fs'
import path from 'node:path'
import { PNG } from 'pngjs'

const OUT_DIR = path.resolve('public/icons')
const sizes = [32, 192, 512]

const colors = {
  background: [11, 13, 18],
  card: [248, 241, 223],
  inner: [16, 21, 33],
  accent: [242, 178, 122],
}

const setPixel = (png, x, y, [r, g, b, a = 255]) => {
  const idx = (png.width * y + x) << 2
  png.data[idx] = r
  png.data[idx + 1] = g
  png.data[idx + 2] = b
  png.data[idx + 3] = a
}

const fillRect = (png, x, y, w, h, color) => {
  const xEnd = Math.min(png.width, x + w)
  const yEnd = Math.min(png.height, y + h)
  for (let yy = Math.max(0, y); yy < yEnd; yy += 1) {
    for (let xx = Math.max(0, x); xx < xEnd; xx += 1) {
      setPixel(png, xx, yy, color)
    }
  }
}

const drawIcon = (size) => {
  const png = new PNG({ width: size, height: size })
  fillRect(png, 0, 0, size, size, colors.background)

  const cardMargin = Math.round(size * 0.18)
  const cardWidth = size - cardMargin * 2
  const cardHeight = Math.round(size * 0.68)
  const cardX = cardMargin
  const cardY = Math.round(size * 0.18)

  fillRect(png, cardX, cardY, cardWidth, cardHeight, colors.card)

  const innerMargin = Math.round(cardWidth * 0.09)
  fillRect(
    png,
    cardX + innerMargin,
    cardY + innerMargin,
    cardWidth - innerMargin * 2,
    cardHeight - innerMargin * 2,
    colors.inner,
  )

  const accentSize = Math.round(cardWidth * 0.22)
  fillRect(
    png,
    cardX + cardWidth - innerMargin - accentSize,
    cardY + cardHeight - innerMargin - accentSize,
    accentSize,
    accentSize,
    colors.accent,
  )

  return png
}

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true })
}

sizes.forEach((size) => {
  const png = drawIcon(size)
  const filePath = path.join(OUT_DIR, `icon-${size}.png`)
  fs.writeFileSync(filePath, PNG.sync.write(png))
})

console.log('Icons generated:', sizes.map((size) => `icon-${size}.png`).join(', '))
