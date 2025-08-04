'use client'

import { useEffect } from 'react'

export default function SupporterPage() {
  
  useEffect(() => {
    // Redirect to your existing React app's supporter route
    // Since we're wrapping the app, we need to handle routing differently
    // This is a temporary solution - you might want to adjust this based on your needs
    if (typeof window !== 'undefined') {
      window.location.href = '/supporter'
    }
  }, [])

  return null // No loading screen, just redirect
}
