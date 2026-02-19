export function getTheme(): 'dark' | 'light' {
  if (typeof window === 'undefined') return 'dark'
  return (localStorage.getItem('theme') as 'dark' | 'light') ||
    (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')
}

export function setTheme(theme: 'dark' | 'light') {
  localStorage.setItem('theme', theme)
  document.documentElement.setAttribute('data-theme', theme)
}

export function initTheme() {
  const theme = getTheme()
  document.documentElement.setAttribute('data-theme', theme)
}