'use client'

import { useEffect, useState } from 'react'
import { getTheme, setTheme } from '@/lib/theme'

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(true)

  useEffect(() => {
    setIsDark(getTheme() === 'dark')
  }, [])

  const toggle = () => {
    const next = isDark ? 'light' : 'dark'
    setTheme(next)
    setIsDark(!isDark)
    // Update browser chrome color
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) meta.setAttribute('content', next === 'light' ? '#F2EBD9' : '#070c1a')
  }

  return (
    <button
      onClick={toggle}
      title="Toggle theme"
      style={{
        width: 34,
        height: 34,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-gold)',
        borderRadius: '10px',
        cursor: 'pointer',
        fontSize: '15px',
        transition: 'all 0.2s',
        flexShrink: 0,
      }}
    >
      {isDark ? '☀️' : '🌙'}
    </button>
  )
}