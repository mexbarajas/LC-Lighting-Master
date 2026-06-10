const sharp = require('sharp')
const path = require('path')

async function run() {
  const src = 'public/brand/logo.png'
  const meta = await sharp(src).metadata()
  console.log(`Source: ${meta.width}x${meta.height} (${meta.format})`)

  // The icon is centered in a 1536x1024 canvas with a gray-gradient bleed.
  // Crop tightly around the icon (roughly the center 480x480 square).
  const iconSize = Math.round(meta.height * 0.47)  // ~480px
  const left = Math.round((meta.width - iconSize) / 2)
  const top  = Math.round((meta.height - iconSize) / 2)
  console.log(`Icon crop: ${left},${top}  ${iconSize}x${iconSize}`)

  const iconBuf = await sharp(src)
    .extract({ left, top, width: iconSize, height: iconSize })
    .toBuffer()

  // app/icon.png — 512×512 (Next.js auto-serves as /favicon.ico + manifest icon)
  await sharp(iconBuf).resize(512, 512).png().toFile('app/icon.png')
  console.log('✓ app/icon.png')

  // app/apple-icon.png — 180×180
  await sharp(iconBuf).resize(180, 180).png().toFile('app/apple-icon.png')
  console.log('✓ app/apple-icon.png')

  // public/favicon-32.png — used in layout.js <link> for older browsers
  await sharp(iconBuf).resize(32, 32).png().toFile('public/brand/favicon-32.png')
  console.log('✓ public/brand/favicon-32.png')

  // public/og-image.png — 1200×630 dark branded card
  // Deep Forest background + centered icon + wordmark
  const ogW = 1200, ogH = 630
  const iconInOg = 280
  const iconResized = await sharp(iconBuf).resize(iconInOg, iconInOg).png().toBuffer()

  // Build SVG overlay: background + wordmark text
  const svg = `<svg width="${ogW}" height="${ogH}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${ogW}" height="${ogH}" fill="#2F4A3F"/>
    <!-- subtle grid lines -->
    ${Array.from({length:8},(_,i)=>`<line x1="0" y1="${Math.round(ogH/8*(i+1))}" x2="${ogW}" y2="${Math.round(ogH/8*(i+1))}" stroke="rgba(249,244,237,0.04)" stroke-width="1"/>`).join('')}
    <!-- radial glow behind icon -->
    <radialGradient id="glow" cx="50%" cy="46%" r="30%">
      <stop offset="0%" stop-color="#C65A3A" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="#2F4A3F" stop-opacity="0"/>
    </radialGradient>
    <rect width="${ogW}" height="${ogH}" fill="url(#glow)"/>
    <!-- wordmark below icon -->
    <text x="${ogW/2}" y="${Math.round(ogH*0.82)}"
      font-family="'Space Grotesk',Arial,sans-serif"
      font-weight="700" font-size="52"
      fill="#F2E6DA" text-anchor="middle" letter-spacing="-1">
      LC · Lighting Master
    </text>
    <text x="${ogW/2}" y="${Math.round(ogH*0.92)}"
      font-family="'Inter',Arial,sans-serif"
      font-weight="400" font-size="22"
      fill="rgba(242,230,218,0.55)" text-anchor="middle" letter-spacing="2">
      NCQLP EXAM PREP · 74 LESSONS · 24 CEU HOURS
    </text>
  </svg>`

  const svgBuf = Buffer.from(svg)
  const iconX = Math.round((ogW - iconInOg) / 2)
  const iconY = Math.round(ogH * 0.12)

  await sharp(svgBuf)
    .composite([{ input: iconResized, left: iconX, top: iconY }])
    .png()
    .toFile('public/og-image.png')
  console.log('✓ public/og-image.png')

  console.log('\nAll icons generated successfully.')
}

run().catch(err => { console.error('Error:', err.message); process.exit(1) })
