'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { UserSettings } from '@/types'

interface Props {
  userId: string
  onComplete: (settings: UserSettings) => void
}

export default function LocationSetup({ userId, onComplete }: Props) {
  const [step, setStep] = useState<'ask' | 'loading' | 'manual' | 'done'>('ask')
  const [error, setError] = useState('')
  const [manualCity, setManualCity] = useState('')
  const [searching, setSearching] = useState(false)

  const supabase = createClient()

  async function saveSettings(lat: number, lon: number, city: string, tz: string) {
    const settings: Omit<UserSettings, 'updated_at'> = {
      id: userId,
      city_name: city,
      latitude: lat,
      longitude: lon,
      timezone: tz,
    }
    await supabase.from('user_settings').upsert(settings, { onConflict: 'id' })
    onComplete({ ...settings, updated_at: new Date().toISOString() })
  }

  async function handleGPS() {
    setStep('loading')
    if (!navigator.geolocation) {
      setError('GPS not supported on this device')
      setStep('manual')
      return
    }

    navigator.geolocation.getCurrentPosition(
      async pos => {
        const { latitude, longitude } = pos.coords
        try {
          // Reverse geocode using nominatim (free, no key)
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          )
          const data = await res.json()
          const city = data.address?.city || data.address?.town || data.address?.state || 'My Location'

          // Get timezone from browser
          const tz = Intl.DateTimeFormat().resolvedOptions().timeZone

          await saveSettings(latitude, longitude, city, tz)
        } catch {
          // fallback — save coords without city name
          const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
          await saveSettings(latitude, longitude, 'My Location', tz)
        }
      },
      err => {
        setError('Could not get location. Please enter your city manually.')
        setStep('manual')
      },
      { timeout: 10000 }
    )
  }

  async function handleManualSearch() {
    if (!manualCity.trim()) return
    setSearching(true)
    setError('')
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(manualCity)}&format=json&limit=1`
      )
      const data = await res.json()
      if (!data || data.length === 0) {
        setError('City not found. Try a different name.')
        setSearching(false)
        return
      }
      const { lat, lon, display_name } = data[0]
      const city = manualCity.trim()
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
      await saveSettings(parseFloat(lat), parseFloat(lon), city, tz)
    } catch {
      setError('Search failed. Please try again.')
    }
    setSearching(false)
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&family=Lato:wght@300;400&display=swap');
        .loc-root {
          min-height: 100vh;
          background: var(--bg-root, #070c1a);
          display: flex; align-items: center; justify-content: center;
          font-family: 'Lato', sans-serif;
          padding: 20px;
        }
        .loc-card {
          width: 100%; max-width: 400px;
          background: var(--bg-card, rgba(255,255,255,0.03));
          border: 1px solid var(--border-gold, rgba(196,155,74,0.15));
          border-radius: 24px;
          padding: 36px 28px;
          text-align: center;
        }
        .loc-icon { font-size: 40px; margin-bottom: 16px; }
        .loc-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 26px; font-weight: 300;
          color: var(--text-primary, #f0e6cc);
          margin-bottom: 8px;
        }
        .loc-sub {
          font-size: 12px; color: var(--text-secondary, rgba(255,255,255,0.3));
          line-height: 1.6; margin-bottom: 28px; letter-spacing: 0.02em;
        }
        .loc-btn {
          width: 100%; padding: 14px;
          background: linear-gradient(135deg, #c49b4a, #e8c97a);
          border: none; border-radius: 12px;
          color: #0a0f1e; font-size: 13px;
          font-family: 'Lato', sans-serif;
          letter-spacing: 0.1em; text-transform: uppercase;
          cursor: pointer; font-weight: 400;
          margin-bottom: 10px;
          transition: all 0.2s;
          box-shadow: 0 4px 20px rgba(196,155,74,0.3);
        }
        .loc-btn:hover { transform: translateY(-1px); box-shadow: 0 8px 28px rgba(196,155,74,0.4); }
        .loc-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
        .loc-btn-ghost {
          width: 100%; padding: 12px;
          background: none;
          border: 1px solid var(--border, rgba(255,255,255,0.08));
          border-radius: 12px;
          color: var(--text-secondary, rgba(255,255,255,0.35));
          font-size: 12px; font-family: 'Lato', sans-serif;
          cursor: pointer; letter-spacing: 0.08em;
          transition: all 0.2s;
        }
        .loc-btn-ghost:hover { border-color: var(--border-gold); color: var(--text-gold, #e8c97a); }
        .loc-input {
          width: 100%; padding: 13px 16px;
          background: var(--bg-input, rgba(255,255,255,0.04));
          border: 1px solid var(--border-input, rgba(255,255,255,0.08));
          border-radius: 12px;
          color: var(--text-primary, #f0e6cc);
          font-size: 14px; font-family: 'Lato', sans-serif;
          outline: none; margin-bottom: 10px;
          transition: all 0.3s;
        }
        .loc-input:focus {
          border-color: rgba(196,155,74,0.5);
          box-shadow: 0 0 0 3px rgba(196,155,74,0.08);
        }
        .loc-input::placeholder { color: var(--text-placeholder, rgba(255,255,255,0.2)); }
        .loc-error {
          font-size: 11px; color: #f87171;
          margin-bottom: 12px; text-align: center;
        }
        .loc-loading {
          display: flex; flex-direction: column;
          align-items: center; gap: 14px;
          padding: 20px 0;
        }
        .loc-spinner {
          width: 36px; height: 36px;
          border: 2px solid rgba(196,155,74,0.2);
          border-top-color: #c49b4a;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .loc-loading-text {
          font-size: 12px; color: var(--text-secondary, rgba(255,255,255,0.3));
          letter-spacing: 0.1em;
        }
      `}</style>

      <div className="loc-root">
        <div className="loc-card">
          {step === 'ask' && (
            <>
              <div className="loc-icon">📍</div>
              <div className="loc-title">Your Location</div>
              <div className="loc-sub">
                We need your location to fetch accurate prayer times.<br />
                Your location is only used to get prayer times — nothing else.
              </div>
              <button className="loc-btn" onClick={handleGPS}>
                Use My GPS Location
              </button>
              <button className="loc-btn-ghost" onClick={() => setStep('manual')}>
                Enter city manually instead
              </button>
            </>
          )}

          {step === 'loading' && (
            <>
              <div className="loc-title">Detecting Location</div>
              <div className="loc-loading">
                <div className="loc-spinner" />
                <div className="loc-loading-text">Getting your coordinates...</div>
              </div>
            </>
          )}

          {step === 'manual' && (
            <>
              <div className="loc-icon">🌍</div>
              <div className="loc-title">Enter Your City</div>
              <div className="loc-sub">Type your city name to get accurate prayer times.</div>
              {error && <div className="loc-error">{error}</div>}
              <input
                className="loc-input"
                type="text"
                placeholder="e.g. Dubai, Kuala Lumpur, London..."
                value={manualCity}
                onChange={e => setManualCity(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleManualSearch()}
                autoFocus
              />
              <button className="loc-btn" onClick={handleManualSearch} disabled={searching || !manualCity.trim()}>
                {searching ? 'Searching...' : 'Set Location'}
              </button>
              <button className="loc-btn-ghost" onClick={() => setStep('ask')}>
                ← Back
              </button>
            </>
          )}
        </div>
      </div>
    </>
  )
}