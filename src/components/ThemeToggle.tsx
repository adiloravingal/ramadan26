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
  }

  return (
    <button
      onClick={toggle}
      title="Toggle theme"
      style={{
        background: 'none',
        border: '1px solid var(--border-gold)',
        borderRadius: '8px',
        padding: '5px 9px',
        cursor: 'pointer',
        fontSize: '14px',
        color: 'var(--text-gold-dim)',
        transition: 'all 0.2s',
        fontFamily: 'Lato, sans-serif',
        marginRight: '8px',
      }}
      onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-gold)')}
      onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-gold-dim)')}
    >
      {isDark ? '☀️' : '🌙'}
    </button>
  )
}