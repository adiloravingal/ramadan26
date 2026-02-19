'use client'

import { useState, useEffect } from 'react'

interface Props {
  userName: string
  totalDays: number
  startDate: string
  onComplete: (missedPrayers?: Record<number, string[]>) => void
}

const PRAYERS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const
const PRAYER_LABELS: Record<string, string> = {
  fajr: 'F', dhuhr: 'D', asr: 'A', maghrib: 'M', isha: 'I'
}

function toLocalDateStr(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function getPastDays(startDate: string): number[] {
  const start = new Date(startDate + 'T00:00:00')
  const today = toLocalDateStr(new Date())
  const days: number[] = []
  let i = 0
  while (true) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    const ds = toLocalDateStr(d)
    if (ds >= today) break
    days.push(i + 1)
    i++
  }
  return days
}

const INFO_STEPS = [
  {
    icon: '🌙',
    title: 'Ramadan Mubarak',
    subtitle: 'رمضان مبارك',
    body: 'Track your prayers and fasts throughout Ramadan. Simple, beautiful, private.',
  },
  {
    icon: '🕌',
    title: 'Five Prayers',
    subtitle: 'الصلوات الخمس',
    body: "Mark each prayer as you complete it. If the window passes without marking, it's automatically counted as Qaza.",
  },
  {
    icon: '📿',
    title: 'Qaza Tracker',
    subtitle: 'قضاء',
    body: 'Missed prayers appear in your Qaza summary. Tap any prayer to see which days you missed and make them up.',
  },
  {
    icon: '🌅',
    title: 'Prayer Times',
    subtitle: 'مواقيت الصلاة',
    body: 'Times are fetched automatically for your location using the Aladhan API. Accurate for wherever you are in the world.',
  },
]

