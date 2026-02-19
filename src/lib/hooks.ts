'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { buildDayStatus, computeQaza } from '@/lib/prayerUtils'
import { DayRecord, DayStatus, PrayerTime, QazaSummary, RamadanConfig } from '@/types'

export function useRamadanData(userId: string | null) {
  const [config, setConfig] = useState<RamadanConfig | null>(null)
  const [prayerTimes, setPrayerTimes] = useState<PrayerTime[]>([])
  const [records, setRecords] = useState<DayRecord[]>([])
  const [dayStatuses, setDayStatuses] = useState<DayStatus[]>([])
  const [qaza, setQaza] = useState<QazaSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  const fetchData = useCallback(async () => {
    if (!userId) return
    try {
      setLoading(true)

      const [configRes, timesRes, recordsRes] = await Promise.all([
        supabase.from('ramadan_config').select('*').single(),
        supabase.from('prayer_times').select('*').order('day_number'),
        supabase.from('day_records').select('*').eq('user_id', userId),
      ])

      if (configRes.error) throw configRes.error
      if (timesRes.error) throw timesRes.error
      if (recordsRes.error) throw recordsRes.error

      const cfg = configRes.data as RamadanConfig
      const times = timesRes.data as PrayerTime[]
      const recs = recordsRes.data as DayRecord[]

      setConfig(cfg)
      setPrayerTimes(times)
      setRecords(recs)

      // Build day statuses for active days only
      const activeTimes = times.slice(0, cfg.total_days)
      const now = new Date()
      const statuses = activeTimes.map(pt => {
        const record = recs.find(r => r.day_number === pt.day_number) ?? null
        return buildDayStatus(pt.day_number, pt, record, now)
      })

      setDayStatuses(statuses)
      setQaza(computeQaza(statuses))
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Refresh every 60s to auto-update missed status
  useEffect(() => {
    const interval = setInterval(() => {
      if (prayerTimes.length && records !== undefined && config) {
        const activeTimes = prayerTimes.slice(0, config.total_days)
        const now = new Date()
        const statuses = activeTimes.map(pt => {
          const record = records.find(r => r.day_number === pt.day_number) ?? null
          return buildDayStatus(pt.day_number, pt, record, now)
        })
        setDayStatuses(statuses)
        setQaza(computeQaza(statuses))
      }
    }, 60_000)
    return () => clearInterval(interval)
  }, [prayerTimes, records, config])

  const togglePrayer = useCallback(async (
    dayNumber: number,
    date: string,
    field: 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha' | 'fast',
    currentValue: boolean
  ) => {
    if (!userId) return
    const newValue = !currentValue

    // Optimistic update
    setRecords(prev => {
      const existing = prev.find(r => r.day_number === dayNumber)
      if (existing) {
        return prev.map(r => r.day_number === dayNumber ? { ...r, [field]: newValue } : r)
      } else {
        const newRecord: DayRecord = {
          id: crypto.randomUUID(),
          user_id: userId,
          day_number: dayNumber,
          date,
          fajr: false, dhuhr: false, asr: false, maghrib: false, isha: false, fast: false,
          [field]: newValue,
          updated_at: new Date().toISOString(),
        }
        return [...prev, newRecord]
      }
    })

    // Upsert to Supabase
    await supabase.from('day_records').upsert({
      user_id: userId,
      day_number: dayNumber,
      date,
      [field]: newValue,
    }, { onConflict: 'user_id,day_number' })
  }, [userId])

  return { config, prayerTimes, dayStatuses, qaza, loading, error, refresh: fetchData, togglePrayer }
}

export function useAuth() {
  const [userId, setUserId] = useState<string | null>(null)
  const [userName, setUserName] = useState<string>('')
  const [authLoading, setAuthLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
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

  const signOut = () => supabase.auth.signOut()

  return { userId, userName, authLoading, signOut }
}
