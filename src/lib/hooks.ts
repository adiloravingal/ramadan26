'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { buildDayStatus, computeQaza } from '@/lib/prayerUtils'
import { DayRecord, DayStatus, PrayerTime, QazaSummary, RamadanConfig } from '@/types'

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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const configRef = useRef<RamadanConfig | null>(null)
  const prayerTimesRef = useRef<PrayerTime[]>([])

  const supabase = createClient()

  // Whenever records change, recompute statuses + qaza immediately
  const syncStatuses = useCallback((newRecords: DayRecord[]) => {
    if (!configRef.current || prayerTimesRef.current.length === 0) return
    const statuses = recomputeStatuses(prayerTimesRef.current, newRecords, configRef.current.total_days)
    setDayStatuses(statuses)
    setQaza(computeQaza(statuses))
  }, [])

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

      configRef.current = cfg
      prayerTimesRef.current = times

      setConfig(cfg)
      setPrayerTimes(times)
      setRecords(recs)
      syncStatuses(recs)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Refresh every 60s to catch newly-missed prayers automatically
  useEffect(() => {
    const interval = setInterval(() => {
      setRecords(prev => {
        syncStatuses(prev)
        return prev
      })
    }, 60_000)
    return () => clearInterval(interval)
  }, [syncStatuses])

  const togglePrayer = useCallback(async (
    dayNumber: number,
    date: string,
    field: 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha' | 'fast',
    currentValue: boolean
  ) => {
    if (!userId) return
    const newValue = !currentValue

    // Optimistic update — immediately update records and recompute
    setRecords(prev => {
      const existing = prev.find(r => r.day_number === dayNumber)
      let next: DayRecord[]
      if (existing) {
        next = prev.map(r =>
          r.day_number === dayNumber ? { ...r, [field]: newValue, updated_at: new Date().toISOString() } : r
        )
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
        next = [...prev, newRecord]
      }
      // Recompute synchronously inside the setter so UI updates in same render
      syncStatuses(next)
      return next
    })

    // Persist to Supabase in background
    const { error } = await supabase.from('day_records').upsert({
      user_id: userId,
      day_number: dayNumber,
      date,
      [field]: newValue,
    }, { onConflict: 'user_id,day_number' })

    if (error) {
      // Revert on failure
      fetchData()
    }
  }, [userId, syncStatuses, fetchData])

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

  const signOut = () => createClient().auth.signOut()

  return { userId, userName, authLoading, signOut }
}