export default function Onboarding({ userName, totalDays, startDate, onComplete }: Props) {
  const [step, setStep] = useState(0)
  const [animating, setAnimating] = useState(false)
  const [direction, setDirection] = useState<'in' | 'out'>('in')
  const [catchupAnswer, setCatchupAnswer] = useState<'yes' | 'no' | null>(null)

  // missedMap: dayNumber -> array of missed prayer keys (empty = all done)
  const [missedMap, setMissedMap] = useState<Record<number, string[]>>({})
  const [fastMissed, setFastMissed] = useState<number[]>([])

  const pastDays = getPastDays(startDate)
  const hasPastDays = pastDays.length > 0

  // total steps: info steps + (catchup step if past days exist) + final step
  const totalSteps = INFO_STEPS.length + (hasPastDays ? 1 : 0) + 1
  const catchupStepIndex = INFO_STEPS.length
  const finalStepIndex = hasPastDays ? INFO_STEPS.length + 1 : INFO_STEPS.length
  const isInfoStep = step < INFO_STEPS.length
  const isCatchupStep = hasPastDays && step === catchupStepIndex
  const isFinalStep = step === finalStepIndex

  function animate(next: () => void) {
    if (animating) return
    setAnimating(true)
    setDirection('out')
    setTimeout(() => {
      next()
      setDirection('in')
      setTimeout(() => setAnimating(false), 400)
    }, 280)
  }

  function goNext() {
    if (isFinalStep) {
      localStorage.setItem('onboarding_done', '1')
      // Build missed data to pass back
      onComplete(missedMap)
      return
    }
    animate(() => setStep(s => s + 1))
  }

  function goBack() {
    if (step === 0) return
    animate(() => setStep(s => s - 1))
  }

  function togglePrayerForDay(dayNum: number, prayer: string) {
    setMissedMap(prev => {
      const current = prev[dayNum] ?? []
      const has = current.includes(prayer)
      const next = has ? current.filter(p => p !== prayer) : [...current, prayer]
      return { ...prev, [dayNum]: next }
    })
  }

  function toggleFastForDay(dayNum: number) {
    setFastMissed(prev =>
      prev.includes(dayNum) ? prev.filter(d => d !== dayNum) : [...prev, dayNum]
    )
  }

  const currentInfo = isInfoStep ? INFO_STEPS[step] : null

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Lato:wght@300;400&display=swap');

        .ob-root { min-height:100vh; background:#070c1a; display:flex; flex-direction:column; align-items:center; justify-content:center; font-family:'Lato',sans-serif; padding:24px 20px; position:relative; overflow:hidden; }
        .ob-stars { position:fixed; inset:0; pointer-events:none; z-index:0;
          background-image:
            radial-gradient(1px 1px at 10% 20%, rgba(255,255,255,0.4) 0%, transparent 100%),
            radial-gradient(1.5px 1.5px at 30% 60%, rgba(255,255,255,0.3) 0%, transparent 100%),
            radial-gradient(1px 1px at 50% 10%, rgba(255,255,255,0.5) 0%, transparent 100%),
            radial-gradient(1px 1px at 70% 40%, rgba(255,255,255,0.3) 0%, transparent 100%),
            radial-gradient(1px 1px at 80% 75%, rgba(255,255,255,0.4) 0%, transparent 100%),
            radial-gradient(1.5px 1.5px at 90% 25%, rgba(255,255,255,0.5) 0%, transparent 100%),
            radial-gradient(1px 1px at 15% 85%, rgba(255,255,255,0.3) 0%, transparent 100%),
            radial-gradient(1px 1px at 55% 90%, rgba(255,255,255,0.4) 0%, transparent 100%),
            radial-gradient(1px 1px at 40% 30%, rgba(255,255,255,0.3) 0%, transparent 100%),
            radial-gradient(1px 1px at 65% 65%, rgba(255,255,255,0.4) 0%, transparent 100%);
        }
        .ob-orb { position:fixed; width:500px; height:500px; border-radius:50%; background:radial-gradient(circle,rgba(196,155,74,0.08) 0%,transparent 70%); bottom:-200px; right:-100px; pointer-events:none; z-index:0; }

        .ob-card { position:relative; z-index:1; width:100%; max-width:420px; text-align:center; }
        .ob-card-wide { max-width:520px; }

        .ob-anim { transition:opacity 0.28s ease, transform 0.28s ease; }
        .ob-anim.out { opacity:0; transform:translateY(-10px); }
        .ob-anim.in { opacity:1; transform:translateY(0); }

        .ob-icon { font-size:50px; margin-bottom:18px; display:block; }
        .ob-title { font-family:'Cormorant Garamond',serif; font-size:32px; font-weight:300; color:#f0e6cc; letter-spacing:0.02em; line-height:1.1; margin-bottom:6px; }
        .ob-subtitle { font-size:15px; color:rgba(196,155,74,0.45); font-family:serif; margin-bottom:20px; letter-spacing:0.05em; }
        .ob-divider { width:32px; height:1px; background:linear-gradient(90deg,transparent,rgba(196,155,74,0.35),transparent); margin:0 auto 20px; }
        .ob-body { font-size:13px; color:rgba(255,255,255,0.4); line-height:1.8; letter-spacing:0.02em; font-weight:300; padding:0 8px; margin-bottom:40px; }
        .ob-greeting { font-size:10px; color:rgba(196,155,74,0.4); letter-spacing:0.2em; text-transform:uppercase; margin-bottom:14px; }

        .ob-dots { display:flex; justify-content:center; gap:7px; margin-bottom:28px; }
        .ob-dot { width:5px; height:5px; border-radius:50%; background:rgba(255,255,255,0.12); transition:all 0.3s; }
        .ob-dot.active { background:#c49b4a; width:18px; border-radius:3px; box-shadow:0 0 8px rgba(196,155,74,0.4); }

        .ob-btn { width:100%; padding:14px; background:linear-gradient(135deg,#c49b4a 0%,#e8c97a 50%,#c49b4a 100%); background-size:200% 100%; border:none; border-radius:14px; color:#070c1a; font-size:12px; font-family:'Lato',sans-serif; font-weight:400; letter-spacing:0.14em; text-transform:uppercase; cursor:pointer; transition:all 0.3s; margin-bottom:10px; box-shadow:0 4px 24px rgba(196,155,74,0.3); position:relative; overflow:hidden; }
        .ob-btn:hover { transform:translateY(-1px); box-shadow:0 8px 32px rgba(196,155,74,0.45); }
        .ob-btn-ghost { width:100%; padding:10px; background:none; border:none; color:rgba(255,255,255,0.18); font-size:11px; font-family:'Lato',sans-serif; cursor:pointer; letter-spacing:0.1em; transition:color 0.2s; }
        .ob-btn-ghost:hover { color:rgba(255,255,255,0.4); }
        .ob-back { position:absolute; top:0; left:0; background:none; border:none; color:rgba(255,255,255,0.18); font-size:20px; cursor:pointer; padding:4px 8px; transition:color 0.2s; line-height:1; }
        .ob-back:hover { color:rgba(196,155,74,0.5); }

        /* CATCHUP STEP */
        .ob-catchup-q { font-family:'Cormorant Garamond',serif; font-size:22px; font-weight:300; color:#f0e6cc; margin-bottom:8px; line-height:1.3; }
        .ob-catchup-sub { font-size:12px; color:rgba(255,255,255,0.28); margin-bottom:28px; line-height:1.6; }
        .ob-yn { display:flex; gap:10px; margin-bottom:24px; }
        .ob-yn-btn { flex:1; padding:13px; border-radius:12px; border:1px solid rgba(255,255,255,0.08); background:rgba(255,255,255,0.03); color:rgba(255,255,255,0.5); font-size:13px; font-family:'Lato',sans-serif; cursor:pointer; transition:all 0.2s; letter-spacing:0.05em; }
        .ob-yn-btn.selected-yes { background:rgba(52,211,153,0.1); border-color:rgba(52,211,153,0.3); color:#6ee7b7; }
        .ob-yn-btn.selected-no { background:rgba(196,155,74,0.08); border-color:rgba(196,155,74,0.2); color:#e8c97a; }

        /* Day grid */
        .ob-days-wrap { max-height:320px; overflow-y:auto; margin-bottom:20px; padding-right:4px; }
        .ob-days-wrap::-webkit-scrollbar { width:3px; }
        .ob-days-wrap::-webkit-scrollbar-track { background:transparent; }
        .ob-days-wrap::-webkit-scrollbar-thumb { background:rgba(196,155,74,0.2); border-radius:2px; }

        .ob-day-row { display:flex; align-items:center; padding:10px 14px; border-radius:12px; border:1px solid rgba(255,255,255,0.04); background:rgba(255,255,255,0.02); margin-bottom:6px; gap:10px; }
        .ob-day-num { font-family:'Cormorant Garamond',serif; font-size:18px; color:rgba(196,155,74,0.7); width:42px; flex-shrink:0; text-align:left; }
        .ob-day-date { font-size:10px; color:rgba(255,255,255,0.2); flex:1; text-align:left; letter-spacing:0.03em; }
        .ob-prayer-squares { display:flex; gap:4px; }
        .ob-sq { width:28px; height:28px; border-radius:7px; border:1px solid rgba(255,255,255,0.08); background:rgba(255,255,255,0.03); display:flex; align-items:center; justify-content:center; font-size:9px; color:rgba(255,255,255,0.25); cursor:pointer; transition:all 0.15s; letter-spacing:0; font-weight:400; font-family:'Lato',sans-serif; }
        .ob-sq.done { background:rgba(52,211,153,0.12); border-color:rgba(52,211,153,0.25); color:#6ee7b7; }
        .ob-sq.fast { border-radius:50%; }
        .ob-sq.fast.done { background:rgba(196,155,74,0.12); border-color:rgba(196,155,74,0.25); color:#e8c97a; }
        .ob-sq:hover { border-color:rgba(255,255,255,0.2); }

        .ob-legend { display:flex; gap:16px; justify-content:center; margin-bottom:14px; }
        .ob-legend-item { display:flex; align-items:center; gap:5px; font-size:10px; color:rgba(255,255,255,0.25); letter-spacing:0.05em; }
        .ob-legend-sq { width:10px; height:10px; border-radius:3px; }
        .ob-legend-circle { width:10px; height:10px; border-radius:50%; }

        .ob-select-all { font-size:10px; color:rgba(196,155,74,0.4); background:none; border:none; cursor:pointer; letter-spacing:0.08em; margin-bottom:12px; font-family:'Lato',sans-serif; transition:color 0.2s; }
        .ob-select-all:hover { color:rgba(196,155,74,0.7); }
      `}</style>

      <div className="ob-root">
        <div className="ob-stars" />
        <div className="ob-orb" />

        <div className={`ob-card ${isCatchupStep ? 'ob-card-wide' : ''}`}>
          {step > 0 && (
            <button className="ob-back" onClick={goBack}>←</button>
          )}

          <div className={`ob-anim ${direction}`}>

            {/* INFO STEPS */}
            {isInfoStep && currentInfo && (
              <>
                {step === 0 && userName && (
                  <div className="ob-greeting">Welcome, {userName}</div>
                )}
                <span className="ob-icon">{currentInfo.icon}</span>
                <div className="ob-title">{currentInfo.title}</div>
                <div className="ob-subtitle">{currentInfo.subtitle}</div>
                <div className="ob-divider" />
                <div className="ob-body">{currentInfo.body}</div>
              </>
            )}

            {/* CATCHUP STEP */}
            {isCatchupStep && (
              <>
                <span className="ob-icon">📅</span>
                <div className="ob-catchup-q">
                  Ramadan started {pastDays.length} day{pastDays.length > 1 ? 's' : ''} ago.
                  <br />Did you complete all prayers and fasts?
                </div>
                <div className="ob-catchup-sub">
                  Tap the squares to mark what you completed. Green = done.<br />
                  You can always edit this later.
                </div>

                {catchupAnswer === null && (
                  <div className="ob-yn">
                    <button
                      className="ob-yn-btn"
                      onClick={() => {
                        setCatchupAnswer('yes')
                        // Mark everything as done
                        const allDone: Record<number, string[]> = {}
                        pastDays.forEach(d => { allDone[d] = [] }) // empty = all done
                        setMissedMap(allDone)
                        setFastMissed([])
                      }}
                    >
                      ✓ Yes, all done
                    </button>
                    <button
                      className="ob-yn-btn"
                      onClick={() => setCatchupAnswer('no')}
                    >
                      Some missed
                    </button>
                  </div>
                )}

                {catchupAnswer === 'yes' && (
                  <div style={{ padding:'14px', background:'rgba(52,211,153,0.07)', border:'1px solid rgba(52,211,153,0.15)', borderRadius:14, marginBottom:20 }}>
                    <div style={{ fontSize:13, color:'#6ee7b7' }}>✦ All prayers and fasts marked as complete</div>
                    <button
                      style={{ fontSize:11, color:'rgba(255,255,255,0.25)', background:'none', border:'none', cursor:'pointer', marginTop:6, fontFamily:'Lato,sans-serif' }}
                      onClick={() => setCatchupAnswer(null)}
                    >
                      Actually, some were missed →
                    </button>
                  </div>
                )}

                {catchupAnswer === 'no' && (
                  <>
                    <div className="ob-legend">
                      <div className="ob-legend-item">
                        <div className="ob-legend-sq" style={{ background:'rgba(52,211,153,0.3)', border:'1px solid rgba(52,211,153,0.4)' }} />
                        Prayer done
                      </div>
                      <div className="ob-legend-item">
                        <div className="ob-legend-circle" style={{ background:'rgba(196,155,74,0.3)', border:'1px solid rgba(196,155,74,0.4)' }} />
                        Fast done
                      </div>
                      <div className="ob-legend-item">
                        <div className="ob-legend-sq" style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)' }} />
                        Missed
                      </div>
                    </div>

                    <button
                      className="ob-select-all"
                      onClick={() => {
                        const allDone: Record<number, string[]> = {}
                        pastDays.forEach(d => { allDone[d] = [] })
                        setMissedMap(allDone)
                        setFastMissed([])
                      }}
                    >
                      Mark all as done
                    </button>

                    <div className="ob-days-wrap">
                      {pastDays.map(dayNum => {
                        const missed = missedMap[dayNum] ?? [...PRAYERS] // default: all missed
                        const fastDone = !fastMissed.includes(dayNum)
                        const dateObj = new Date(startDate + 'T00:00:00')
                        dateObj.setDate(dateObj.getDate() + dayNum - 1)
                        const dateStr = dateObj.toLocaleDateString('en-IN', { weekday:'short', day:'numeric', month:'short' })

                        return (
                          <div key={dayNum} className="ob-day-row">
                            <div className="ob-day-num">Day {dayNum}</div>
                            <div className="ob-day-date">{dateStr}</div>
                            <div className="ob-prayer-squares">
                              {PRAYERS.map(p => {
                                const isDone = !missed.includes(p)
                                return (
                                  <div
                                    key={p}
                                    className={`ob-sq ${isDone ? 'done' : ''}`}
                                    onClick={() => togglePrayerForDay(dayNum, p)}
                                    title={p}
                                  >
                                    {PRAYER_LABELS[p]}
                                  </div>
                                )
                              })}
                              {/* Fast circle */}
                              <div
                                className={`ob-sq fast ${fastDone ? 'done' : ''}`}
                                onClick={() => toggleFastForDay(dayNum)}
                                title="Fast"
                              >
                                ◐
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    <button
                      style={{ fontSize:11, color:'rgba(255,255,255,0.2)', background:'none', border:'none', cursor:'pointer', marginBottom:16, fontFamily:'Lato,sans-serif' }}
                      onClick={() => setCatchupAnswer(null)}
                    >
                      ← Back
                    </button>
                  </>
                )}
              </>
            )}

            {/* FINAL STEP */}
            {isFinalStep && (
              <>
                <span className="ob-icon">✦</span>
                <div className="ob-title">Let's Begin</div>
                <div className="ob-subtitle">بسم الله</div>
                <div className="ob-divider" />
                <div className="ob-body">
                  May Allah accept your prayers and fasts this Ramadan. Ameen.
                </div>
              </>
            )}

          </div>

          {/* dots */}
          <div className="ob-dots">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div key={i} className={`ob-dot ${i === step ? 'active' : ''}`} />
            ))}
          </div>

          {/* Next button — hide during catchup 'no' selection to let user interact */}
          {!(isCatchupStep && catchupAnswer === 'no' && pastDays.length > 3) && (
            <button
              className="ob-btn"
              onClick={goNext}
              disabled={isCatchupStep && catchupAnswer === null}
              style={{ opacity: isCatchupStep && catchupAnswer === null ? 0.4 : 1 }}
            >
              {isFinalStep ? 'Begin Ramadan' : 'Continue'}
            </button>
          )}

          {isCatchupStep && catchupAnswer === 'no' && (
            <button className="ob-btn" onClick={goNext}>
              Continue →
            </button>
          )}

          {!isFinalStep && !isCatchupStep && (
            <button
              className="ob-btn-ghost"
              onClick={() => {
                localStorage.setItem('onboarding_done', '1')
                onComplete({})
              }}
            >
              Skip
            </button>
          )}
        </div>
      </div>
    </>
  )
}