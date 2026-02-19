'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { UserSettings } from '@/types'

interface Props {
  userId: string
  onComplete: (settings: UserSettings) => void
}

export default function LocationSetup({ userId, onComplete }: Props) {
  const [step, setStep] = useState<'ask' | 'locating' | 'confirming' | 'manual' | 'searching'>('ask')
  const [error, setError] = useState('')
  const [manualCity, setManualCity] = useState('')
  const [detected, setDetected] = useState<{ lat: number; lon: number; city: string; tz: string } | null>(null)

  const supabase = createClient()

  async function saveAndComplete(lat: number, lon: number, city: string, tz: string) {
    const settings = {
      id: userId,
      city_name: city,
      latitude: lat,
      longitude: lon,
      timezone: tz,
      updated_at: new Date().toISOString(),
    }
    await supabase.from('user_settings').upsert(
      { id: userId, city_name: city, latitude: lat, longitude: lon, timezone: tz },
      { onConflict: 'id' }
    )
    onComplete(settings)
  }

  async function handleGPS() {
    setStep('locating')
    setError('')

    if (!navigator.geolocation) {
      setError('GPS not supported on this device')
      setStep('manual')
      return
    }

    navigator.geolocation.getCurrentPosition(
      async pos => {
        const { latitude, longitude } = pos.coords
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
        let city = 'My Location'

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=en`,
            { headers: { 'User-Agent': 'RamadanTracker/1.0' } }
          )
          const data = await res.json()
          city =
            data.address?.city ||
            data.address?.town ||
            data.address?.village ||
            data.address?.county ||
            data.address?.state ||
            'My Location'
        } catch {
          // keep 'My Location' as fallback
        }

        setDetected({ lat: latitude, lon: longitude, city, tz })
        setStep('confirming')
      },
      err => {
        const msg =
          err.code === 1 ? 'Location permission denied. Please enter your city manually.' :
          err.code === 2 ? 'Could not determine location. Please enter manually.' :
          'Location request timed out. Please enter manually.'
        setError(msg)
        setStep('manual')
      },
      { timeout: 15000, enableHighAccuracy: false }
    )
  }

  async function handleManualSearch() {
    if (!manualCity.trim()) return
    setStep('searching')
    setError('')

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(manualCity)}&format=json&limit=1&accept-language=en`,
        { headers: { 'User-Agent': 'RamadanTracker/1.0' } }
      )
      const data = await res.json()
      if (!data || data.length === 0) {
        setError('City not found. Try a more specific name.')
        setStep('manual')
        return
      }
      const { lat, lon } = data[0]
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
      setDetected({ lat: parseFloat(lat), lon: parseFloat(lon), city: manualCity.trim(), tz })
      setStep('confirming')
    } catch {
      setError('Search failed. Please try again.')
      setStep('manual')
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&family=Lato:wght@300;400&display=swap');
        .loc-root { min-height:100vh; background:var(--bg-root,#070c1a); display:flex; align-items:center; justify-content:center; font-family:'Lato',sans-serif; padding:20px; }
        .loc-card { width:100%; max-width:400px; background:var(--bg-panel,rgba(255,255,255,0.03)); border:1px solid var(--border-gold,rgba(196,155,74,0.15)); border-radius:24px; padding:36px 28px; text-align:center; }
        .loc-icon { font-size:40px; margin-bottom:16px; }
        .loc-title { font-family:'Cormorant Garamond',serif; font-size:26px; font-weight:300; color:var(--text-primary,#f0e6cc); margin-bottom:8px; }
        .loc-sub { font-size:12px; color:var(--text-secondary,rgba(255,255,255,0.3)); line-height:1.7; margin-bottom:24px; }
        .loc-detected { background:rgba(196,155,74,0.08); border:1px solid rgba(196,155,74,0.2); border-radius:14px; padding:16px; margin-bottom:20px; }
        .loc-detected-city { font-family:'Cormorant Garamond',serif; font-size:22px; color:var(--text-primary,#f0e6cc); margin-bottom:4px; }
        .loc-detected-coords { font-size:10px; color:var(--text-muted,rgba(255,255,255,0.25)); letter-spacing:0.05em; }
        .loc-detected-tz { font-size:11px; color:rgba(196,155,74,0.6); margin-top:4px; }
        .loc-btn { width:100%; padding:14px; background:linear-gradient(135deg,#c49b4a,#e8c97a); border:none; border-radius:12px; color:#0a0f1e; font-size:13px; font-family:'Lato',sans-serif; letter-spacing:0.1em; text-transform:uppercase; cursor:pointer; font-weight:400; margin-bottom:10px; transition:all 0.2s; box-shadow:0 4px 20px rgba(196,155,74,0.3); }
        .loc-btn:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 8px 28px rgba(196,155,74,0.4); }
        .loc-btn:disabled { opacity:0.6; cursor:not-allowed; }
        .loc-btn-ghost { width:100%; padding:12px; background:none; border:1px solid var(--border,rgba(255,255,255,0.08)); border-radius:12px; color:var(--text-secondary,rgba(255,255,255,0.35)); font-size:12px; font-family:'Lato',sans-serif; cursor:pointer; letter-spacing:0.08em; transition:all 0.2s; }
        .loc-btn-ghost:hover { border-color:var(--border-gold); color:var(--text-gold,#e8c97a); }
        .loc-input { width:100%; padding:13px 16px; background:var(--bg-input,rgba(255,255,255,0.04)); border:1px solid var(--border-input,rgba(255,255,255,0.08)); border-radius:12px; color:var(--text-primary,#f0e6cc); font-size:14px; font-family:'Lato',sans-serif; outline:none; margin-bottom:10px; transition:all 0.3s; }
        .loc-input:focus { border-color:rgba(196,155,74,0.5); box-shadow:0 0 0 3px rgba(196,155,74,0.08); }
        .loc-input::placeholder { color:var(--text-placeholder,rgba(255,255,255,0.2)); }
        .loc-error { font-size:11px; color:#f87171; margin-bottom:12px; background:rgba(248,113,113,0.08); border:1px solid rgba(248,113,113,0.15); border-radius:8px; padding:8px 12px; }
        .loc-spinner-wrap { display:flex; flex-direction:column; align-items:center; gap:14px; padding:24px 0; }
        .loc-spinner { width:36px; height:36px; border:2px solid rgba(196,155,74,0.15); border-top-color:#c49b4a; border-radius:50%; animation:spin 0.8s linear infinite; }
        @keyframes spin { to{transform:rotate(360deg);} }
        .loc-spinner-text { font-size:12px; color:var(--text-secondary,rgba(255,255,255,0.3)); letter-spacing:0.1em; }
      `}</style>

      <div className="loc-root">
        <div className="loc-card">

          {/* ASK */}
          {step === 'ask' && (
            <>
              <div className="loc-icon">📍</div>
              <div className="loc-title">Your Location</div>
              <div className="loc-sub">
                We need your location to fetch accurate prayer times for Ramadan.
                Your coordinates are only used to call the prayer times API.
              </div>
              <button className="loc-btn" onClick={handleGPS}>
                Use My GPS Location
              </button>
              <button className="loc-btn-ghost" onClick={() => setStep('manual')}>
                Enter city manually
              </button>
            </>
          )}

          {/* LOCATING */}
          {step === 'locating' && (
            <>
              <div className="loc-title">Detecting Location</div>
              <div className="loc-spinner-wrap">
                <div className="loc-spinner" />
                <div className="loc-spinner-text">Getting your coordinates...</div>
              </div>
            </>
          )}

          {/* CONFIRMING */}
          {step === 'confirming' && detected && (
            <>
              <div className="loc-icon">✓</div>
              <div className="loc-title">Location Found</div>
              <div className="loc-detected">
                <div className="loc-detected-city">{detected.city}</div>
                <div className="loc-detected-coords">
                  {detected.lat.toFixed(4)}°, {detected.lon.toFixed(4)}°
                </div>
                <div className="loc-detected-tz">{detected.tz}</div>
              </div>
              <div className="loc-sub">
                Prayer times will be fetched for this location.
              </div>
              <button
                className="loc-btn"
                onClick={() => saveAndComplete(detected.lat, detected.lon, detected.city, detected.tz)}
              >
                Confirm & Continue
              </button>
              <button className="loc-btn-ghost" onClick={() => setStep('manual')}>
                Use a different city
              </button>
            </>
          )}

          {/* MANUAL */}
          {(step === 'manual' || step === 'searching') && (
            <>
              <div className="loc-icon">🌍</div>
              <div className="loc-title">Enter Your City</div>
              <div className="loc-sub">Type your city to get accurate prayer times.</div>
              {error && <div className="loc-error">{error}</div>}
              <input
                className="loc-input"
                type="text"
                placeholder="e.g. Dubai, London, Kuala Lumpur..."
                value={manualCity}
                onChange={e => setManualCity(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleManualSearch()}
                autoFocus
              />
              <button
                className="loc-btn"
                onClick={handleManualSearch}
                disabled={step === 'searching' || !manualCity.trim()}
              >
                {step === 'searching' ? 'Searching...' : 'Find & Continue'}
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