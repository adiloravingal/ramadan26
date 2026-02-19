'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    setTimeout(() => setMounted(true), 50)
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } },
      })
      if (error) { setError(error.message); setLoading(false); return }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) { setError(error.message); setLoading(false); return }
    }

    router.push('/dashboard')
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=Lato:wght@300;400&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .login-root {
          min-height: 100vh;
          background: var(--bg-root);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Lato', sans-serif;
          overflow: hidden;
          position: relative;
        }

        .stars {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 0;
        }
        .star {
          position: absolute;
          background: white;
          border-radius: 50%;
          animation: twinkle var(--dur) ease-in-out infinite var(--delay);
        }
        @keyframes twinkle {
          0%, 100% { opacity: var(--min-op); transform: scale(1); }
          50% { opacity: var(--max-op); transform: scale(1.3); }
        }

        .orb {
          position: fixed;
          width: 600px;
          height: 600px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(196,155,74,0.12) 0%, rgba(196,155,74,0.04) 40%, transparent 70%);
          top: -200px;
          right: -100px;
          pointer-events: none;
          z-index: 0;
          animation: orbFloat 8s ease-in-out infinite;
        }
        @keyframes orbFloat {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(30px) scale(1.05); }
        }

        .card {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 420px;
          padding: 0 20px;
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 0.8s cubic-bezier(0.16,1,0.3,1), transform 0.8s cubic-bezier(0.16,1,0.3,1);
        }
        .card.visible {
          opacity: 1;
          transform: translateY(0);
        }

        .crescent-wrap {
          text-align: center;
          margin-bottom: 32px;
          opacity: 0;
          transform: translateY(12px);
          transition: all 0.9s cubic-bezier(0.16,1,0.3,1) 0.1s;
        }
        .card.visible .crescent-wrap { opacity: 1; transform: translateY(0); }

        .crescent {
          width: 64px;
          height: 64px;
          margin: 0 auto 16px;
          position: relative;
        }
        .crescent svg {
          width: 100%;
          height: 100%;
          filter: drop-shadow(0 0 20px rgba(196,155,74,0.6));
          animation: crescentGlow 3s ease-in-out infinite;
        }
        @keyframes crescentGlow {
          0%, 100% { filter: drop-shadow(0 0 15px rgba(196,155,74,0.5)); }
          50% { filter: drop-shadow(0 0 30px rgba(196,155,74,0.9)); }
        }

        .title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 36px;
          font-weight: 300;
          color: var(--text-primary);
          letter-spacing: 0.02em;
          line-height: 1.1;
        }
        .subtitle {
          font-size: 12px;
          color: rgba(196,155,74,0.7);
          letter-spacing: 0.2em;
          text-transform: uppercase;
          margin-top: 6px;
          font-weight: 300;
        }

        .divider {
          width: 40px;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(196,155,74,0.5), transparent);
          margin: 12px auto 0;
        }

        .panel {
          background: var(--bg-panel);
          border: 1px solid var(--border-gold);
          border-radius: 20px;
          padding: 32px;
          backdrop-filter: blur(20px);
          box-shadow: 0 40px 80px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05);
          opacity: 0;
          transform: translateY(16px);
          transition: all 0.9s cubic-bezier(0.16,1,0.3,1) 0.2s;
        }
        .card.visible .panel { opacity: 1; transform: translateY(0); }

        .mode-toggle {
          display: flex;
          background: var(--bg-input);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 4px;
          margin-bottom: 28px;
          position: relative;
        }
        .mode-btn {
          flex: 1;
          padding: 9px;
          border: none;
          background: transparent;
          color: rgba(255,255,255,0.35);
          font-size: 13px;
          font-family: 'Lato', sans-serif;
          font-weight: 400;
          letter-spacing: 0.05em;
          cursor: pointer;
          border-radius: 9px;
          transition: color 0.3s;
          position: relative;
          z-index: 1;
        }
        .mode-btn.active { color: #0a0f1e; }
        .mode-slider {
          position: absolute;
          top: 4px;
          bottom: 4px;
          width: calc(50% - 4px);
          background: linear-gradient(135deg, #c49b4a, #e8c97a);
          border-radius: 8px;
          transition: transform 0.35s cubic-bezier(0.34,1.56,0.64,1);
          box-shadow: 0 2px 12px rgba(196,155,74,0.4);
        }
        .mode-slider.right { transform: translateX(calc(100% + 0px)); left: 4px; }
        .mode-slider.left { transform: translateX(0); left: 4px; }

        .field {
          margin-bottom: 18px;
          opacity: 0;
          transform: translateX(-8px);
          transition: all 0.5s cubic-bezier(0.16,1,0.3,1);
        }
        .card.visible .field:nth-child(1) { opacity: 1; transform: translateX(0); transition-delay: 0.35s; }
        .card.visible .field:nth-child(2) { opacity: 1; transform: translateX(0); transition-delay: 0.42s; }
        .card.visible .field:nth-child(3) { opacity: 1; transform: translateX(0); transition-delay: 0.49s; }
        .card.visible .field:nth-child(4) { opacity: 1; transform: translateX(0); transition-delay: 0.56s; }

        .field label {
          display: block;
          font-size: 10px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(196,155,74,0.6);
          margin-bottom: 8px;
          font-weight: 400;
        }
        .field input {
          width: 100%;
          padding: 13px 16px;
          background: var(--bg-input);
          border: 1px solid var(--border-input);
          border-radius: 12px;
          color: var(--text-primary);
          font-size: 14px;
          font-family: 'Lato', sans-serif;
          font-weight: 300;
          outline: none;
          transition: all 0.3s;
          -webkit-appearance: none;
        }
        .field input::placeholder { color: var(--text-placeholder); }
        .field input:focus {
          border-color: rgba(196,155,74,0.5);
          background: rgba(196,155,74,0.05);
          box-shadow: 0 0 0 3px rgba(196,155,74,0.08);
        }
        .field input:-webkit-autofill {
          -webkit-box-shadow: 0 0 0 100px #111827 inset !important;
          -webkit-text-fill-color: var(--text-primary) !important;
        }

        .error-msg {
          font-size: 12px;
          color: #f87171;
          text-align: center;
          padding: 10px;
          background: rgba(248,113,113,0.08);
          border: 1px solid rgba(248,113,113,0.15);
          border-radius: 10px;
          margin-bottom: 16px;
          animation: errorShake 0.4s cubic-bezier(0.36,0.07,0.19,0.97);
        }
        @keyframes errorShake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }

        .submit-btn {
          width: 100%;
          padding: 14px;
          background: linear-gradient(135deg, #c49b4a 0%, #e8c97a 50%, #c49b4a 100%);
          background-size: 200% 100%;
          border: none;
          border-radius: 12px;
          color: #0a0f1e;
          font-size: 14px;
          font-family: 'Lato', sans-serif;
          font-weight: 400;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.3s;
          position: relative;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(196,155,74,0.3);
        }
        .submit-btn:hover:not(:disabled) {
          background-position: right center;
          box-shadow: 0 8px 30px rgba(196,155,74,0.5);
          transform: translateY(-1px);
        }
        .submit-btn:active:not(:disabled) { transform: translateY(0); }
        .submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .submit-btn .btn-shimmer {
          position: absolute;
          inset: 0;
          background: linear-gradient(105deg, transparent 40%, var(--text-secondary) 50%, transparent 60%);
          transform: translateX(-100%);
          animation: shimmer 2.5s infinite;
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }

        .spinner {
          display: inline-block;
          width: 14px; height: 14px;
          border: 2px solid rgba(10,15,30,0.3);
          border-top-color: #0a0f1e;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          vertical-align: middle;
          margin-right: 8px;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .bottom-note {
          text-align: center;
          margin-top: 20px;
          font-size: 11px;
          color: rgba(255,255,255,0.18);
          letter-spacing: 0.05em;
          opacity: 0;
          transition: opacity 0.8s 0.6s;
        }
        .card.visible .bottom-note { opacity: 1; }

        .arabic-deco {
          text-align: center;
          font-size: 18px;
          color: rgba(196,155,74,0.25);
          letter-spacing: 0.1em;
          margin-top: 10px;
          font-family: serif;
        }
      `}</style>

      <div className="login-root">
        <Stars />
        <div className="orb" />

        <div className={`card ${mounted ? 'visible' : ''}`}>
          <div className="crescent-wrap">
            <div className="crescent">
              <svg viewBox="0 0 64 64" fill="none">
                <path
                  d="M32 8C18.745 8 8 18.745 8 32s10.745 24 24 24c4.17 0 8.088-1.065 11.5-2.94C36.86 51.698 30 43.68 30 34c0-9.68 6.86-17.698 13.5-19.06A23.9 23.9 0 0032 8z"
                  fill="url(#goldGrad)"
                />
                <defs>
                  <linearGradient id="goldGrad" x1="8" y1="8" x2="56" y2="56" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#e8c97a" />
                    <stop offset="1" stopColor="#c49b4a" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <div className="title">Ramadan</div>
            <div className="title" style={{ fontStyle: 'italic', marginTop: -4 }}>Tracker</div>
            <div className="divider" />
            <div className="subtitle">Chennai · Ramadan 1446H</div>
          </div>

          <div className="panel">
            <div className="mode-toggle">
              <div className={`mode-slider ${mode === 'signup' ? 'right' : 'left'}`} />
              <button className={`mode-btn ${mode === 'login' ? 'active' : ''}`} onClick={() => setMode('login')}>
                Sign In
              </button>
              <button className={`mode-btn ${mode === 'signup' ? 'active' : ''}`} onClick={() => setMode('signup')}>
                Create Account
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {mode === 'signup' && (
                <div className="field">
                  <label>Your Name</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Enter your name" required />
                </div>
              )}
              <div className="field">
                <label>Email Address</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
              </div>
              <div className="field" style={{ marginBottom: error ? 18 : 24 }}>
                <label>Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
              </div>

              {error && <div className="error-msg">{error}</div>}

              <button type="submit" className="submit-btn" disabled={loading}>
                <span className="btn-shimmer" />
                {loading ? (
                  <><span className="spinner" />{mode === 'login' ? 'Signing in...' : 'Creating...'}</>
                ) : (
                  mode === 'login' ? 'Enter' : 'Begin'
                )}
              </button>
            </form>

            <div className="arabic-deco">رمضان مبارك</div>
          </div>

          <div className="bottom-note">Your personal prayer & fasting tracker</div>
        </div>
      </div>
    </>
  )
}

function Stars() {
  const [stars, setStars] = useState<Array<{
    id: number; x: number; y: number; size: number;
    dur: string; delay: string; minOp: string; maxOp: string;
  }>>([])

  useEffect(() => {
    setStars(Array.from({ length: 80 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 1.8 + 0.4,
      dur: (Math.random() * 3 + 2).toFixed(1),
      delay: (Math.random() * 4).toFixed(1),
      minOp: (Math.random() * 0.2 + 0.05).toFixed(2),
      maxOp: (Math.random() * 0.5 + 0.3).toFixed(2),
    })))
  }, [])

  return (
    <div className="stars">
      {stars.map(s => (
        <div key={s.id} className="star" style={{
          left: `${s.x}%`, top: `${s.y}%`,
          width: s.size, height: s.size,
          '--dur': `${s.dur}s`, '--delay': `${s.delay}s`,
          '--min-op': s.minOp, '--max-op': s.maxOp,
        } as React.CSSProperties} />
      ))}
    </div>
  )
}