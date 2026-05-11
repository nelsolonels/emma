import { useState } from 'react'
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps'
import { geoCentroid } from 'd3-geo'
import { motion, AnimatePresence } from 'framer-motion'
import { Globe, MapPin, Camera, ChevronRight, Search, X, Compass, Menu, LogOut } from 'lucide-react'

const GEO_URL = '/countries.geojson'
const MAP_W = 800
const MAP_H = 450

export default function WorldMap({ visitedCountries, onCountryClick, userEmail, onSignOut }) {
  const [tooltip, setTooltip] = useState(null)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })
  const [search, setSearch] = useState('')
  const [position, setPosition] = useState({ coordinates: [10, 20], zoom: 1 })
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const visitedCount = Object.keys(visitedCountries).length
  const notesCount = Object.values(visitedCountries).reduce((a, c) => a + (c.notes?.length || 0), 0)

  const filteredVisited = Object.values(visitedCountries)
    .filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name, 'fr'))

  return (
    <div className="w-full h-full flex relative overflow-hidden">
      {/* Mobile sidebar backdrop */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            className="fixed inset-0 bg-black/60 z-20 md:hidden"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Sidebar ──────────────────────────────── */}
      <aside className={`
        fixed md:relative z-30 md:z-auto h-full flex-shrink-0
        transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        sidebar-panel
      `}>
        <button onClick={() => setSidebarOpen(false)} className="absolute top-4 right-4 md:hidden w-8 h-8 rounded-xl bg-[#132236] flex items-center justify-center text-slate-400">
          <X className="w-4 h-4" />
        </button>

        {/* Logo */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center">
            <Globe className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg leading-none tracking-widest">EMMA</h1>
            <p className="text-slate-500 text-xs mt-0.5">Mes aventures</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2 mb-5">
          <StatCard value={visitedCount} label="Pays" icon={<MapPin className="w-4 h-4" />} color="amber" />
          <StatCard value={notesCount} label="Souvenirs" icon={<Camera className="w-4 h-4" />} color="teal" />
        </div>


        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un pays…"
            className="w-full bg-[#0f1f35] border border-[#1a2d4a] rounded-xl pl-9 pr-9 py-2.5 text-sm text-slate-300 placeholder-slate-600 focus:outline-none focus:border-amber-400/50 transition-colors" />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-4 h-4 text-slate-500 hover:text-slate-300" />
            </button>
          )}
        </div>

        {/* Visited list */}
        <div className="flex-1 overflow-y-auto min-h-0 custom-scroll">
          <p className="text-xs text-slate-600 uppercase tracking-widest font-semibold mb-3">Pays visités</p>
          {filteredVisited.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Compass className="w-10 h-10 text-[#1a2d4a] mb-3" />
              <p className="text-slate-500 text-sm">{search ? 'Aucun résultat' : 'Clique sur un pays !'}</p>
            </div>
          ) : (
            filteredVisited.map(country => (
              <motion.button key={country.iso} layout
                onClick={() => { onCountryClick({ ISO_A3: country.iso, name: country.name }); setSidebarOpen(false) }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#132236] transition-colors group text-left mb-0.5"
              >
                <div className="w-6 h-6 rounded-lg bg-amber-400/10 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-3 h-3 text-amber-400" />
                </div>
                <span className="flex-1 text-slate-300 text-sm group-hover:text-white transition-colors truncate">{country.name}</span>
                {country.notes?.length > 0 && (
                  <span className="text-xs bg-teal-400/10 text-teal-400 px-1.5 py-0.5 rounded-lg font-medium">{country.notes.length}</span>
                )}
                <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400" />
              </motion.button>
            ))
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-[#1a2d4a] flex flex-col gap-3">
          <p className="text-xs text-slate-600 text-center">Clic sur un pays · Molette pour zoomer</p>
          <div className="flex items-center gap-2 px-1">
            <span className="flex-1 text-xs text-slate-500 truncate">{userEmail}</span>
            <button onClick={onSignOut}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-red-400 transition-colors flex-shrink-0 py-1 px-2 rounded-lg hover:bg-red-400/10">
              <LogOut className="w-3.5 h-3.5" />
              Déconnexion
            </button>
          </div>
        </div>
      </aside>

      {/* ── Map area ──────────────────────────────── */}
      <div className="flex-1 relative" style={{ background: 'radial-gradient(ellipse at 50% 55%, #0d1e38 0%, #040810 75%)' }}>

        {/* Mobile top bar */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 md:hidden"
          style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 1rem)' }}>
          <button onClick={() => setSidebarOpen(true)}
            className="w-11 h-11 rounded-xl bg-[#0d1b2a]/90 backdrop-blur border border-[#1a2d4a] flex items-center justify-center text-slate-300 shadow-lg active:scale-95 transition-transform">
            <Menu className="w-5 h-5" />
          </button>
          <div className="bg-[#0d1b2a]/90 backdrop-blur border border-[#1a2d4a] rounded-xl px-3 py-2 flex items-center gap-2 shadow-lg">
            <MapPin className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-white text-sm font-bold">{visitedCount}</span>
            <span className="text-slate-500 text-xs">pays</span>
          </div>
          <div className="w-11 h-11" />
        </div>

        {/* The Map */}
        <ComposableMap
          width={MAP_W} height={MAP_H}
          projection="geoNaturalEarth1"
          projectionConfig={{ scale: 165, center: [10, 10] }}
          style={{ width: '100%', height: '100%', cursor: 'default' }}
        >
          <ZoomableGroup zoom={position.zoom} center={position.coordinates} onMoveEnd={setPosition} maxZoom={12}>
            <Geographies geography={GEO_URL}>
              {({ geographies }) =>
                geographies.map(geo => {
                  const iso = geo.properties.ISO_A3 === '-99' ? geo.properties.ISO_A3_EH : geo.properties.ISO_A3
                  const nameFr = geo.properties.NAME_FR || geo.properties.ADMIN
                  const visited = !!visitedCountries[iso]
                  const noteCount = visitedCountries[iso]?.notes?.length || 0
                  return (
                    <Geography key={geo.rsmKey} geography={geo}
                      onMouseEnter={e => { setTooltip({ name: nameFr, visited, noteCount }); setTooltipPos({ x: e.clientX, y: e.clientY }) }}
                      onMouseMove={e => setTooltipPos({ x: e.clientX, y: e.clientY })}
                      onMouseLeave={() => setTooltip(null)}
                      onClick={() => {
                        const c = geoCentroid(geo)
                        onCountryClick({ ISO_A3: iso, name: nameFr, nameEn: geo.properties.ADMIN, lat: c[1], lng: c[0] })
                      }}
                      style={{
                        default: { fill: visited ? '#b45309' : '#2d4a7a', stroke: '#0d1f38', strokeWidth: 0.5, outline: 'none', cursor: 'pointer' },
                        hover:   { fill: visited ? '#f59e0b' : '#3d6099', stroke: visited ? '#fbbf24' : '#5480bb', strokeWidth: 1, outline: 'none', cursor: 'pointer' },
                        pressed: { fill: visited ? '#92400e' : '#1e3a6e', outline: 'none' },
                      }}
                    />
                  )
                })
              }
            </Geographies>
          </ZoomableGroup>
        </ComposableMap>

        {/* Zoom controls */}
        <div className="absolute bottom-6 right-4 flex flex-col gap-2">
          <button onClick={() => setPosition(p => ({ ...p, zoom: Math.min(p.zoom * 1.5, 12) }))} className="map-btn">+</button>
          <button onClick={() => setPosition(p => ({ ...p, zoom: Math.max(p.zoom / 1.5, 1) }))} className="map-btn">−</button>
          <button onClick={() => setPosition({ coordinates: [10, 20], zoom: 1 })} className="map-btn text-xs" title="Reset">⊙</button>
        </div>

        {/* Legend */}
        <div className="absolute bottom-6 left-4 md:left-6 flex items-center gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-amber-600" /><span>Visité</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-[#2d4a7a]" /><span>Non visité</span></div>
        </div>
      </div>

      {/* Country tooltip */}
      <AnimatePresence>
        {tooltip && (
          <motion.div className="fixed z-50 pointer-events-none" style={{ left: tooltipPos.x + 14, top: tooltipPos.y - 48 }}
            initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.1 }}>
            <div className="bg-[#0d1b2a] border border-[#1a2d4a] rounded-xl px-3 py-2 shadow-2xl min-w-max">
              <div className="flex items-center gap-2">
                {tooltip.visited && <span className="w-5 h-5 rounded-full bg-amber-400/20 text-amber-400 text-xs flex items-center justify-center">✓</span>}
                <span className="text-white text-sm font-medium">{tooltip.name}</span>
              </div>
              {tooltip.noteCount > 0 && <p className="text-teal-400 text-xs mt-0.5">{tooltip.noteCount} souvenir{tooltip.noteCount > 1 ? 's' : ''}</p>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function StatCard({ value, label, icon, color }) {
  const colors = {
    amber: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
    teal:  'text-teal-400 bg-teal-400/10 border-teal-400/20',
  }
  return (
    <div className={`rounded-xl border p-3 text-center ${colors[color]}`}>
      <div className="flex justify-center mb-1">{icon}</div>
      <div className="text-xl font-bold">{value}</div>
      <div className="text-xs opacity-70">{label}</div>
    </div>
  )
}
