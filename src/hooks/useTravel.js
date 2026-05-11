import { useState, useEffect, useRef } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { supabase, hasSupabase } from '../lib/supabase'

const LS_KEY = 'travelmap_v1'

function loadLocal() {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) || {} } catch { return {} }
}

async function fetchFromSupabase(userId) {
  const { data } = await supabase
    .from('travel_data')
    .select('data')
    .eq('user_id', userId)
    .single()
  return data?.data?.visitedCountries || null
}

async function saveToSupabase(userId, visitedCountries) {
  await supabase.from('travel_data').upsert({
    user_id: userId,
    data: { visitedCountries },
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' })
}

export function useTravel(userId) {
  const [visitedCountries, setVisitedCountries] = useState({})
  const [ready, setReady] = useState(false)
  const saveTimer = useRef(null)

  useEffect(() => {
    setReady(false)
    if (!userId || !hasSupabase) {
      setVisitedCountries(loadLocal())
      setReady(true)
      return
    }
    fetchFromSupabase(userId)
      .then(remote => { setVisitedCountries(remote ?? loadLocal()); setReady(true) })
      .catch(() => { setVisitedCountries(loadLocal()); setReady(true) })
  }, [userId])

  useEffect(() => {
    if (!ready) return
    if (!userId || !hasSupabase) {
      localStorage.setItem(LS_KEY, JSON.stringify(visitedCountries))
      return
    }
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => saveToSupabase(userId, visitedCountries), 800)
  }, [visitedCountries, userId, ready])

  const isVisited = (iso) => !!visitedCountries[iso]
  const getNotes  = (iso) => visitedCountries[iso]?.notes || []

  const toggleVisited = (iso, name) => {
    setVisitedCountries(prev => {
      if (prev[iso]) { const { [iso]: _, ...rest } = prev; return rest }
      return { ...prev, [iso]: { iso, name, notes: [], addedAt: new Date().toISOString() } }
    })
  }

  const addNote = (iso, name, note) => {
    setVisitedCountries(prev => {
      const existing = prev[iso] || { iso, name, notes: [], addedAt: new Date().toISOString() }
      return { ...prev, [iso]: { ...existing, notes: [...existing.notes, { ...note, id: note.id || uuidv4() }] } }
    })
  }

  const deleteNote = (iso, noteId) => {
    setVisitedCountries(prev => ({
      ...prev,
      [iso]: { ...prev[iso], notes: prev[iso].notes.filter(n => n.id !== noteId) },
    }))
  }

  return { visitedCountries, ready, isVisited, getNotes, toggleVisited, addNote, deleteNote }
}
