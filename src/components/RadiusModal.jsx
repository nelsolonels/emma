import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, MapPin, Search, Loader } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'

const PRESETS = [
  { label: 'Ville', km: 30 },
  { label: 'Région', km: 150 },
  { label: 'Pays', km: 500 },
  { label: 'Continent', km: 2000 },
]

export default function RadiusModal({ location, onSave, onClose }) {
  const [radius, setRadius] = useState(100)
  const [label, setLabel] = useState('')
  const [search, setSearch] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [pickedLoc, setPickedLoc] = useState(location || null)

  const pct = ((radius - 5) / (3000 - 5)) * 100

  const searchPlace = async () => {
    if (!search.trim()) return
    setSearching(true)
    try {
      const r = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(search)}&format=json&limit=4`,
        { headers: { 'Accept-Language': 'fr' } }
      )
      setResults(await r.json())
    } catch { /* ignore */ }
    setSearching(false)
  }

  const handleSave = () => {
    if (!pickedLoc) return
    onSave({
      id: uuidv4(),
      lat: pickedLoc.lat,
      lng: pickedLoc.lng,
      radiusKm: radius,
      label: label.trim() || search.trim() || `Zone ${radius}km`,
      addedAt: new Date().toISOString(),
    })
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/65 backdrop-blur-sm" />

      <motion.div
        className="relative w-full sm:max-w-md bg-[#0d1b2a] border border-[#1a2d4a] rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden"
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 320 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle bar (mobile) */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-[#1a2d4a]" />
        </div>

        <div className="px-5 pb-5 pt-2">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center">
                <MapPin className="w-4 h-4 text-amber-400" />
              </div>
              <h2 className="text-white font-semibold text-base">Peindre une zone</h2>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-xl bg-[#132236] flex items-center justify-center text-slate-400 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Location picker (if no location passed via click) */}
          {!location && (
            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Lieu
              </label>
              <div className="flex gap-2">
                <input
                  value={search}
                  onChange={e => { setSearch(e.target.value); setResults([]) }}
                  onKeyDown={e => e.key === 'Enter' && searchPlace()}
                  placeholder="Paris, Mont-Blanc, Tokyo…"
                  className="form-input flex-1"
                  autoFocus
                />
                <button
                  onClick={searchPlace}
                  disabled={searching || !search.trim()}
                  className="w-10 h-10 flex-shrink-0 rounded-xl bg-amber-400/10 border border-amber-400/30 text-amber-400 flex items-center justify-center hover:bg-amber-400/20 disabled:opacity-40 transition-colors"
                >
                  {searching ? <Loader className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                </button>
              </div>

              <AnimatePresence>
                {results.length > 0 && (
                  <motion.div
                    className="mt-2 bg-[#132236] border border-[#1a2d4a] rounded-xl overflow-hidden"
                    initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  >
                    {results.map((r, i) => (
                      <button key={i} onClick={() => {
                        setPickedLoc({ lat: parseFloat(r.lat), lng: parseFloat(r.lon) })
                        setSearch(r.display_name.split(',')[0])
                        setLabel(r.display_name.split(',')[0])
                        setResults([])
                      }}
                        className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-[#1a2d4a] text-left border-b border-[#1a2d4a] last:border-0 transition-colors"
                      >
                        <MapPin className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                        <span className="text-slate-300 text-xs line-clamp-1">{r.display_name.split(',').slice(0, 3).join(', ')}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {pickedLoc && !results.length && (
                <p className="text-teal-400 text-xs mt-1.5 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400 inline-block" />
                  Lieu sélectionné
                </p>
              )}
            </div>
          )}

          {/* Label */}
          <div className="mb-4">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Nom (optionnel)
            </label>
            <input
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder="Vacances été, Trip New York…"
              className="form-input"
              autoFocus={!!location}
            />
          </div>

          {/* Radius slider */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Rayon</label>
              <span className="text-amber-400 font-bold text-xl tabular-nums">
                {radius >= 1000 ? `${(radius / 1000).toFixed(1).replace('.0', '')} 000 km` : `${radius} km`}
              </span>
            </div>

            <input
              type="range" min="5" max="3000" step="5" value={radius}
              onChange={e => setRadius(Number(e.target.value))}
              className="radius-slider w-full"
              style={{ '--pct': `${pct}%` }}
            />
            <div className="flex justify-between text-xs text-slate-600 mt-1">
              <span>5 km</span><span>3 000 km</span>
            </div>
          </div>

          {/* Presets */}
          <div className="grid grid-cols-4 gap-2 mb-5">
            {PRESETS.map(p => (
              <button key={p.label} onClick={() => setRadius(p.km)}
                className={`py-2 rounded-xl text-xs font-medium transition-all border ${
                  radius === p.km
                    ? 'bg-amber-400/15 text-amber-300 border-amber-400/40'
                    : 'bg-[#132236] text-slate-500 border-[#1a2d4a] hover:text-slate-300 hover:border-[#243555]'
                }`}
              >
                <div>{p.label}</div>
                <div className="opacity-60 text-xs">{p.km}km</div>
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-3.5 rounded-xl bg-[#132236] text-slate-400 text-sm font-medium hover:bg-[#1a2d4a] transition-colors">
              Annuler
            </button>
            <button onClick={handleSave}
              disabled={!pickedLoc}
              className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-[#050b14] text-sm font-bold shadow-lg shadow-amber-900/30 disabled:opacity-40 disabled:cursor-not-allowed hover:from-amber-400 hover:to-amber-300 transition-all"
            >
              Peindre ✦
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
