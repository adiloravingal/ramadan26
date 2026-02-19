import { createClient } from '@/lib/supabase'
import { PrayerTime, UserSettings } from '@/types'

interface AladhanTiming {
  Fajr: string
  Sunrise: string
  Dhuhr: string
  Asr: string
  Maghrib: string
  Isha: string
}

// Convert "06:18 (IST)" → "06:18"
function cleanTime(t: string): string {
  return t.split(' ')[0]
}

// Add minutes to a time string for end-of-window calculation
function addMinutes(time: string, mins: number): string {
  const [h, m] = time.split(':').map(Number)
  const total = h * 60 + m + mins
  const newH = Math.floor(total / 60) % 24
  const newM = total % 60
  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`
}

export async function fetchAndStorePrayerTimes(
  userId: string,
  settings: UserSettings,
  startDate: string,
  totalDays: number
): Promise<PrayerTime[]> {
  const supabase = createClient()
  const results: PrayerTime[] = []

  // Check which dates we already have
  const { data: existing } = await supabase
    .from('user_prayer_times')
    .select('date')
    .eq('user_id', userId)

  const existingDates = new Set((existing || []).map((r: any) => r.date))

  const start = new Date(startDate + 'T00:00:00')

  for (let i = 0; i < totalDays; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    const dateStr = toLocalDateStr(d)

    if (existingDates.has(dateStr)) continue // already cached

    try {
      const dd = String(d.getDate()).padStart(2, '0')
      const mm = String(d.getMonth() + 1).padStart(2, '0')
      const yyyy = d.getFullYear()

      const url = `https://api.aladhan.com/v1/timings/${dd}-${mm}-${yyyy}?latitude=${settings.latitude}&longitude=${settings.longitude}&method=1&school=1&timezonestring=${encodeURIComponent(settings.timezone)}`

      const res = await fetch(url)
      const json = await res.json()

      if (json.code !== 200) continue

      const t: AladhanTiming = json.data.timings

      // Prayer end times:
      // Fajr ends at Sunrise
      // Dhuhr ends ~1hr 20min after start (before Asr)
      // Asr ends at Maghrib
      // Maghrib ends ~1hr 20min after start (before Isha)
      // Isha ends at midnight (we use +90min as window end)
      const fajr_end = cleanTime(t.Sunrise)
      const dhuhr_end = addMinutes(cleanTime(t.Dhuhr), 80)
      const asr_end = cleanTime(t.Maghrib)
      const maghrib_end = addMinutes(cleanTime(t.Maghrib), 80)
      const isha_end = addMinutes(cleanTime(t.Isha), 90)

      const row = {
        user_id: userId,
        day_number: i + 1,
        date: dateStr,
        fajr_end,
        dhuhr_end,
        asr_end,
        maghrib_end,
        isha_end,
      }

      await supabase.from('user_prayer_times').upsert(row, {
        onConflict: 'user_id,date'
      })

      results.push({ id: '', ...row })
    } catch (e) {
      console.error('Failed to fetch prayer times for', dateStr, e)
    }
  }

  // Fetch all stored times for this user
  const { data } = await supabase
    .from('user_prayer_times')
    .select('*')
    .eq('user_id', userId)
    .order('day_number')

  return (data || []) as PrayerTime[]
}

export async function getUserPrayerTimes(userId: string): Promise<PrayerTime[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('user_prayer_times')
    .select('*')
    .eq('user_id', userId)
    .order('day_number')
  return (data || []) as PrayerTime[]
}

function toLocalDateStr(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}