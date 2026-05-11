import { useState, useEffect, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Plus, MapPin, Camera, Star, Trash2, Search, X, Check, Calendar, Tag, ChevronUp, Paintbrush } from 'lucide-react'
import { createPortal } from 'react-dom'
import NoteModal from './NoteModal'
import RadiusModal from './RadiusModal'
import toast from 'react-hot-toast'

function markerIcon(color = '#f59e0b') {
  return L.divIcon({
    html: `<div class="lf-marker" style="--mc:${color}"><div class="lf-pin"></div></div>`,
    className: '', iconSize: [28, 36], iconAnchor: [14, 36], popupAnchor: [0, -38],
  })
}

function MapAutoCenter({ center }) {
  const map = useMap()
  useEffect(() => {
    if (!center) return
    map.flyTo(center, 5, { duration: 1.2 })
  }, [center, map])
  return null
}

function ClickHandler({ enabled, onPick }) {
  useMapEvents({ click(e) { if (enabled) onPick(e.latlng) } })
  return null
}

const TILE = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'

export default function CountryView({ country, notes, isVisited, onBack, onAddNote, onDeleteNote, onToggleVisited, onAddZone }) {
  const [center, setCenter] = useState(
    country.lat != null ? [country.lat, country.lng] : [20, 0]
  )
  const [picking, setPicking] = useState(false)
  const [pickedLoc, setPickedLoc] = useState(null)
  const [showChoice, setShowChoice] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [showZoneModal, setShowZoneModal] = useState(false)
  const [selected, setSelected] = useState(null)
  const [cityQuery, setCityQuery] = useState('')
  const [cityResults, setCityResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [panelExpanded, setPanelExpanded] = useState(false)

  useEffect(() => {
    fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(country.name)}&format=json&limit=1`,
      { headers: { 'Accept-Language': 'fr' } })
      .then(r => r.json())
      .then(data => { if (data[0]) setCenter([parseFloat(data[0].lat), parseFloat(data[0].lon)]) })
      .catch(() => {})
  }, [country.name])

  const handlePick = useCallback((latlng) => {
    setPickedLoc(latlng); setShowChoice(true); setPicking(false)
  }, [])

  const handleCitySearch = async () => {
    if (!cityQuery.trim()) return
    setSearching(true)
    try {
      const r = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cityQuery + ' ' + country.name)}&format=json&limit=5`,
        { headers: { 'Accept-Language': 'fr' } }
      )
      setCityResults(await r.json())
    } catch { toast.error('Recherche impossible') }
    setSearching(false)
  }

  const handleSaveNote = (note) => {
    onAddNote({ ...note, lat: pickedLoc.lat, lng: pickedLoc.lng })
    setShowModal(false); setPickedLoc(null)
    toast.success('Souvenir sauvegardé ✨')
    setPanelExpanded(true)
  }

  const handleSaveZone = (zone) => {
    onAddZone(zone)
    setShowZoneModal(false); setPickedLoc(null)
    toast.success(`Zone "${zone.label}" colorée !`)
  }

  const cancelChoice = () => { setShowChoice(false); setPickedLoc(null) }

  const handleDeleteNote = (noteId) => {
    onDeleteNote(noteId)
    if (selected?.id === noteId) setSelected(null)
    toast.success('Souvenir supprimé')
  }

  return (
    <div className="w-full h-full flex flex-col" style={{ background: '#080e1c' }}>
      {/* ── Header ────────────────────────────────── */}
      <header className="flex items-center gap-2 md:gap-4 px-3 md:px-6 py-3 md:py-4 border-b border-navy-500 bg-navy-800 flex-shrink-0" style={{ background: '#080e1c' }}>
        <button onClick={onBack} className="flex items-center gap-1.5 md:gap-2 text-slate-400 hover:text-white transition-colors text-sm font-medium flex-shrink-0 py-1.5 px-2 md:px-0 rounded-lg md:rounded-none active:bg-navy-600 md:active:bg-transparent">
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Carte</span>
        </button>

        <div className="h-5 w-px bg-navy-500 hidden sm:block" />

        <div className="flex items-center gap-2 flex-1 min-w-0">
          <h1 className="text-white font-bold text-base md:text-xl truncate">{country.name}</h1>
          {notes.length > 0 && (
            <span className="hidden sm:block text-xs bg-teal-400/10 text-teal-400 border border-teal-400/20 px-2 py-0.5 rounded-lg flex-shrink-0">
              {notes.length}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={onToggleVisited}
            className={`flex items-center gap-1.5 px-3 py-2 md:px-4 rounded-xl text-xs md:text-sm font-medium transition-all ${
              isVisited
                ? 'bg-amber-400/10 text-amber-400 border border-amber-400/30'
                : 'bg-navy-600 text-slate-400 border border-navy-500 hover:text-amber-400'
            }`}>
            <Check className="w-3.5 h-3.5 md:w-4 md:h-4" />
            <span className="hidden sm:inline">{isVisited ? 'Visité' : 'Visité ?'}</span>
          </button>

          <button onClick={() => setPicking(p => !p)}
            className={`flex items-center gap-1.5 px-3 py-2 md:px-4 rounded-xl text-xs md:text-sm font-medium transition-all ${
              picking
                ? 'bg-teal-400 text-navy-800 shadow-lg shadow-teal-900/30'
                : 'bg-navy-600 text-slate-300 border border-navy-500 hover:text-teal-400'
            }`}>
            <Plus className="w-3.5 h-3.5 md:w-4 md:h-4" />
            <span className="hidden sm:inline">{picking ? 'Cliquez…' : 'Souvenir'}</span>
          </button>
        </div>
      </header>

      {/* ── Body ──────────────────────────────────── */}
      <div className="flex flex-1 min-h-0">
        {/* Map */}
        <div className={`flex-1 relative ${picking ? 'cursor-crosshair' : ''}`}>
          <MapContainer key={country.ISO_A3} center={center} zoom={4}
            style={{ position: 'absolute', inset: 0 }} zoomControl={false}>
            <TileLayer url={TILE} attribution='&copy; CARTO' />
            <MapAutoCenter center={center} />
            <ClickHandler enabled={picking} onPick={handlePick} />
            {notes.map(note => (
              <Marker key={note.id} position={[note.lat, note.lng]}
                icon={markerIcon(selected?.id === note.id ? '#2dd4bf' : '#f59e0b')}
                eventHandlers={{ click: () => setSelected(n => n?.id === note.id ? null : note) }}
              />
            ))}
          </MapContainer>

          {picking && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none">
              <div className="flex items-center gap-2 bg-teal-400 text-navy-800 text-sm font-semibold px-4 py-2.5 rounded-full shadow-xl">
                <MapPin className="w-4 h-4 animate-bounce" />
                Appuyez sur la carte
              </div>
            </div>
          )}
        </div>

        {/* ── Notes panel — desktop right, mobile bottom sheet ── */}
        <aside className={`
          notes-panel-aside
          ${panelExpanded ? 'panel-expanded' : 'panel-collapsed'}
        `}>
          {/* Mobile drag handle + toggle */}
          <button
            className="md:hidden w-full flex items-center justify-between px-4 py-3 flex-shrink-0 active:bg-navy-600 transition-colors"
            onClick={() => setPanelExpanded(e => !e)}
          >
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-teal-400" />
              <span className="text-white text-sm font-medium">
                Souvenirs {notes.length > 0 && <span className="text-teal-400">({notes.length})</span>}
              </span>
            </div>
            <ChevronUp className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${panelExpanded ? 'rotate-180' : ''}`} />
          </button>

          {/* Desktop handle (no toggle) */}
          <div className="hidden md:block px-4 py-3 border-b border-navy-500 flex-shrink-0">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Rechercher une ville</p>
          </div>

          {/* City search (always visible on desktop, hidden when collapsed on mobile) */}
          <div className={`px-4 pt-3 pb-3 border-b border-navy-500 flex-shrink-0 ${panelExpanded ? 'block' : 'hidden md:block'}`}>
            <div className="flex gap-2">
              <input value={cityQuery} onChange={e => { setCityQuery(e.target.value); if (!e.target.value) setCityResults([]) }}
                onKeyDown={e => e.key === 'Enter' && handleCitySearch()}
                placeholder={`Ville en ${country.name}…`}
                className="flex-1 bg-navy-600 border border-navy-500 rounded-xl px-3 py-2 text-sm text-slate-300 placeholder-slate-600 focus:outline-none focus:border-teal-400/50 transition-colors" />
              <button onClick={handleCitySearch} disabled={searching || !cityQuery.trim()}
                className="w-10 h-10 rounded-xl bg-teal-400/10 border border-teal-400/30 text-teal-400 flex items-center justify-center hover:bg-teal-400/20 disabled:opacity-40 transition-colors flex-shrink-0">
                {searching ? <div className="w-4 h-4 border-2 border-teal-400/30 border-t-teal-400 rounded-full animate-spin" /> : <Search className="w-4 h-4" />}
              </button>
            </div>

            <AnimatePresence>
              {cityResults.length > 0 && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="mt-2 bg-navy-600 border border-navy-500 rounded-xl overflow-hidden shadow-xl">
                  {cityResults.map((r, i) => (
                    <button key={i} onClick={() => {
                      setPickedLoc({ lat: parseFloat(r.lat), lng: parseFloat(r.lon) })
                      setCityQuery(r.display_name.split(',')[0]); setCityResults([])
                      setShowModal(true)
                    }}
                      className="w-full flex items-start gap-2 px-3 py-2.5 hover:bg-navy-500 text-left border-b border-navy-500 last:border-0 transition-colors">
                      <MapPin className="w-3.5 h-3.5 text-teal-400 mt-0.5 flex-shrink-0" />
                      <span className="text-slate-300 text-xs leading-snug line-clamp-2">{r.display_name.split(',').slice(0, 3).join(', ')}</span>
                    </button>
                  ))}
                  <button onClick={() => setCityResults([])} className="w-full py-2 text-xs text-slate-500 hover:text-slate-300 transition-colors">Fermer</button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Notes list */}
          <div className={`flex-1 overflow-y-auto custom-scroll p-4 ${panelExpanded ? 'block' : 'hidden md:block'}`}>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 hidden md:block">Souvenirs ({notes.length})</p>

            {notes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center text-slate-600">
                <Camera className="w-10 h-10 mb-3 opacity-30" />
                <p className="text-sm">Aucun souvenir</p>
                <p className="text-xs mt-1 opacity-70">Clique "Souvenir" puis place un pin !</p>
              </div>
            ) : (
              <div className="space-y-2">
                {notes.map(note => (
                  <NoteCard key={note.id} note={note}
                    isSelected={selected?.id === note.id}
                    onClick={() => setSelected(n => n?.id === note.id ? null : note)}
                    onDelete={() => handleDeleteNote(note.id)} />
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Choice modal — via portal pour passer au-dessus de Leaflet */}
      {createPortal(
        <AnimatePresence>
          {showChoice && pickedLoc && (
            <motion.div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={cancelChoice}>
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
              <motion.div className="relative w-full sm:max-w-sm bg-navy-700 border border-navy-500 rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden"
                initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 320 }}
                onClick={e => e.stopPropagation()}>
                <div className="sm:hidden flex justify-center pt-3 pb-1"><div className="w-10 h-1 rounded-full bg-navy-500" /></div>
                <div className="p-5">
                  <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold mb-4 text-center">Que veux-tu faire ici ?</p>
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => { setShowChoice(false); setShowModal(true) }}
                      className="flex flex-col items-center gap-3 p-5 rounded-xl bg-teal-400/10 border border-teal-400/30 hover:bg-teal-400/20 transition-all active:scale-95">
                      <Camera className="w-7 h-7 text-teal-400" />
                      <span className="text-teal-300 text-sm font-semibold">Souvenir</span>
                    </button>
                    <button onClick={() => { setShowChoice(false); setShowZoneModal(true) }}
                      className="flex flex-col items-center gap-3 p-5 rounded-xl bg-amber-400/10 border border-amber-400/30 hover:bg-amber-400/20 transition-all active:scale-95">
                      <Paintbrush className="w-7 h-7 text-amber-400" />
                      <span className="text-amber-300 text-sm font-semibold">Colorier</span>
                    </button>
                  </div>
                  <button onClick={cancelChoice} className="w-full mt-3 py-2.5 text-slate-500 text-sm hover:text-slate-300 transition-colors">Annuler</button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Note Modal — via portal */}
      {createPortal(
        <AnimatePresence>
          {showModal && (
            <NoteModal initialCity={cityQuery} location={pickedLoc}
              onSave={handleSaveNote} onClose={() => { setShowModal(false); setPickedLoc(null) }} />
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Zone Modal — via portal */}
      {createPortal(
        <AnimatePresence>
          {showZoneModal && (
            <RadiusModal location={pickedLoc}
              onSave={handleSaveZone} onClose={() => { setShowZoneModal(false); setPickedLoc(null) }} />
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Note Detail */}
      <AnimatePresence>
        {selected && (
          <NoteDetail note={selected} onClose={() => setSelected(null)}
            onDelete={() => handleDeleteNote(selected.id)} />
        )}
      </AnimatePresence>
    </div>
  )
}

function NoteCard({ note, isSelected, onClick, onDelete }) {
  return (
    <motion.div layout onClick={onClick}
      className={`group rounded-xl border cursor-pointer transition-all overflow-hidden ${
        isSelected ? 'border-teal-400/40 bg-teal-400/5 ring-1 ring-teal-400/20' : 'border-navy-500 bg-navy-600/50 hover:border-navy-400'
      }`}>
      {note.photos?.[0] && <div className="h-24 overflow-hidden"><img src={note.photos[0]} alt="" className="w-full h-full object-cover" /></div>}
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{note.cityName}</p>
            {note.visitedAt && (
              <p className="text-slate-500 text-xs mt-0.5">
                {new Date(note.visitedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            )}
          </div>
          <button onClick={e => { e.stopPropagation(); onDelete() }}
            className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 flex items-center justify-center transition-all flex-shrink-0">
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
        {note.rating > 0 && (
          <div className="flex gap-0.5 mt-1.5">
            {[1,2,3,4,5].map(s => <Star key={s} className={`w-3 h-3 ${s <= note.rating ? 'text-amber-400 fill-amber-400' : 'text-navy-500'}`} />)}
          </div>
        )}
        {note.content && <p className="text-slate-500 text-xs mt-1.5 line-clamp-2 leading-relaxed">{note.content}</p>}
        {note.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {note.tags.slice(0, 3).map(tag => <span key={tag} className="text-xs bg-navy-700 text-slate-500 px-1.5 py-0.5 rounded">{tag}</span>)}
          </div>
        )}
      </div>
    </motion.div>
  )
}

function NoteDetail({ note, onClose, onDelete }) {
  return createPortal(
    <motion.div className="fixed inset-0 z-40 flex items-end justify-center p-0 sm:items-center sm:p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div
        className="relative w-full sm:max-w-lg max-h-[85vh] overflow-y-auto bg-navy-700 border border-navy-500 rounded-t-2xl sm:rounded-2xl shadow-2xl custom-scroll"
        initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        onClick={e => e.stopPropagation()}>
        {/* Handle */}
        <div className="sm:hidden flex justify-center pt-3"><div className="w-10 h-1 rounded-full bg-navy-500" /></div>

        {note.photos?.length > 0 && (
          <div className={`grid gap-1 ${note.photos.length === 1 ? '' : 'grid-cols-2'}`}>
            {note.photos.slice(0, 4).map((photo, i) => (
              <div key={i} className={`overflow-hidden ${
                note.photos.length === 1 ? 'h-52 rounded-t-2xl' : i === 0 && note.photos.length >= 3 ? 'col-span-2 h-36 rounded-t-2xl' : 'h-28'
              } ${i === 0 && note.photos.length < 3 ? 'rounded-tl-2xl' : ''} ${i === 1 && note.photos.length < 3 ? 'rounded-tr-2xl' : ''}`}>
                <img src={photo} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        )}

        <div className="p-5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <h2 className="text-white text-xl font-bold">{note.cityName}</h2>
              {note.visitedAt && (
                <p className="text-slate-400 text-sm mt-0.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(note.visitedAt).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <button onClick={onDelete} className="w-8 h-8 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 flex items-center justify-center transition-colors"><Trash2 className="w-4 h-4" /></button>
              <button onClick={onClose} className="w-8 h-8 rounded-xl bg-navy-600 hover:bg-navy-500 text-slate-400 flex items-center justify-center transition-colors"><X className="w-4 h-4" /></button>
            </div>
          </div>
          {note.rating > 0 && <div className="flex gap-1 mb-3">{[1,2,3,4,5].map(s => <Star key={s} className={`w-5 h-5 ${s <= note.rating ? 'text-amber-400 fill-amber-400' : 'text-navy-500'}`} />)}</div>}
          {note.tags?.length > 0 && <div className="flex flex-wrap gap-2 mb-4">{note.tags.map(tag => <span key={tag} className="text-xs bg-teal-400/10 text-teal-400 border border-teal-400/20 px-2.5 py-1 rounded-lg">{tag}</span>)}</div>}
          {note.content && <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{note.content}</p>}
        </div>
      </motion.div>
    </motion.div>,
    document.body
  )
}
