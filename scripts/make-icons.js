const sharp = require('sharp')

async function run() {
  const src = 'public/brand/logo-full.png'
  const meta = await sharp(src).metadata()
  console.log(`Source: ${meta.width}x${meta.height}`)

  // Crop the book + light burst (center-upper region)
  const cw = Math.round(meta.width * 0.40)
  const ch = cw
  const left = Math.round((meta.width - cw) / 2)
  const top = Math.round(meta.height * 0.12)
  console.log(`Icon crop: left=${left} top=${top} size=${cw}x${ch}`)

  const icon = sharp(src).extract({ left, top, width: cw, height: ch })

  await icon.clone().resize(512, 512).png().toFile('app/icon.png')
  console.log('✓ app/icon.png')

  await icon.clone().resize(180, 180).png().toFile('app/apple-icon.png')
  console.log('✓ app/apple-icon.png')

  // OG image 1200x630 from full logo
  await sharp(src)
    .resize(1200, 630, { fit: 'cover', position: 'centre' })
    .png()
    .toFile('public/og-image.png')
  console.log('✓ public/og-image.png')

  console.log('\nAll icons generated. Review app/icon.png — if the book is off-center,')
  console.log('adjust the `top` multiplier (currently 0.12) and `cw` multiplier (currently 0.40).')
}

run().catch(err => {
  console.error('Error:', err.message)
  process.exit(1)
})
