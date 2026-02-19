import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Ramadan Tracker · Chennai 1446H',
  description: 'Track your prayers and fasts this Ramadan',
  manifest: '/manifest.json',
  themeColor: '#070c1a',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Ramadan',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#070c1a" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Ramadan" />
      </head>
      <body>
        {children}
        <script dangerouslySetInnerHTML={{
          __html: `
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js')
              })
            }
          `
        }} />
      </body>
    </html>
  )
}