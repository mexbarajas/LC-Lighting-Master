'use client'

import dynamic from 'next/dynamic'

const LcApp = dynamic(() => import('@/components/LcApp'), { ssr: false })

export default function Page() {
  return <LcApp />
}
