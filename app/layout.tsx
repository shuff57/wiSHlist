import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'wiSHlist - Share Your Wishes',
  description: 'Create and share wishlists with your supporters',
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: '/favicon.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  )
}
