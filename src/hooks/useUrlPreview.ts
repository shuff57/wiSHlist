import { useState, useCallback } from 'react'

interface UrlPreviewData {
  title: string | null
  description: string | null
  image: string | null
  url: string
  price: string | null
  success: boolean
}

interface UrlPreviewError {
  error: string
}

interface UseUrlPreviewReturn {
  data: UrlPreviewData | null
  loading: boolean
  error: string | null
  previewUrl: (url: string) => Promise<void>
  clearPreview: () => void
}

export function useUrlPreview(): UseUrlPreviewReturn {
  const [data, setData] = useState<UrlPreviewData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Client-side fallback for when server scraping fails
  const extractBasicUrlInfo = (url: string): UrlPreviewData => {
    try {
      const urlObj = new URL(url)
      const domain = urlObj.hostname
      const path = urlObj.pathname
      
      // Extract basic title from URL
      let title = path
        .split('/')
        .filter(segment => segment.length > 0)
        .pop() || domain
        
      title = title
        .replace(/[-_]/g, ' ')
        .replace(/\.[^.]*$/, '') // Remove file extension
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
        
      return {
        title: title || domain,
        description: `Content from ${domain}`,
        image: null,
        url: url,
        price: null,
        success: true
      }
    } catch {
      return {
        title: 'Unknown Content',
        description: 'Unable to preview this URL',
        image: null,
        url: url,
        price: null,
        success: true
      }
    }
  }

  const previewUrl = useCallback(async (url: string) => {
    if (!url.trim()) {
      setError('Please enter a valid URL')
      return
    }

    setLoading(true)
    setError(null)
    setData(null)

    try {
      // Use GET method with URL parameter (preferred approach)
      const response = await fetch(`/api/scrape?url=${encodeURIComponent(url.trim())}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      })

      const result = await response.json()

      if (!response.ok) {
        // If server scraping fails, try client-side fallback
        console.log('Server scraping failed, using fallback:', result.error)
        const fallbackData = extractBasicUrlInfo(url.trim())
        setData(fallbackData)
        setError(`Limited preview available: ${result.error}`)
        return
      }

      // Transform the metadata response to match our interface
      const transformedData: UrlPreviewData = {
        title: result.title || null,
        description: result.description || null,
        image: result.image || null,
        url: result.url || url.trim(),
        price: result.price || null,
        success: true
      }

      setData(transformedData)
      
    } catch (err: any) {
      console.error('URL preview error:', err)
      
      // Always provide fallback data rather than complete failure
      const fallbackData = extractBasicUrlInfo(url.trim())
      setData(fallbackData)
      setError(`Limited preview available: ${err.message || 'Network error'}`)
    } finally {
      setLoading(false)
    }
  }, [])

  const clearPreview = useCallback(() => {
    setData(null)
    setError(null)
    setLoading(false)
  }, [])

  return {
    data,
    loading,
    error,
    previewUrl,
    clearPreview,
  }
}
