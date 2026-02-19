export type Prayer = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha'

export interface PrayerTime {
  id: number
  day_number: number
  date: string
  fajr_end: string   // "HH:MM" 24hr
  dhuhr_end: string
  asr_end: string
  maghrib_end: string
  isha_end: string
}

export interface DayRecord {
  id: string
  user_id: string
  day_number: number
  date: string
  fajr: boolean
  dhuhr: boolean
  asr: boolean
  maghrib: boolean
  isha: boolean
  fast: boolean
  updated_at: string
}

export interface RamadanConfig {
  id: number
  total_days: number        // 29 or 30
  start_date: string        // "2025-02-19"
}

export interface User {
  id: string
  email: string
  name: string
}

export interface QazaSummary {
  fajr: number
  dhuhr: number
  asr: number
  maghrib: number
  isha: number
  fast: number
  total_prayers: number
}

export interface DayStatus {
  dayNumber: number
  date: string
  prayerTime: PrayerTime
  record: DayRecord | null
  // computed
  prayers: {
    [key in Prayer]: 'done' | 'missed' | 'pending'
  }
  fast: 'done' | 'missed' | 'pending'
  isToday: boolean
  isPast: boolean
  isFuture: boolean
}
