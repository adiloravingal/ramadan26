'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth, useRamadanData } from '@/lib/hooks'
import { Prayer } from '@/types'
import Link from 'next/link'

const PRAYERS: { key: Prayer; label: string; arabic: string; time: string }[] = [
  { key: 'fajr',    label: 'Fajr',    arabic: 'الفجر', time: 'dawn' },
  { key: 'dhuhr',   label: 'Dhuhr',   arabic: 'الظهر', time: 'noon' },
  { key: 'asr',     label: 'Asr',     arabic: 'العصر', time: 'afternoon' },
  { key: 'maghrib', label: 'Maghrib', arabic: 'المغرب', time: 'sunset' },
  { key: 'isha',    label: 'Isha',    arabic: 'العشاء', time: 'night' },
]

const PRAYER_ICONS: Record<string, string> = {
  dawn: '🌙', noon: '☀️', afternoon: '🌤', sunset: '🌅', night: '✨'
}

export default function DayPage() {
  const params = useParams()
  const dayNumber = parseInt(params.day as string)
  const { userId, authLoading } = useAuth()
  const { dayStatuses, qaza, config, loading, needsLocation, onLocationSet, togglePrayer } = useRamadanData(userId)
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [justToggled, setJustToggled] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !userId) router.push('/login')
  }, [authLoading, userId])

  useEffect(() => {
    if (!loading) setTimeout(() => setMounted(true), 60)
  }, [loading])

  const day = dayStatuses.find(d => d.dayNumber === dayNumber)

  const handleToggle = async (key: Prayer | 'fast', currentDone: boolean) => {
  if (!day) return
  if (day.isFuture) return  // ← block future days
  setJustToggled(key)
  await togglePrayer(day.dayNumber, day.date, key, currentDone)
  setTimeout(() => setJustToggled(null), 600)
}

  if (authLoading || loading) return (
    <div style={{ minHeight: '100vh', background: '#070c1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: 'rgba(196,155,74,0.5)', fontFamily: 'serif', fontSize: 14, letterSpacing: '0.1em' }}>Loading...</div>
    </div>
  )

  if (!day) return (
    <div style={{ minHeight: '100vh', background: '#070c1a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
      <p style={{ color: 'var(--text-secondary)', fontFamily: 'sans-serif' }}>Day not found</p>
      <Link href="/dashboard" style={{ color: '#c49b4a', fontSize: 13 }}>← Back</Link>
    </div>
  )

  const formatTime = (t: string) => {
    const [h, m] = t.split(':').map(Number)
    return `${h % 12 || 12}:${m.toString().padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
  }

  const endTimes: Record<Prayer, string> = {
    fajr: day.prayerTime.fajr_end,
    dhuhr: day.prayerTime.dhuhr_end,
    asr: day.prayerTime.asr_end,
    maghrib: day.prayerTime.maghrib_end,
    isha: day.prayerTime.isha_end,
  }

  const donePrayers = PRAYERS.filter(p => day.prayers[p.key] === 'done').length

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Lato:wght@300;400&display=swap');
        * { box-sizing: border-box; }

        .day-root { min-height: 100vh; background: var(--bg-root); font-family: 'Lato', sans-serif; color: var(--text-primary); padding-bottom: 60px; }

        .day-header { display: flex; align-items: center; padding: 20px 20px 16px; border-bottom: 1px solid rgba(196,155,74,0.1); background: rgba(7,12,26,0.95); backdrop-filter: blur(20px); position: sticky; top: 0; z-index: 50; gap: 14px; }
        .back-btn { width: 36px; height: 36px; border-radius: 10px; background: var(--bg-input); border: 1px solid rgba(255,255,255,0.07); display: flex; align-items: center; justify-content: center; color: rgba(196,155,74,0.7); text-decoration: none; font-size: 16px; transition: all 0.2s; flex-shrink: 0; }
        .back-btn:hover { background: rgba(196,155,74,0.1); color: var(--text-gold); }
        .day-header-info { flex: 1; }
        .day-header-title { font-family: 'Cormorant Garamond', serif; font-size: 20px; font-weight: 400; color: var(--text-primary); letter-spacing: 0.02em; }
        .day-header-sub { font-size: 11px; color: rgba(255,255,255,0.25); margin-top: 1px; letter-spacing: 0.05em; }
        .today-tag { font-size: 10px; letter-spacing: 0.12em; color: #c49b4a; background: rgba(196,155,74,0.1); border: 1px solid rgba(196,155,74,0.2); padding: 4px 10px; border-radius: 20px; text-transform: uppercase; }

        .day-main { max-width: 480px; margin: 0 auto; padding: 24px 20px; }

        .hero { display: flex; flex-direction: column; align-items: center; margin-bottom: 32px; opacity: 0; transform: translateY(16px); transition: all 0.8s cubic-bezier(0.16,1,0.3,1) 0.05s; }
        .hero.show { opacity: 1; transform: translateY(0); }
        .ring-wrap { position: relative; width: 120px; height: 120px; margin-bottom: 12px; }
        .ring-svg { width: 120px; height: 120px; transform: rotate(-90deg); }
        .ring-bg { fill: none; stroke: rgba(255,255,255,0.05); stroke-width: 6; }
        .ring-fill { fill: none; stroke: url(#ringGrad); stroke-width: 6; stroke-linecap: round; stroke-dasharray: 314; stroke-dashoffset: 314; transition: stroke-dashoffset 1.2s cubic-bezier(0.16,1,0.3,1) 0.3s; }
        .ring-text { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
        .ring-count { font-family: 'Cormorant Garamond', serif; font-size: 32px; font-weight: 300; color: var(--text-primary); line-height: 1; }
        .ring-total { font-size: 11px; color: var(--text-secondary); margin-top: 2px; }
        .hero-date { font-family: 'Cormorant Garamond', serif; font-size: 16px; font-style: italic; color: rgba(240,230,204,0.4); letter-spacing: 0.03em; }

        .section-lbl { font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; color: rgba(196,155,74,0.4); margin-bottom: 12px; }

        .prayer-row { display: flex; align-items: center; padding: 16px; border-radius: 16px; margin-bottom: 8px; border: 1px solid rgba(255,255,255,0.05); background: var(--bg-card); transition: all 0.25s cubic-bezier(0.16,1,0.3,1); cursor: pointer; opacity: 0; transform: translateX(-12px); user-select: none; }
        .prayer-row.show { opacity: 1; transform: translateX(0); }
        .prayer-row:hover { border-color: rgba(196,155,74,0.2); background: rgba(196,155,74,0.04); }
        .prayer-row.is-done { background: rgba(52,211,153,0.06); border-color: rgba(52,211,153,0.15); }
        .prayer-row.is-missed { background: rgba(248,113,113,0.05); border-color: rgba(248,113,113,0.12); }
        .prayer-row.just-toggled { animation: popRow 0.4s cubic-bezier(0.34,1.56,0.64,1); }
        .future-locked { opacity: 0.4; pointer-events: none; cursor: default; }

        @keyframes popRow { 0% { transform: scale(1); } 40% { transform: scale(1.02); } 100% { transform: scale(1); } }

        .prayer-icon { font-size: 20px; width: 36px; text-align: center; flex-shrink: 0; }
        .prayer-info { flex: 1; padding: 0 12px; }
        .prayer-name { font-size: 14px; font-weight: 400; color: var(--text-primary); display: flex; align-items: center; gap: 8px; }
        .prayer-arabic { font-size: 13px; color: rgba(196,155,74,0.4); font-family: serif; }
        .prayer-meta { font-size: 11px; color: rgba(255,255,255,0.25); margin-top: 3px; letter-spacing: 0.03em; }
        .qaza-tag { color: #f87171; margin-left: 6px; }

        .toggle { width: 48px; height: 26px; border-radius: 13px; position: relative; transition: background 0.3s; flex-shrink: 0; border: none; cursor: pointer; }
        .toggle.off { background: var(--border-input); }
        .toggle.on { background: linear-gradient(135deg, #34d399, #10b981); box-shadow: 0 0 12px rgba(52,211,153,0.4); }
        .toggle-knob { position: absolute; top: 3px; width: 20px; height: 20px; background: white; border-radius: 50%; transition: left 0.3s cubic-bezier(0.34,1.56,0.64,1); box-shadow: 0 2px 6px rgba(0,0,0,0.3); }
        .toggle.off .toggle-knob { left: 3px; }
        .toggle.on .toggle-knob { left: 25px; }

        .fast-card { background: var(--bg-card); border: 1px solid rgba(255,255,255,0.05); border-radius: 20px; padding: 20px; display: flex; align-items: center; justify-content: space-between; cursor: pointer; opacity: 0; transform: translateY(12px); transition: opacity 0.6s 0.6s, transform 0.6s cubic-bezier(0.16,1,0.3,1) 0.6s, background 0.25s, border-color 0.25s; }
        .fast-card.show { opacity: 1; transform: translateY(0); }
        .fast-card:hover { border-color: rgba(196,155,74,0.2); }
        .fast-card.is-done { background: rgba(52,211,153,0.06); border-color: rgba(52,211,153,0.15); }
        .fast-card.is-missed { background: rgba(248,113,113,0.05); border-color: rgba(248,113,113,0.12); }
        .fast-card.just-toggled { animation: popRow 0.4s cubic-bezier(0.34,1.56,0.64,1); }
        .fast-left { display: flex; align-items: center; gap: 12px; }
        .fast-icon { font-size: 22px; }
        .fast-label { font-size: 15px; font-weight: 400; color: var(--text-primary); display: flex; align-items: center; gap: 8px; }
        .fast-arabic { font-size: 14px; color: rgba(196,155,74,0.4); font-family: serif; }
        .fast-sublabel { font-size: 11px; color: rgba(255,255,255,0.25); margin-top: 3px; }

        .edit-note { text-align: center; font-size: 11px; color: rgba(255,255,255,0.15); margin-top: 20px; letter-spacing: 0.05em; }
      `}</style>

      <div className="day-root">
        <header className="day-header">
          <Link href="/dashboard" className="back-btn">←</Link>
          <div className="day-header-info">
            <div className="day-header-title">Day {day.dayNumber}</div>
            <div className="day-header-sub">{formatDate(day.date)} · Ramadan 1446H</div>
          </div>
          {day.isToday && <div className="today-tag">Today</div>}
        </header>

        <main className="day-main">
          <div className={`hero ${mounted ? 'show' : ''}`}>
            <div className="ring-wrap">
              <svg className="ring-svg" viewBox="0 0 120 120">
                <defs>
                  <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#c49b4a"/>
                    <stop offset="100%" stopColor="#e8c97a"/>
                  </linearGradient>
                </defs>
                <circle className="ring-bg" cx="60" cy="60" r="50"/>
                <circle className="ring-fill" cx="60" cy="60" r="50"
                  style={{ strokeDashoffset: mounted ? 314 - (314 * donePrayers / 5) : 314 }}
                />
              </svg>
              <div className="ring-text">
                <div className="ring-count">{donePrayers}</div>
                <div className="ring-total">of 5</div>
              </div>
            </div>
            <div className="hero-date">{formatDate(day.date)}</div>
          </div>

          <div className="section-lbl">Prayers</div>
          <div style={{ marginBottom: 20 }}>
            {PRAYERS.map((prayer, i) => {
              const status = day.prayers[prayer.key]
              const isDone = status === 'done'
              const isMissed = status === 'missed'
              return (
                <div
                  key={prayer.key}
className={`tp-row ${isDone ? 'done' : isMissed ? 'missed' : ''} ${day.isFuture ? 'future-locked' : ''} ...`}                  style={{ transitionDelay: mounted ? `${0.1 + i * 0.07}s` : '0s' }}
                  onClick={() => handleToggle(prayer.key, isDone)}
                >
                  <div className="prayer-icon">{PRAYER_ICONS[prayer.time]}</div>
                  <div className="prayer-info">
                    <div className="prayer-name">
                      {prayer.label}
                      <span className="prayer-arabic">{prayer.arabic}</span>
                    </div>
                    <div className="prayer-meta">
                      ends {formatTime(endTimes[prayer.key])}
                      {isMissed && <span className="qaza-tag">· Qaza</span>}
                    </div>
                  </div>
                  <button className={`toggle ${isDone ? 'on' : 'off'}`} onClick={e => { e.stopPropagation(); handleToggle(prayer.key, isDone) }}>
                    <div className="toggle-knob" />
                  </button>
                </div>
              )
            })}
          </div>

          <div className="section-lbl">Fasting</div>
          <div
            className={`fast-card ${day.fast === 'done' ? 'is-done' : day.fast === 'missed' ? 'is-missed' : ''} ${mounted ? 'show' : ''} ${justToggled === 'fast' ? 'just-toggled' : ''}`}
            onClick={() => handleToggle('fast', day.fast === 'done')}
          >
            <div className="fast-left">
              <div className="fast-icon">🌙</div>
              <div>
                <div className="fast-label">Fasting <span className="fast-arabic">صوم</span></div>
                <div className="fast-sublabel">
                  evaluated after Isha · {formatTime(day.prayerTime.isha_end)}
                  {day.fast === 'missed' && <span style={{ color: '#f87171', marginLeft: 6 }}>· Qaza</span>}
                </div>
              </div>
            </div>
            <button className={`toggle ${day.fast === 'done' ? 'on' : 'off'}`} onClick={e => { e.stopPropagation(); handleToggle('fast', day.fast === 'done') }}>
              <div className="toggle-knob" />
            </button>
          </div>

{day.isPast && (
  <div className="edit-note">You can update this day's record anytime</div>
)}
{day.isFuture && (
  <div className="edit-note" style={{ color: 'rgba(196,155,74,0.4)' }}>
    This day hasn't arrived yet
  </div>
)}        </main>
      </div>
    </>
  )
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })
}