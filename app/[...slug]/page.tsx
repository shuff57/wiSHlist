'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

// Dynamically import your existing React app to avoid SSR issues
const ReactApp = dynamic(() => import('../../components/ReactApp'), { 
  ssr: false,
  loading: () => null // No loading component, just wait
})

export default function CatchAllPage() {
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    // Just a brief delay to ensure everything is mounted properly
    const timer = setTimeout(() => {
      setIsReady(true)
    }, 50)

    return () => clearTimeout(timer)
  }, [])

  // Don't render anything until we're ready - this prevents flash
  if (!isReady) {
    return null
  }

  // Show your existing React app - it will handle all routing internally
  return <ReactApp />
}
