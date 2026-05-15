import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'The Casebook',
  description: 'Detective investigation board',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Special+Elite&family=Courier+Prime:ital,wght@0,400;0,700;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ margin: 0, padding: 0, background: '#0a0805' }}>
        {children}
      </body>
    </html>
  )
}