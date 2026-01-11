import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '1v1 LeetCode Race - Compete in Real-Time',
  description: 'Race against other developers to solve coding problems. Prove you\'re faster!',
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
