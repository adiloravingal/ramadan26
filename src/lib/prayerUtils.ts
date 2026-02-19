import { DayRecord, DayStatus, Prayer, PrayerTime, QazaSummary } from '@/types'

const PRAYERS: Prayer[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']

/**
 * Given a date string "YYYY-MM-DD" and time "HH:MM",
 * returns a full Date object in local time.
 */
export function toDateTime(date: string, time: string): Date {
  return new Date(`${date}T${time}:00`)
}

/**
 * Computes the status of each prayer and the fast for a given day.
 * - 'done'    → user marked it
 * - 'missed'  → time window passed and not marked (auto Qaza)
 * - 'pending' → time window not yet passed
 */
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

  // Fast: evaluated after Isha end
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

/**
 * Builds a full DayStatus object for a given day.
 */
export function buildDayStatus(
  dayNumber: number,
  prayerTime: PrayerTime,
  record: DayRecord | null,
  now: Date = new Date()
): DayStatus {
  const dateObj = new Date(prayerTime.date + 'T00:00:00')
  const todayStr = now.toISOString().split('T')[0]
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

/**
 * Computes total Qaza counts across all days.
 */
export function computeQaza(dayStatuses: DayStatus[]): QazaSummary {
  const summary: QazaSummary = {
    fajr: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0,
    fast: 0,
    total_prayers: 0,
  }

  for (const day of dayStatuses) {
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

/**
 * Day-level summary for calendar display.
 */
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
