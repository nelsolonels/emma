import { useState, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'

const COUNTRIES_KEY = 'travelmap_v1'
const ZONES_KEY = 'travelmap_zones_v1'

function load() {
  try { return JSON.parse(localStorage.getItem(COUNTRIES_KEY)) || {} } catch { return {} }
}
function loadZones() {
  try { return JSON.parse(localStorage.getItem(ZONES_KEY)) || [] } catch { return [] }
}

export function useTravel() {
  const [visitedCountries, setVisitedCountries] = useState(load)
  const [zones, setZones] = useState(loadZones)

  useEffect(() => { localStorage.setItem(COUNTRIES_KEY, JSON.stringify(visitedCountries)) }, [visitedCountries])
  useEffect(() => { localStorage.setItem(ZONES_KEY, JSON.stringify(zones)) }, [zones])

  const isVisited = (iso) => !!visitedCountries[iso]
  const getNotes = (iso) => visitedCountries[iso]?.notes || []

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
      ...prev, [iso]: { ...prev[iso], notes: prev[iso].notes.filter(n => n.id !== noteId) }
    }))
  }

  const addZone = (zone) => {
    setZones(prev => [...prev, { ...zone, id: zone.id || uuidv4() }])
  }

  const removeZone = (id) => {
    setZones(prev => prev.filter(z => z.id !== id))
  }

  return { visitedCountries, zones, isVisited, getNotes, toggleVisited, addNote, deleteNote, addZone, removeZone }
}
