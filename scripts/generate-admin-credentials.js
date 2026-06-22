#!/usr/bin/env node
/**
 * Generate secure admin credentials for .env files
 * Usage: node scripts/generate-admin-credentials.js <password>
 */

import bcryptjs from 'bcryptjs'
import { randomBytes } from 'crypto'

async function generate() {
  const password = process.argv[2]

  if (!password) {
    console.error('❌ Error: Please provide a password')
    console.log('Usage: node scripts/generate-admin-credentials.js "YourSecurePassword123!"')
    process.exit(1)
  }

  if (password.length < 12) {
    console.error('❌ Error: Password must be at least 12 characters')
    process.exit(1)
  }

  try {
    const hash = await bcryptjs.hash(password, 12)
    const jwtSecret = randomBytes(32).toString('hex')

    console.log('\n✅ Secure credentials generated:\n')
    console.log('ADMIN_PASSWORD_HASH=' + hash)
    console.log('ADMIN_JWT_SECRET=' + jwtSecret)
    console.log('\nAdd these to your .env.local or Vercel environment variables.')
    console.log('⚠️  Do NOT commit these values to git!\n')
  } catch (err) {
    console.error('Error generating credentials:', err.message)
    process.exit(1)
  }
}

generate()
