import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Ramadan Tracker · Chennai 1446H',
  description: 'Track your prayers and fasts this Ramadan',
  manifest: '/manifest.json',
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
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            var t = localStorage.getItem('theme') ||
              (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
            document.documentElement.setAttribute('data-theme', t);
            document.documentElement.style.backgroundColor = t === 'light' ? '#F5F0E6' : '#070c1a';
            document.body && (document.body.style.backgroundColor = t === 'light' ? '#F5F0E6' : '#070c1a');
          })();
        `}} />
      </head>
      <body style={{ backgroundColor: '#070c1a', margin: 0 }}>
        {children}
        <script dangerouslySetInnerHTML={{ __html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js'))
          }
        `}} />
      </body>
    </html>
  )
}