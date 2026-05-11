import { useState, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'

const STORAGE_KEY = 'travelmap_v1'

function load() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}
  } catch {
    return {}
  }
}

export function useTravel() {
  const [visitedCountries, setVisitedCountries] = useState(load)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(visitedCountries))
  }, [visitedCountries])

  const isVisited = (iso) => !!visitedCountries[iso]

  const getNotes = (iso) => visitedCountries[iso]?.notes || []

  const toggleVisited = (iso, name) => {
    setVisitedCountries(prev => {
      if (prev[iso]) {
        const { [iso]: _, ...rest } = prev
        return rest
      }
      return {
        ...prev,
        [iso]: { iso, name, notes: [], addedAt: new Date().toISOString() },
      }
    })
  }

  const addNote = (iso, name, note) => {
    setVisitedCountries(prev => {
      const existing = prev[iso] || { iso, name, notes: [], addedAt: new Date().toISOString() }
      return {
        ...prev,
        [iso]: {
          ...existing,
          notes: [...existing.notes, { ...note, id: note.id || uuidv4() }],
        },
      }
    })
  }

  const deleteNote = (iso, noteId) => {
    setVisitedCountries(prev => ({
      ...prev,
      [iso]: {
        ...prev[iso],
        notes: prev[iso].notes.filter(n => n.id !== noteId),
      },
    }))
  }

  return { visitedCountries, isVisited, getNotes, toggleVisited, addNote, deleteNote }
}
