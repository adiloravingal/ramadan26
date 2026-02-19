'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth, useRamadanData } from '@/lib/hooks'
import QazaCard from '@/components/QazaCard'
import CalendarGrid from '@/components/CalendarGrid'
import Link from 'next/link'

export default function DashboardPage() {
  const { userId, userName, authLoading, signOut } = useAuth()
  const { dayStatuses, qaza, config, loading, needsLocation, onLocationSet, togglePrayer } = useRamadanData(userId)
  const router = useRouter()

  useEffect(() => {
    if (!authLoading && !userId) router.push('/login')
  }, [authLoading, userId])

  const today = dayStatuses.find(d => d.isToday)

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#F5F0E8] flex items-center justify-center">
        <div className="text-[#8B7355] text-sm">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F5F0E8]">
      {/* Header */}
      <header className="bg-white border-b border-[#E8E1D5] px-5 py-4 flex justify-between items-center">
        <div>
          <h1 className="font-semibold text-[#1C1C1C]">Ramadan Tracker</h1>
          <p className="text-xs text-[#9B9590]">Assalamu Alaikum, {userName || 'Friend'}</p>
        </div>
        <button
          onClick={signOut}
          className="text-xs text-[#9B9590] hover:text-[#1C1C1C] transition-colors"
        >
          Sign out
        </button>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-4">

        {/* Today quick link */}
        {today && (
          <Link href={`/day/${today.dayNumber}`}>
            <div className="bg-[#8B7355] text-white rounded-2xl p-5 flex justify-between items-center hover:bg-[#7A6348] transition-colors">
              <div>
                <p className="text-xs opacity-70 uppercase tracking-wide">Today</p>
                <p className="text-xl font-bold">Day {today.dayNumber}</p>
                <p className="text-xs opacity-70 mt-0.5">{today.date}</p>
              </div>
              <div className="text-right">
                <div className="text-3xl">
                  {[today.prayers.fajr, today.prayers.dhuhr, today.prayers.asr, today.prayers.maghrib, today.prayers.isha]
                    .filter(s => s === 'done').length}
                  <span className="text-lg opacity-60">/5</span>
                </div>
                <p className="text-xs opacity-70">prayers</p>
                <p className={`text-xs mt-1 font-medium ${today.fast === 'done' ? 'text-emerald-300' : today.fast === 'missed' ? 'text-red-300' : 'text-white/60'}`}>
                  Fast: {today.fast === 'done' ? '✓' : today.fast === 'missed' ? 'missed' : 'pending'}
                </p>
              </div>
            </div>
          </Link>
        )}

        {/* Qaza summary */}
        {qaza && <QazaCard qaza={qaza} />}

        {/* Calendar */}
        {config && <CalendarGrid dayStatuses={dayStatuses} totalDays={config.total_days} />}

      </main>
    </div>
  )
}
