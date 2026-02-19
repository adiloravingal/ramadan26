'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { buildDayStatus, computeQaza } from '@/lib/prayerUtils'
import { DayRecord, DayStatus, PrayerTime, QazaSummary, RamadanConfig, UserSettings } from '@/types'
import { fetchAndStorePrayerTimes, getUserPrayerTimes } from '@/lib/prayerApi'

function toLocalDateStr(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function recomputeStatuses(
  times: PrayerTime[],
  records: DayRecord[],
  totalDays: number
): DayStatus[] {
  const now = new Date()
  return times.slice(0, totalDays).map(pt => {
    const record = records.find(r => r.day_number === pt.day_number) ?? null
    return buildDayStatus(pt.day_number, pt, record, now)
  })
}

export function useRamadanData(userId: string | null) {
  const [config, setConfig] = useState<RamadanConfig | null>(null)
  const [prayerTimes, setPrayerTimes] = useState<PrayerTime[]>([])
  const [records, setRecords] = useState<DayRecord[]>([])
  const [dayStatuses, setDayStatuses] = useState<DayStatus[]>([])
  const [qaza, setQaza] = useState<QazaSummary | null>(null)
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [needsLocation, setNeedsLocation] = useState(false)
  const [loading, setLoading] = useState(true)

  const configRef = useRef<RamadanConfig | null>(null)
  const prayerTimesRef = useRef<PrayerTime[]>([])

  const supabase = createClient()

  const syncStatuses = useCallback((newRecords: DayRecord[]) => {
    if (!configRef.current || prayerTimesRef.current.length === 0) return
    const statuses = recomputeStatuses(
      prayerTimesRef.current,
      newRecords,
      configRef.current.total_days
    )
    setDayStatuses(statuses)
    setQaza(computeQaza(statuses))
  }, [])

  const fetchData = useCallback(async () => {
    if (!userId) return
    try {
      setLoading(true)

      const [configRes, settingsRes, recordsRes] = await Promise.all([
        supabase.from('ramadan_config').select('*').single(),
        supabase.from('user_settings').select('*').eq('id', userId).single(),
        supabase.from('day_records').select('*').eq('user_id', userId),
      ])

      const cfg = configRes.data as RamadanConfig
      const userSettings = settingsRes.data as UserSettings | null
      const recs = (recordsRes.data || []) as DayRecord[]

      configRef.current = cfg
      setConfig(cfg)
      setRecords(recs)

      // Check if user has set a real location yet
      // Chennai coords are the default — treat as "needs setup" only if no settings row
      if (!userSettings) {
        setNeedsLocation(true)
        setLoading(false)
        return
      }

      setSettings(userSettings)

      // Check if we have prayer times cached, if not fetch from API
      let times = await getUserPrayerTimes(userId)

      if (times.length < cfg.total_days) {
        // Fetch missing days from Aladhan API
        times = await fetchAndStorePrayerTimes(
          userId,
          userSettings,
          cfg.start_date,
          cfg.total_days
        )
      }

      prayerTimesRef.current = times
      setPrayerTimes(times)
      syncStatuses(recs)
    } catch (e: any) {
      console.error('fetchData error:', e)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Refresh every 60s for auto-miss detection
  useEffect(() => {
    const interval = setInterval(() => {
      setRecords(prev => {
        syncStatuses(prev)
        return prev
      })
    }, 60_000)
    return () => clearInterval(interval)
  }, [syncStatuses])

  const onLocationSet = useCallback(async (newSettings: UserSettings) => {
  // Set these synchronously first — never call fetchData after this
  setNeedsLocation(false)
  setSettings(newSettings)
  setLoading(true)

  if (!userId || !configRef.current) {
    setLoading(false)
    return
  }

  try {
    // Fetch prayer times directly with the new settings
    const times = await fetchAndStorePrayerTimes(
      userId,
      newSettings,
      configRef.current.start_date,
      configRef.current.total_days
    )
    prayerTimesRef.current = times
    setPrayerTimes(times)

    // Fetch records fresh
    const { data: recs } = await supabase
      .from('day_records')
      .select('*')
      .eq('user_id', userId)

    const freshRecs = (recs || []) as DayRecord[]
    setRecords(freshRecs)
    syncStatuses(freshRecs)
  } catch (e) {
    console.error('onLocationSet error:', e)
  } finally {
    setLoading(false)
  }
}, [userId, syncStatuses])

  const togglePrayer = useCallback(async (
    dayNumber: number,
    date: string,
    field: 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha' | 'fast',
    currentValue: boolean
  ) => {
    if (!userId) return
    const newValue = !currentValue

    setRecords(prev => {
      const existing = prev.find(r => r.day_number === dayNumber)
      let next: DayRecord[]
      if (existing) {
        next = prev.map(r =>
          r.day_number === dayNumber
            ? { ...r, [field]: newValue, updated_at: new Date().toISOString() }
            : r
        )
      } else {
        const newRecord: DayRecord = {
          id: crypto.randomUUID(),
          user_id: userId,
          day_number: dayNumber,
          date,
          fajr: false, dhuhr: false, asr: false,
          maghrib: false, isha: false, fast: false,
          [field]: newValue,
          updated_at: new Date().toISOString(),
        }
        next = [...prev, newRecord]
      }
      syncStatuses(next)
      return next
    })

    const { error } = await supabase.from('day_records').upsert({
      user_id: userId,
      day_number: dayNumber,
      date,
      [field]: newValue,
    }, { onConflict: 'user_id,day_number' })

    if (error) fetchData()
  }, [userId, syncStatuses, fetchData])

  return {
    config, prayerTimes, dayStatuses, qaza,
    loading, settings, needsLocation,
    onLocationSet, refresh: fetchData, togglePrayer
  }
}

export function useAuth() {
  const [userId, setUserId] = useState<string | null>(null)
  const [userName, setUserName] = useState<string>('')
  const [authLoading, setAuthLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data }) => {
      setUserId(data.session?.user.id ?? null)
      setUserName(data.session?.user.user_metadata?.name ?? '')
      setAuthLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user.id ?? null)
      setUserName(session?.user.user_metadata?.name ?? '')
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  const signOut = () => createClient().auth.signOut()

  return { userId, userName, authLoading, signOut }
}