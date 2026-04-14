import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Snappr Sales Intelligence',
  description: 'AI-powered sales intelligence for Snappr',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-[#0a0e1a] text-white min-h-screen antialiased`}>
        {children}
      </body>
    </html>
  )
}
