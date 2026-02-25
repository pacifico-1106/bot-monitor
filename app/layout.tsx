import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Tokyo307 Bot Monitor',
  description: 'AI System Monitoring Dashboard',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
