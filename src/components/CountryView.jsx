import { useState, useEffect, useCallback } from 'react'
import {
  MapContainer, TileLayer, Marker, useMapEvents, useMap,
} from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Plus, MapPin, Camera, Star, Trash2,
  Search, X, Check, BookOpen, Calendar, Tag,
} from 'lucide-react'
import { createPortal } from 'react-dom'
import NoteModal from './NoteModal'
import toast from 'react-hot-toast'

function markerIcon(color = '#f59e0b', hasPhoto = false) {
  return L.divIcon({
    html: `<div class="lf-marker" style="--mc:${color}">
      <div class="lf-pin"></div>
      ${hasPhoto ? '<div class="lf-photo-dot"></div>' : ''}
    </div>`,
    className: '',
    iconSize: [28, 36],
    iconAnchor: [14, 36],
    popupAnchor: [0, -38],
  })
}

function MapAutoCenter({ center, countryName }) {
  const map = useMap()
  useEffect(() => {
    if (!center || (center[0] === 20 && center[1] === 0)) return
    map.flyTo(center, 5, { duration: 1.2 })
  }, [center, map])
  return null
}

function ClickHandler({ enabled, onPick }) {
  useMapEvents({
    click(e) {
      if (enabled) onPick(e.latlng)
    },
  })
  return null
}

const TILE = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
const TILE_ATTR = '&copy; <a href="https://carto.com/">CARTO</a>'

