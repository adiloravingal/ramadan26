export type Prayer = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha'

export interface PrayerTime {
  id: string
  user_id: string
  day_number: number
  date: string
  fajr_end: string
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
  total_days: number
  start_date: string
}

export interface UserSettings {
  id: string
  city_name: string
  latitude: number
  longitude: number
  timezone: string
  updated_at: string
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
  prayers: {
    [key in Prayer]: 'done' | 'missed' | 'pending'
  }
  fast: 'done' | 'missed' | 'pending'
  isToday: boolean
  isPast: boolean
  isFuture: boolean
}