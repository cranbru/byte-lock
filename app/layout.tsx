import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ByteLock - Secure File Encryption',
  description: 'Secure file encryption with client-side processing',
  generator: 'ByteLock',
  icons: {
    icon: '/favicon.ico'
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
