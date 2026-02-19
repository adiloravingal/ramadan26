'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth, useRamadanData } from '@/lib/hooks'
import Link from 'next/link'
import { DayStatus, QazaSummary } from '@/types'
import { dayCalendarStatus } from '@/lib/prayerUtils'

const PRAYERS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const
type PrayerKey = typeof PRAYERS[number] | 'fast'

export default function DashboardPage() {
  const { userId, userName, authLoading, signOut } = useAuth()
  const { dayStatuses, qaza, config, loading, togglePrayer } = useRamadanData(userId)
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [expandedQaza, setExpandedQaza] = useState<PrayerKey | null>(null)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [celebrating, setCelebrating] = useState<string | null>(null)

  useEffect(() => { if (!authLoading && !userId) router.push('/login') }, [authLoading, userId])
  useEffect(() => { if (!loading) setTimeout(() => setMounted(true), 80) }, [loading])

  const today = dayStatuses.find(d => d.isToday)
  const todayDone = today ? PRAYERS.filter(p => today.prayers[p] === 'done').length : 0

  const handleToggle = async (key: PrayerKey, dayNumber: number, date: string, currentDone: boolean) => {
    await togglePrayer(dayNumber, date, key, currentDone)
    if (!currentDone) {
      setCelebrating(`${dayNumber}-${key}`)
      setTimeout(() => setCelebrating(null), 800)
    }
  }

  const getMissedDaysForPrayer = (key: PrayerKey) =>
    dayStatuses.filter(d =>
      key === 'fast' ? d.fast === 'missed' : d.prayers[key as typeof PRAYERS[number]] === 'missed'
    )

  if (authLoading || loading) return <LoadingScreen />

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Lato:wght@300;400;700&display=swap');
        * { box-sizing: border-box; }

        .db { min-height: 100vh; background: #070c1a; font-family: 'Lato', sans-serif; color: #f0e6cc; padding-bottom: 60px; }

        /* Header */
        .hdr { display:flex; align-items:center; justify-content:space-between; padding:18px 20px; border-bottom:1px solid rgba(196,155,74,0.1); background:rgba(7,12,26,0.95); backdrop-filter:blur(20px); position:sticky; top:0; z-index:100; }
        .hdr-left { display:flex; align-items:center; gap:10px; }
        .hdr-moon { width:26px; height:26px; filter:drop-shadow(0 0 8px rgba(196,155,74,0.6)); }
        .hdr-name { font-family:'Cormorant Garamond',serif; font-size:17px; color:#e8c97a; }
        .hdr-sub { font-size:10px; color:rgba(255,255,255,0.25); letter-spacing:0.06em; }
        .hdr-out { font-size:11px; color:rgba(196,155,74,0.35); background:none; border:1px solid rgba(196,155,74,0.12); padding:5px 11px; border-radius:8px; cursor:pointer; font-family:'Lato',sans-serif; transition:all 0.2s; }
        .hdr-out:hover { color:#e8c97a; border-color:rgba(196,155,74,0.4); }

        .main { max-width:460px; margin:0 auto; padding:20px 16px; }

        /* fade up */
        .fu { opacity:0; transform:translateY(18px); transition:opacity 0.6s cubic-bezier(0.16,1,0.3,1), transform 0.6s cubic-bezier(0.16,1,0.3,1); }
        .fu.show { opacity:1; transform:translateY(0); }

        /* Section label */
        .slbl { font-size:9px; letter-spacing:0.22em; text-transform:uppercase; color:rgba(196,155,74,0.4); margin-bottom:10px; margin-top:22px; }

        /* TODAY CARD */
        .today-card { background:linear-gradient(135deg,#16112a,#0e1628,#131a2e); border:1px solid rgba(196,155,74,0.18); border-radius:22px; padding:22px; margin-bottom:4px; position:relative; overflow:hidden; text-decoration:none; display:block; }
        .today-card::after { content:''; position:absolute; top:-40px; right:-40px; width:160px; height:160px; background:radial-gradient(circle,rgba(196,155,74,0.12),transparent 70%); pointer-events:none; }
        .tc-label { font-size:9px; letter-spacing:0.22em; text-transform:uppercase; color:rgba(196,155,74,0.55); margin-bottom:6px; }
        .tc-day { font-family:'Cormorant Garamond',serif; font-size:46px; font-weight:300; line-height:1; color:#f0e6cc; }
        .tc-day span { font-size:18px; color:rgba(240,230,204,0.35); font-family:'Lato',sans-serif; font-weight:300; margin-left:3px; }
        .tc-date { font-size:11px; color:rgba(255,255,255,0.28); margin-top:3px; }
        .tc-fast { position:absolute; top:20px; right:20px; font-size:10px; padding:5px 11px; border-radius:20px; letter-spacing:0.07em; }
        .tc-fast.done { background:rgba(52,211,153,0.1); color:#6ee7b7; border:1px solid rgba(52,211,153,0.18); }
        .tc-fast.pending { background:rgba(196,155,74,0.07); color:rgba(196,155,74,0.55); border:1px solid rgba(196,155,74,0.12); }
        .tc-fast.missed { background:rgba(248,113,113,0.09); color:#fca5a5; border:1px solid rgba(248,113,113,0.18); }
        .progress-bar { margin-top:18px; }
        .progress-lbl { display:flex; justify-content:space-between; font-size:10px; color:rgba(255,255,255,0.25); margin-bottom:7px; }
        .progress-track { height:3px; background:rgba(255,255,255,0.06); border-radius:3px; overflow:hidden; }
        .progress-fill { height:100%; background:linear-gradient(90deg,#c49b4a,#e8c97a); border-radius:3px; transition:width 1.2s cubic-bezier(0.16,1,0.3,1) 0.4s; box-shadow:0 0 8px rgba(196,155,74,0.4); }

        /* TODAY PRAYER TOGGLES */
        .today-prayers { margin-top:14px; display:flex; flex-direction:column; gap:7px; }
        .tp-row { display:flex; align-items:center; padding:12px 14px; border-radius:14px; border:1px solid rgba(255,255,255,0.04); background:rgba(255,255,255,0.02); transition:all 0.2s; cursor:pointer; user-select:none; position:relative; overflow:hidden; }
        .tp-row:hover { border-color:rgba(196,155,74,0.15); }
        .tp-row.done { background:rgba(52,211,153,0.06); border-color:rgba(52,211,153,0.14); }
        .tp-row.missed { background:rgba(248,113,113,0.04); border-color:rgba(248,113,113,0.1); }
        .tp-celebrate { position:absolute; inset:0; background:radial-gradient(circle at center, rgba(52,211,153,0.25), transparent 70%); animation:celebPulse 0.7s ease-out forwards; pointer-events:none; }
        @keyframes celebPulse { 0%{opacity:1;transform:scale(0.8);} 100%{opacity:0;transform:scale(1.5);} }
        .tp-icon { font-size:16px; width:28px; text-align:center; flex-shrink:0; }
        .tp-info { flex:1; padding:0 10px; }
        .tp-name { font-size:13px; color:#f0e6cc; display:flex; align-items:center; gap:7px; }
        .tp-arabic { font-size:12px; color:rgba(196,155,74,0.35); font-family:serif; }
        .tp-time { font-size:10px; color:rgba(255,255,255,0.22); margin-top:2px; }
        .tp-time .qtag { color:#f87171; margin-left:5px; }
        .tgl { width:44px; height:24px; border-radius:12px; position:relative; border:none; cursor:pointer; transition:background 0.25s; flex-shrink:0; }
        .tgl.off { background:rgba(255,255,255,0.07); }
        .tgl.on { background:linear-gradient(135deg,#34d399,#10b981); box-shadow:0 0 10px rgba(52,211,153,0.35); }
        .tgl-k { position:absolute; top:3px; width:18px; height:18px; background:white; border-radius:50%; transition:left 0.28s cubic-bezier(0.34,1.56,0.64,1); box-shadow:0 2px 5px rgba(0,0,0,0.25); }
        .tgl.off .tgl-k { left:3px; }
        .tgl.on .tgl-k { left:23px; }

        /* QAZA SECTION */
        .qaza-wrap { display:flex; flex-direction:column; gap:8px; }
        .all-clear { display:flex; align-items:center; gap:8px; padding:14px 18px; background:rgba(52,211,153,0.06); border:1px solid rgba(52,211,153,0.12); border-radius:16px; font-size:13px; color:#6ee7b7; }

        .qaza-item { border-radius:16px; border:1px solid rgba(248,113,113,0.14); background:rgba(248,113,113,0.04); overflow:hidden; }
        .qaza-header { display:flex; align-items:center; justify-content:space-between; padding:14px 16px; cursor:pointer; transition:background 0.2s; }
        .qaza-header:hover { background:rgba(248,113,113,0.05); }
        .qaza-header-left { display:flex; align-items:center; gap:10px; }
        .qaza-icon { font-size:16px; }
        .qaza-label { font-size:13px; color:#f0e6cc; }
        .qaza-arabic { font-size:12px; color:rgba(196,155,74,0.35); font-family:serif; margin-left:6px; }
        .qaza-count-badge { font-family:'Cormorant Garamond',serif; font-size:22px; color:#f87171; display:flex; align-items:center; gap:8px; }
        .qaza-chevron { font-size:10px; color:rgba(255,255,255,0.25); transition:transform 0.3s; }
        .qaza-chevron.open { transform:rotate(180deg); }

        /* Expanded days list */
        .qaza-days { border-top:1px solid rgba(248,113,113,0.1); }
        .qaza-day-row { display:flex; align-items:center; justify-content:space-between; padding:11px 16px; border-bottom:1px solid rgba(255,255,255,0.03); transition:background 0.15s; cursor:pointer; }
        .qaza-day-row:last-child { border-bottom:none; }
        .qaza-day-row:hover { background:rgba(255,255,255,0.02); }
        .qaza-day-row.done { background:rgba(52,211,153,0.04); }
        .qd-info { display:flex; flex-direction:column; gap:2px; }
        .qd-day { font-size:12px; color:#f0e6cc; }
        .qd-date { font-size:10px; color:rgba(255,255,255,0.22); }
        .qd-celebrate { position:absolute; inset:0; background:radial-gradient(circle at center, rgba(52,211,153,0.3), transparent 70%); animation:celebPulse 0.7s ease-out forwards; pointer-events:none; }

        /* DATE PICKER */
        .dp-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.7); z-index:200; display:flex; align-items:flex-end; justify-content:center; animation:fadeIn 0.2s; }
        @keyframes fadeIn { from{opacity:0;} to{opacity:1;} }
        .dp-sheet { background:#0e1628; border:1px solid rgba(196,155,74,0.15); border-radius:24px 24px 0 0; width:100%; max-width:480px; max-height:70vh; overflow:hidden; display:flex; flex-direction:column; animation:slideUp 0.3s cubic-bezier(0.16,1,0.3,1); }
        @keyframes slideUp { from{transform:translateY(100%);} to{transform:translateY(0);} }
        .dp-handle { width:36px; height:4px; background:rgba(255,255,255,0.12); border-radius:2px; margin:12px auto 16px; }
        .dp-title { font-family:'Cormorant Garamond',serif; font-size:18px; color:#e8c97a; text-align:center; margin-bottom:16px; }
        .dp-list { overflow-y:auto; padding:0 16px 24px; display:flex; flex-direction:column; gap:6px; }
        .dp-row { display:flex; align-items:center; justify-content:space-between; padding:13px 16px; border-radius:14px; background:rgba(255,255,255,0.025); border:1px solid rgba(255,255,255,0.05); text-decoration:none; transition:all 0.2s; }
        .dp-row:hover { border-color:rgba(196,155,74,0.2); background:rgba(196,155,74,0.05); }
        .dp-row.is-today { border-color:rgba(196,155,74,0.3); box-shadow:0 0 12px rgba(196,155,74,0.1); }
        .dp-left { display:flex; align-items:center; gap:10px; }
        .dp-daynum { font-family:'Cormorant Garamond',serif; font-size:22px; color:#f0e6cc; width:32px; }
        .dp-datestr { font-size:11px; color:rgba(255,255,255,0.35); }
        .dp-status { display:flex; gap:4px; }
        .dp-dot { width:6px; height:6px; border-radius:50%; }

        /* Date picker button */
        .dp-btn { display:flex; align-items:center; justify-content:center; gap:8px; width:100%; padding:13px; background:rgba(255,255,255,0.03); border:1px solid rgba(196,155,74,0.12); border-radius:14px; color:rgba(196,155,74,0.6); font-size:12px; font-family:'Lato',sans-serif; letter-spacing:0.1em; cursor:pointer; transition:all 0.2s; margin-top:8px; }
        .dp-btn:hover { background:rgba(196,155,74,0.06); border-color:rgba(196,155,74,0.25); color:#e8c97a; }
      `}</style>

      <div className="db">
        <header className="hdr">
          <div className="hdr-left">
            <svg className="hdr-moon" viewBox="0 0 32 32" fill="none">
              <path d="M16 4C9.373 4 4 9.373 4 16s5.373 12 12 12c2.085 0 4.044-.533 5.75-1.47C17.43 25.849 14 21.84 14 17c0-4.84 3.43-8.849 7.75-9.53A11.95 11.95 0 0016 4z" fill="url(#hg)"/>
              <defs><linearGradient id="hg" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse"><stop stopColor="#e8c97a"/><stop offset="1" stopColor="#c49b4a"/></linearGradient></defs>
            </svg>
            <div>
              <div className="hdr-name">Ramadan Tracker</div>
              <div className="hdr-sub">Assalamu Alaikum, {userName || 'Friend'}</div>
            </div>
          </div>
          <button className="hdr-out" onClick={signOut}>Sign out</button>
        </header>

        <main className="main">

          {/* TODAY */}
          {today && (
            <div className={`fu ${mounted ? 'show' : ''}`} style={{ transitionDelay: '0.05s' }}>
              <div className="slbl">Today</div>
              <div className="today-card">
                <div className="tc-label">Ramadan 1446H</div>
                <div className="tc-day">Day {today.dayNumber}<span>of {config?.total_days ?? 30}</span></div>
                <div className="tc-date">{formatDate(today.date)}</div>
                <div className={`tc-fast ${today.fast}`}>
                  {today.fast === 'done' ? '✓ Fasting' : today.fast === 'missed' ? 'Fast missed' : 'Fasting'}
                </div>
                <div className="progress-bar">
                  <div className="progress-lbl"><span>Prayers</span><span>{todayDone}/5</span></div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: mounted ? `${(todayDone/5)*100}%` : '0%' }} />
                  </div>
                </div>
              </div>

              {/* Today's prayer toggles */}
              <div className="today-prayers">
                {PRAYERS.map((key, i) => {
                  const status = today.prayers[key]
                  const isDone = status === 'done'
                  const isMissed = status === 'missed'
                  const celebKey = `${today.dayNumber}-${key}`
                  return (
                    <div
                      key={key}
                      className={`tp-row ${isDone ? 'done' : isMissed ? 'missed' : ''} fu ${mounted ? 'show' : ''}`}
                      style={{ transitionDelay: `${0.12 + i * 0.05}s` }}
                      onClick={() => handleToggle(key, today.dayNumber, today.date, isDone)}
                    >
                      {celebrating === celebKey && <div className="tp-celebrate" />}
                      <div className="tp-icon">{PRAYER_ICONS[key]}</div>
                      <div className="tp-info">
                        <div className="tp-name">{capitalize(key)}<span className="tp-arabic">{PRAYER_ARABIC[key]}</span></div>
                        <div className="tp-time">
                          ends {formatTime(today.prayerTime[`${key}_end` as keyof typeof today.prayerTime] as string)}
                          {isMissed && <span className="qaza-tag">· Qaza</span>}
                        </div>
                      </div>
                      <button className={`tgl ${isDone ? 'on' : 'off'}`} onClick={e => { e.stopPropagation(); handleToggle(key, today.dayNumber, today.date, isDone) }}>
                        <div className="tgl-k" />
                      </button>
                    </div>
                  )
                })}

                {/* Fast toggle */}
                {(() => {
                  const isDone = today.fast === 'done'
                  const isMissed = today.fast === 'missed'
                  const celebKey = `${today.dayNumber}-fast`
                  return (
                    <div
                      className={`tp-row ${isDone ? 'done' : isMissed ? 'missed' : ''} fu ${mounted ? 'show' : ''}`}
                      style={{ transitionDelay: '0.37s' }}
                      onClick={() => handleToggle('fast', today.dayNumber, today.date, isDone)}
                    >
                      {celebrating === celebKey && <div className="tp-celebrate" />}
                      <div className="tp-icon">🌙</div>
                      <div className="tp-info">
                        <div className="tp-name">Fasting<span className="tp-arabic">صوم</span></div>
                        <div className="tp-time">after Isha · {formatTime(today.prayerTime.isha_end)}</div>
                      </div>
                      <button className={`tgl ${isDone ? 'on' : 'off'}`} onClick={e => { e.stopPropagation(); handleToggle('fast', today.dayNumber, today.date, isDone) }}>
                        <div className="tgl-k" />
                      </button>
                    </div>
                  )
                })()}
              </div>
            </div>
          )}

          {/* QAZA SUMMARY */}
          {qaza && (
            <div className={`fu ${mounted ? 'show' : ''}`} style={{ transitionDelay: '0.2s' }}>
              <div className="slbl">Qaza</div>
              <QazaSection
                qaza={qaza}
                dayStatuses={dayStatuses}
                expandedQaza={expandedQaza}
                setExpandedQaza={setExpandedQaza}
                celebrating={celebrating}
                onToggle={handleToggle}
              />
            </div>
          )}

          {/* DATE PICKER BUTTON */}
          <div className={`fu ${mounted ? 'show' : ''}`} style={{ transitionDelay: '0.3s' }}>
            <button className="dp-btn" onClick={() => setShowDatePicker(true)}>
              <span>☽</span> Browse All Days
            </button>
          </div>

        </main>
      </div>

      {/* DATE PICKER SHEET */}
      {showDatePicker && (
        <DatePickerSheet
          dayStatuses={dayStatuses}
          onClose={() => setShowDatePicker(false)}
        />
      )}
    </>
  )
}

function QazaSection({ qaza, dayStatuses, expandedQaza, setExpandedQaza, celebrating, onToggle }: {
  qaza: QazaSummary
  dayStatuses: DayStatus[]
  expandedQaza: PrayerKey | null
  setExpandedQaza: (k: PrayerKey | null) => void
  celebrating: string | null
  onToggle: (key: PrayerKey, dayNumber: number, date: string, currentDone: boolean) => void
}) {
  const totalMissed = qaza.total_prayers + qaza.fast
  if (totalMissed === 0) {
    return (
      <div className="qaza-wrap">
        <div className="all-clear">
          <span style={{ fontSize: 18 }}>✦</span>
          <span>All prayers and fasts are complete — MashaAllah!</span>
        </div>
      </div>
    )
  }

const allItems = [
    { key: 'fajr' as PrayerKey,    label: 'Fajr',    arabic: 'الفجر', icon: '🌙', count: qaza.fajr },
    { key: 'dhuhr' as PrayerKey,   label: 'Dhuhr',   arabic: 'الظهر', icon: '☀️', count: qaza.dhuhr },
    { key: 'asr' as PrayerKey,     label: 'Asr',     arabic: 'العصر', icon: '🌤', count: qaza.asr },
    { key: 'maghrib' as PrayerKey, label: 'Maghrib', arabic: 'المغرب', icon: '🌅', count: qaza.maghrib },
    { key: 'isha' as PrayerKey,    label: 'Isha',    arabic: 'العشاء', icon: '✨', count: qaza.isha },
    { key: 'fast' as PrayerKey,    label: 'Fasting', arabic: 'صوم',    icon: '🌙', count: qaza.fast },
  ]
  const items = allItems.filter(i => i.count > 0)

  return (
    <div className="qaza-wrap">
      {items.map(item => {
        const isOpen = expandedQaza === item.key
        const missedDays = dayStatuses.filter(d =>
          item.key === 'fast' ? d.fast === 'missed' : d.prayers[item.key as typeof PRAYERS[number]] === 'missed'
        )
        // also include 'done' ones that were previously missed (for toggling back)
        const allRelevantDays = dayStatuses.filter(d =>
          item.key === 'fast'
            ? d.fast === 'missed' || d.fast === 'done'
            : (d.prayers[item.key as typeof PRAYERS[number]] === 'missed' || d.prayers[item.key as typeof PRAYERS[number]] === 'done')
        ).filter(d => d.isPast || d.isToday)

        return (
          <div key={item.key} className="qaza-item">
            <div className="qaza-header" onClick={() => setExpandedQaza(isOpen ? null : item.key)}>
              <div className="qaza-header-left">
                <span className="qaza-icon">{item.icon}</span>
                <span className="qaza-label">{item.label}<span className="qaza-arabic">{item.arabic}</span></span>
              </div>
              <div className="qaza-count-badge">
                <span>{item.count} missed</span>
                <span className={`qaza-chevron ${isOpen ? 'open' : ''}`}>▼</span>
              </div>
            </div>

            {isOpen && (
              <div className="qaza-days">
                {missedDays.map(day => {
                  const isDone = item.key === 'fast'
                    ? day.fast === 'done'
                    : day.prayers[item.key as typeof PRAYERS[number]] === 'done'
                  const celebKey = `${day.dayNumber}-${item.key}`
                  return (
                    <div
                      key={day.dayNumber}
                      className={`qaza-day-row ${isDone ? 'done' : ''}`}
                      style={{ position: 'relative' }}
                      onClick={() => onToggle(item.key, day.dayNumber, day.date, isDone)}
                    >
                      {celebrating === celebKey && <div className="qd-celebrate" />}
                      <div className="qd-info">
                        <div className="qd-day">Day {day.dayNumber}</div>
                        <div className="qd-date">{formatDate(day.date)}</div>
                      </div>
                      <button className={`tgl ${isDone ? 'on' : 'off'}`} onClick={e => { e.stopPropagation(); onToggle(item.key, day.dayNumber, day.date, isDone) }}>
                        <div className="tgl-k" />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function DatePickerSheet({ dayStatuses, onClose }: { dayStatuses: DayStatus[], onClose: () => void }) {
  const router = useRouter()

  const getStatusDots = (day: DayStatus) => {
    const prayers = ['fajr','dhuhr','asr','maghrib','isha'] as const
    return prayers.map(p => {
      const s = day.prayers[p]
      return s === 'done' ? '#6ee7b7' : s === 'missed' ? '#f87171' : 'rgba(255,255,255,0.12)'
    })
  }

  return (
    <div className="dp-overlay" onClick={onClose}>
      <div className="dp-sheet" onClick={e => e.stopPropagation()}>
        <div className="dp-handle" />
        <div className="dp-title">Browse Days</div>
        <div className="dp-list">
          {dayStatuses.map(day => {
            const dots = getStatusDots(day)
            return (
              <Link
                key={day.dayNumber}
                href={`/day/${day.dayNumber}`}
                className={`dp-row ${day.isToday ? 'is-today' : ''}`}
                onClick={onClose}
              >
                <div className="dp-left">
                  <div className="dp-daynum">{day.dayNumber}</div>
                  <div>
                    <div style={{ fontSize: 12, color: day.isToday ? '#e8c97a' : '#f0e6cc' }}>
                      {day.isToday ? 'Today' : day.isFuture ? 'Upcoming' : `Day ${day.dayNumber}`}
                    </div>
                    <div className="dp-datestr">{formatDate(day.date)}</div>
                  </div>
                </div>
                <div className="dp-status">
                  {dots.map((color, i) => (
                    <div key={i} className="dp-dot" style={{ background: color }} />
                  ))}
                  <div className="dp-dot" style={{ background: day.fast === 'done' ? '#6ee7b7' : day.fast === 'missed' ? '#f87171' : 'rgba(255,255,255,0.12)', borderRadius: '3px' }} />
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function LoadingScreen() {
  return (
    <div style={{ minHeight:'100vh', background:'#070c1a', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:16 }}>
      <svg style={{ width:36, height:36, filter:'drop-shadow(0 0 16px rgba(196,155,74,0.7))' }} viewBox="0 0 32 32" fill="none">
        <path d="M16 4C9.373 4 4 9.373 4 16s5.373 12 12 12c2.085 0 4.044-.533 5.75-1.47C17.43 25.849 14 21.84 14 17c0-4.84 3.43-8.849 7.75-9.53A11.95 11.95 0 0016 4z" fill="#c49b4a"/>
      </svg>
      <div style={{ color:'rgba(196,155,74,0.5)', fontFamily:'serif', fontSize:13, letterSpacing:'0.15em' }}>Loading</div>
    </div>
  )
}

const PRAYER_ICONS: Record<string, string> = { fajr:'🌙', dhuhr:'☀️', asr:'🌤', maghrib:'🌅', isha:'✨' }
const PRAYER_ARABIC: Record<string, string> = { fajr:'الفجر', dhuhr:'الظهر', asr:'العصر', maghrib:'المغرب', isha:'العشاء' }
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
}
function formatTime(t: string) {
  const [h, m] = t.split(':').map(Number)
  return `${h % 12 || 12}:${m.toString().padStart(2,'0')} ${h >= 12 ? 'PM' : 'AM'}`
}
