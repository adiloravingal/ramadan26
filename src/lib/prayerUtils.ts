import { DayRecord, DayStatus, Prayer, PrayerTime, QazaSummary } from '@/types'

const PRAYERS: Prayer[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']

function toLocalDateStr(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function toDateTime(date: string, time: string): Date {
  // Parse as local time explicitly
  const [year, month, day] = date.split('-').map(Number)
  const [hour, minute] = time.split(':').map(Number)
  return new Date(year, month - 1, day, hour, minute, 0)
}

export function computeDayStatus(
  prayerTime: PrayerTime,
  record: DayRecord | null,
  now: Date = new Date()
): DayStatus['prayers'] & { fast: DayStatus['fast'] } {
  const endTimes: Record<Prayer, Date> = {
    fajr:    toDateTime(prayerTime.date, prayerTime.fajr_end),
    dhuhr:   toDateTime(prayerTime.date, prayerTime.dhuhr_end),
    asr:     toDateTime(prayerTime.date, prayerTime.asr_end),
    maghrib: toDateTime(prayerTime.date, prayerTime.maghrib_end),
    isha:    toDateTime(prayerTime.date, prayerTime.isha_end),
  }

  const prayers = {} as DayStatus['prayers']

  for (const prayer of PRAYERS) {
    const done = record?.[prayer] ?? false
    if (done) {
      prayers[prayer] = 'done'
    } else if (now > endTimes[prayer]) {
      prayers[prayer] = 'missed'
    } else {
      prayers[prayer] = 'pending'
    }
  }

  const fastDone = record?.fast ?? false
  let fast: DayStatus['fast']
  if (fastDone) {
    fast = 'done'
  } else if (now > endTimes.isha) {
    fast = 'missed'
  } else {
    fast = 'pending'
  }

  return { ...prayers, fast }
}

export function buildDayStatus(
  dayNumber: number,
  prayerTime: PrayerTime,
  record: DayRecord | null,
  now: Date = new Date()
): DayStatus {
  const todayStr = toLocalDateStr(now)
  const isToday = prayerTime.date === todayStr
  const isPast = prayerTime.date < todayStr
  const isFuture = prayerTime.date > todayStr

  const statuses = computeDayStatus(prayerTime, record, now)
  const { fast, ...prayers } = statuses

  return {
    dayNumber,
    date: prayerTime.date,
    prayerTime,
    record,
    prayers,
    fast,
    isToday,
    isPast,
    isFuture,
  }
}

export function computeQaza(dayStatuses: DayStatus[]): QazaSummary {
  const summary: QazaSummary = {
    fajr: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0,
    fast: 0,
    total_prayers: 0,
  }

  for (const day of dayStatuses) {
    // Count missed for past AND today — not future
    if (day.isFuture) continue

    for (const prayer of PRAYERS) {
      if (day.prayers[prayer] === 'missed') {
        summary[prayer]++
        summary.total_prayers++
      }
    }
    if (day.fast === 'missed') summary.fast++
  }

  return summary
}

export function dayCalendarStatus(day: DayStatus): 'all-done' | 'partial' | 'missed' | 'pending' | 'future' {
  if (day.isFuture) return 'future'

  const prayerStatuses = Object.values(day.prayers)
  const allDone = prayerStatuses.every(s => s === 'done') && day.fast === 'done'
  const anyMissed = prayerStatuses.some(s => s === 'missed') || day.fast === 'missed'
  const anyPending = prayerStatuses.some(s => s === 'pending') || day.fast === 'pending'

  if (allDone) return 'all-done'
  if (anyMissed && !anyPending) return 'missed'
  if (anyPending) return 'partial'
  return 'pending'
}