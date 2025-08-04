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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200">Loading...</h2>
      </div>
    </div>
  )
}
