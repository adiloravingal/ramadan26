'use client'

import { DayStatus } from '@/types'
import { dayCalendarStatus } from '@/lib/prayerUtils'
import Link from 'next/link'

interface Props {
  dayStatuses: DayStatus[]
  totalDays: number
}

const STATUS_STYLES = {
  'all-done':  'bg-emerald-500 text-white',
  'missed':    'bg-red-400 text-white',
  'partial':   'bg-amber-400 text-white',
  'pending':   'bg-[#E8E1D5] text-[#6B6B6B]',
  'future':    'bg-[#F0EBE3] text-[#BFBAB4]',
}

const STATUS_DOT = {
  'all-done':  '●',
  'missed':    '○',
  'partial':   '◐',
  'pending':   '·',
  'future':    '',
}

export default function CalendarGrid({ dayStatuses, totalDays }: Props) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-[#E8E1D5]">
      <h2 className="font-semibold text-[#1C1C1C] text-sm uppercase tracking-wide mb-4">Ramadan 1446</h2>

      <div className="grid grid-cols-7 gap-1.5">
        {dayStatuses.map(day => {
          const status = dayCalendarStatus(day)
          const isToday = day.isToday

          return (
            <Link
              key={day.dayNumber}
              href={`/day/${day.dayNumber}`}
              className={`
                aspect-square flex flex-col items-center justify-center rounded-xl text-xs font-medium transition-transform hover:scale-105
                ${STATUS_STYLES[status]}
                ${isToday ? 'ring-2 ring-[#8B7355] ring-offset-1' : ''}
              `}
            >
              <span className="text-[11px] font-bold leading-none">{day.dayNumber}</span>
              <span className="text-[8px] mt-0.5 opacity-70">{STATUS_DOT[status]}</span>
            </Link>
          )
        })}

        {/* Placeholder for days not yet determined (if total_days still unclear) */}
        {Array.from({ length: Math.max(0, 30 - dayStatuses.length) }).map((_, i) => (
          <div
            key={`placeholder-${i}`}
            className="aspect-square flex items-center justify-center rounded-xl bg-[#F8F4EE] text-[#D5CFC5] text-xs"
          >
            ?
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex gap-3 mt-4 flex-wrap">
        {[
          { label: 'All done', color: 'bg-emerald-500' },
          { label: 'Missed', color: 'bg-red-400' },
          { label: 'Partial', color: 'bg-amber-400' },
          { label: 'Today/Future', color: 'bg-[#E8E1D5]' },
        ].map(({ label, color }) => (
          <div key={label} className="flex items-center gap-1">
            <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
            <span className="text-[10px] text-[#9B9590]">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
