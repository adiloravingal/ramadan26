'use client'

import { QazaSummary } from '@/types'

const PRAYER_LABELS = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] as const

interface Props {
  qaza: QazaSummary
}

export default function QazaCard({ qaza }: Props) {
  const prayers = [
    { label: 'Fajr', count: qaza.fajr },
    { label: 'Dhuhr', count: qaza.dhuhr },
    { label: 'Asr', count: qaza.asr },
    { label: 'Maghrib', count: qaza.maghrib },
    { label: 'Isha', count: qaza.isha },
  ]

  const totalMissed = qaza.total_prayers + qaza.fast
  const allClear = totalMissed === 0

  return (
    <div className="bg-white rounded-2xl p-5 border border-[#E8E1D5]">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-[#1C1C1C] text-sm uppercase tracking-wide">Qaza Summary</h2>
        {allClear && (
          <span className="text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-1 rounded-full">All clear ✓</span>
        )}
      </div>

      <div className="grid grid-cols-5 gap-2 mb-4">
        {prayers.map(({ label, count }) => (
          <div key={label} className="text-center">
            <div className={`text-xl font-bold ${count > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
              {count}
            </div>
            <div className="text-[10px] text-[#9B9590] mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      <div className="border-t border-[#F0EBE0] pt-3 flex justify-between items-center">
        <div className="text-center">
          <div className={`text-lg font-bold ${qaza.fast > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
            {qaza.fast}
          </div>
          <div className="text-[10px] text-[#9B9590]">Fasts</div>
        </div>
        <div className="text-right">
          <div className={`text-lg font-bold ${qaza.total_prayers > 0 ? 'text-[#C4853A]' : 'text-emerald-500'}`}>
            {qaza.total_prayers}
          </div>
          <div className="text-[10px] text-[#9B9590]">Total Prayers</div>
        </div>
      </div>
    </div>
  )
}