export default function CountryView({
  country, notes, isVisited,
  onBack, onAddNote, onDeleteNote, onToggleVisited,
}) {
  const [center, setCenter] = useState([20, 0])
  const [picking, setPicking] = useState(false)
  const [pickedLoc, setPickedLoc] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [selected, setSelected] = useState(null)
  const [cityQuery, setCityQuery] = useState('')
  const [cityResults, setCityResults] = useState([])
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    const fetchCenter = async () => {
      try {
        const r = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(country.name)}&format=json&limit=1&featuretype=country`,
          { headers: { 'Accept-Language': 'fr' } }
        )
        const data = await r.json()
        if (data[0]) setCenter([parseFloat(data[0].lat), parseFloat(data[0].lon)])
      } catch { /* use default */ }
    }
    fetchCenter()
  }, [country.name])

  const handlePick = useCallback((latlng) => {
    setPickedLoc(latlng)
    setShowModal(true)
    setPicking(false)
  }, [])

  const handleCitySearch = async () => {
    if (!cityQuery.trim()) return
    setSearching(true)
    try {
      const r = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cityQuery + ' ' + country.name)}&format=json&limit=5&addressdetails=1`,
        { headers: { 'Accept-Language': 'fr' } }
      )
      const data = await r.json()
      setCityResults(data)
    } catch {
      toast.error('Recherche impossible')
    }
    setSearching(false)
  }

  const handleCityPick = (result) => {
    const loc = { lat: parseFloat(result.lat), lng: parseFloat(result.lon) }
    setPickedLoc(loc)
    setCityQuery(result.display_name.split(',')[0])
    setCityResults([])
    setShowModal(true)
  }

  const handleSaveNote = (note) => {
    onAddNote({ ...note, lat: pickedLoc.lat, lng: pickedLoc.lng })
    setShowModal(false)
    setPickedLoc(null)
    if (!isVisited) onToggleVisited()
    toast.success('Souvenir sauvegardé ✨')
  }

  const handleDeleteNote = (noteId) => {
    onDeleteNote(noteId)
    if (selected?.id === noteId) setSelected(null)
    toast.success('Souvenir supprimé')
  }

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header */}
      <header className="flex items-center gap-4 px-6 py-4 border-b border-navy-500 bg-navy-700/80 backdrop-blur-sm flex-shrink-0">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Carte mondiale
        </button>

        <div className="h-5 w-px bg-navy-500" />

        <div className="flex items-center gap-3 flex-1 min-w-0">
          <h1 className="text-white font-bold text-xl truncate">{country.name}</h1>
          {notes.length > 0 && (
            <span className="text-xs bg-teal-400/10 text-teal-400 border border-teal-400/20 px-2 py-0.5 rounded-lg">
              {notes.length} souvenir{notes.length > 1 ? 's' : ''}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={onToggleVisited}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              isVisited
                ? 'bg-amber-400/10 text-amber-400 border border-amber-400/30 hover:bg-amber-400/20'
                : 'bg-navy-600 text-slate-400 border border-navy-500 hover:border-amber-400/30 hover:text-amber-400'
            }`}
          >
            <Check className="w-4 h-4" />
            {isVisited ? 'Visité' : 'Marquer visité'}
          </button>

          <button
            onClick={() => setPicking(p => !p)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              picking
                ? 'bg-teal-400 text-navy-800 shadow-lg shadow-teal-900/30'
                : 'bg-navy-600 text-slate-300 border border-navy-500 hover:border-teal-400/40 hover:text-teal-400'
            }`}
          >
            <Plus className="w-4 h-4" />
            {picking ? 'Cliquez sur la carte…' : 'Ajouter un souvenir'}
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="flex flex-1 min-h-0">
        {/* Map */}
        <div className={`flex-1 relative ${picking ? 'cursor-crosshair' : ''}`}>
          <MapContainer
            key={country.ISO_A3}
            center={center}
            zoom={4}
            style={{ width: '100%', height: '100%' }}
            zoomControl={false}
          >
            <TileLayer url={TILE} attribution={TILE_ATTR} />
            <MapAutoCenter center={center} countryName={country.name} />
            <ClickHandler enabled={picking} onPick={handlePick} />

            {notes.map(note => (
              <Marker
                key={note.id}
                position={[note.lat, note.lng]}
                icon={markerIcon(
                  selected?.id === note.id ? '#2dd4bf' : '#f59e0b',
                  note.photos?.length > 0
                )}
                eventHandlers={{ click: () => setSelected(n => n?.id === note.id ? null : note) }}
              />
            ))}
          </MapContainer>

          {picking && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none">
              <div className="flex items-center gap-2 bg-navy-700/95 backdrop-blur border border-teal-400/40 text-teal-300 text-sm px-4 py-2.5 rounded-xl shadow-xl">
                <MapPin className="w-4 h-4 animate-bounce" />
                Cliquez pour placer votre souvenir
              </div>
            </div>
          )}
        </div>

        {/* Right panel */}
        <aside className="w-80 flex flex-col border-l border-navy-500 bg-navy-700/50 backdrop-blur-sm">
          {/* City search */}
          <div className="p-4 border-b border-navy-500">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Rechercher une ville
            </p>
            <div className="flex gap-2">
              <input
                value={cityQuery}
                onChange={e => { setCityQuery(e.target.value); if (!e.target.value) setCityResults([]) }}
                onKeyDown={e => e.key === 'Enter' && handleCitySearch()}
                placeholder={`Ville en ${country.name}…`}
                className="flex-1 bg-navy-600 border border-navy-500 rounded-xl px-3 py-2 text-sm text-slate-300 placeholder-slate-600 focus:outline-none focus:border-teal-400/50 transition-colors"
              />
              <button
                onClick={handleCitySearch}
                disabled={searching || !cityQuery.trim()}
                className="w-10 h-10 rounded-xl bg-teal-400/10 border border-teal-400/30 text-teal-400 flex items-center justify-center hover:bg-teal-400/20 disabled:opacity-40 transition-colors flex-shrink-0"
              >
                {searching ? (
                  <div className="w-4 h-4 border-2 border-teal-400/30 border-t-teal-400 rounded-full animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
              </button>
            </div>

            <AnimatePresence>
              {cityResults.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-2 bg-navy-600 border border-navy-500 rounded-xl overflow-hidden shadow-xl"
                >
                  {cityResults.map((r, i) => (
                    <button
                      key={i}
                      onClick={() => handleCityPick(r)}
                      className="w-full flex items-start gap-2 px-3 py-2.5 hover:bg-navy-500 transition-colors text-left border-b border-navy-500 last:border-0"
                    >
                      <MapPin className="w-3.5 h-3.5 text-teal-400 mt-0.5 flex-shrink-0" />
                      <span className="text-slate-300 text-xs leading-snug line-clamp-2">
                        {r.display_name.split(',').slice(0, 3).join(', ')}
                      </span>
                    </button>
                  ))}
                  <button
                    onClick={() => setCityResults([])}
                    className="w-full py-2 text-xs text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    Fermer
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Notes list */}
          <div className="flex-1 overflow-y-auto custom-scroll p-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Souvenirs ({notes.length})
            </p>

            {notes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-slate-600">
                <Camera className="w-10 h-10 mb-3 opacity-30" />
                <p className="text-sm">Aucun souvenir pour l'instant</p>
                <p className="text-xs mt-1 opacity-70">
                  Cliquez sur « Ajouter un souvenir » puis placez votre pin sur la carte !
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {notes.map(note => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    isSelected={selected?.id === note.id}
                    onClick={() => setSelected(n => n?.id === note.id ? null : note)}
                    onDelete={() => handleDeleteNote(note.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Note Modal */}
      <AnimatePresence>
        {showModal && (
          <NoteModal
            initialCity={cityQuery}
            location={pickedLoc}
            onSave={handleSaveNote}
            onClose={() => { setShowModal(false); setPickedLoc(null) }}
          />
        )}
      </AnimatePresence>

      {/* Note detail bottom sheet */}
      <AnimatePresence>
        {selected && (
          <NoteDetail
            note={selected}
            onClose={() => setSelected(null)}
            onDelete={() => handleDeleteNote(selected.id)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function NoteCard({ note, isSelected, onClick, onDelete }) {
  return (
    <motion.div
      layout
      onClick={onClick}
      className={`group rounded-xl border cursor-pointer transition-all overflow-hidden ${
        isSelected
          ? 'border-teal-400/40 bg-teal-400/5 ring-1 ring-teal-400/20'
          : 'border-navy-500 bg-navy-600/50 hover:border-navy-400'
      }`}
    >
      {note.photos?.[0] && (
        <div className="h-24 overflow-hidden">
          <img src={note.photos[0]} alt="" className="w-full h-full object-cover" />
        </div>
      )}
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{note.cityName}</p>
            {note.visitedAt && (
              <p className="text-slate-500 text-xs mt-0.5">
                {new Date(note.visitedAt).toLocaleDateString('fr-FR', {
                  day: 'numeric', month: 'short', year: 'numeric',
                })}
              </p>
            )}
          </div>
          <button
            onClick={e => { e.stopPropagation(); onDelete() }}
            className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 flex items-center justify-center transition-all flex-shrink-0"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>

        {note.rating > 0 && (
          <div className="flex gap-0.5 mt-1.5">
            {[1, 2, 3, 4, 5].map(s => (
              <Star
                key={s}
                className={`w-3 h-3 ${s <= note.rating ? 'text-amber-400 fill-amber-400' : 'text-navy-500'}`}
              />
            ))}
          </div>
        )}

        {note.content && (
          <p className="text-slate-500 text-xs mt-1.5 line-clamp-2 leading-relaxed">
            {note.content}
          </p>
        )}

        {note.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {note.tags.slice(0, 3).map(tag => (
              <span key={tag} className="text-xs bg-navy-700 text-slate-500 px-1.5 py-0.5 rounded">
                {tag}
              </span>
            ))}
            {note.tags.length > 3 && (
              <span className="text-xs text-slate-600">+{note.tags.length - 3}</span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}

function NoteDetail({ note, onClose, onDelete }) {
  return createPortal(
    <motion.div
      className="fixed inset-0 z-40 flex items-end justify-center p-4 sm:items-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div
        className="relative w-full max-w-lg max-h-[80vh] overflow-y-auto bg-navy-700 border border-navy-500 rounded-2xl shadow-2xl custom-scroll"
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Photos */}
        {note.photos?.length > 0 && (
          <div className={`grid gap-1 ${note.photos.length === 1 ? '' : 'grid-cols-2'}`}>
            {note.photos.slice(0, 4).map((photo, i) => (
              <div
                key={i}
                className={`overflow-hidden ${
                  note.photos.length === 1 ? 'h-56 rounded-t-2xl' : i === 0 && note.photos.length >= 3 ? 'col-span-2 h-40 rounded-t-2xl' : 'h-32'
                } ${i === 0 && note.photos.length < 3 ? 'rounded-tl-2xl' : ''} ${i === 1 && note.photos.length < 3 ? 'rounded-tr-2xl' : ''}`}
              >
                <img src={photo} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        )}

        <div className="p-5">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <h2 className="text-white text-xl font-bold">{note.cityName}</h2>
              {note.visitedAt && (
                <p className="text-slate-400 text-sm mt-0.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(note.visitedAt).toLocaleDateString('fr-FR', {
                    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                  })}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={onDelete}
                className="w-8 h-8 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 flex items-center justify-center transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-xl bg-navy-600 hover:bg-navy-500 text-slate-400 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {note.rating > 0 && (
            <div className="flex gap-1 mb-4">
              {[1, 2, 3, 4, 5].map(s => (
                <Star
                  key={s}
                  className={`w-5 h-5 ${s <= note.rating ? 'text-amber-400 fill-amber-400' : 'text-navy-500'}`}
                />
              ))}
            </div>
          )}

          {note.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {note.tags.map(tag => (
                <span key={tag} className="text-xs bg-teal-400/10 text-teal-400 border border-teal-400/20 px-2.5 py-1 rounded-lg">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {note.content && (
            <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{note.content}</p>
          )}

          {!note.content && !note.tags?.length && !note.rating && (
            <p className="text-slate-600 text-sm italic">Aucune note ajoutée.</p>
          )}
        </div>
      </motion.div>
    </motion.div>,
    document.body
  )
}
