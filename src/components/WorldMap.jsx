import { useState, useCallback, useRef } from 'react'
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Globe, MapPin, Camera, BookOpen, ChevronRight,
  Search, TrendingUp, X, Compass,
} from 'lucide-react'

const GEO_URL =
  'https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson'

const VISITED_FILL = '#d97706'
const VISITED_HOVER = '#f59e0b'
const DEFAULT_FILL = '#1a2744'
const DEFAULT_HOVER = '#243a5e'

export default function WorldMap({ visitedCountries, onCountryClick }) {
  const [tooltip, setTooltip] = useState(null)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })
  const [search, setSearch] = useState('')
  const [position, setPosition] = useState({ coordinates: [10, 20], zoom: 1 })
  const mapRef = useRef()

  const visitedCount = Object.keys(visitedCountries).length
  const notesCount = Object.values(visitedCountries).reduce(
    (acc, c) => acc + (c.notes?.length || 0), 0
  )
  const photosCount = Object.values(visitedCountries).reduce(
    (acc, c) => acc + (c.notes || []).reduce((a, n) => a + (n.photos?.length || 0), 0), 0
  )

  const filteredVisited = Object.values(visitedCountries).filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="w-full h-full flex relative overflow-hidden">
      {/* Background stars */}
      <div className="absolute inset-0 bg-space pointer-events-none">
        {[...Array(60)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white opacity-20"
            style={{
              width: Math.random() * 2 + 1 + 'px',
              height: Math.random() * 2 + 1 + 'px',
              left: Math.random() * 100 + '%',
              top: Math.random() * 100 + '%',
              animation: `pulse ${2 + Math.random() * 3}s ease-in-out infinite`,
              animationDelay: Math.random() * 3 + 's',
            }}
          />
        ))}
      </div>

      {/* Sidebar */}
      <aside className="sidebar-panel">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center">
            <Globe className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg leading-none tracking-widest">EMMA</h1>
            <p className="text-slate-500 text-xs mt-0.5">Mes aventures</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          <StatCard value={visitedCount} label="Pays" icon={<MapPin className="w-4 h-4" />} color="amber" />
          <StatCard value={notesCount} label="Souvenirs" icon={<BookOpen className="w-4 h-4" />} color="teal" />
          <StatCard value={photosCount} label="Photos" icon={<Camera className="w-4 h-4" />} color="violet" />
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between text-xs text-slate-400 mb-2">
            <span className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Monde exploré
            </span>
            <span className="text-amber-400 font-medium">
              {Math.round((visitedCount / 195) * 100)}%
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-navy-500 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-300"
              initial={{ width: 0 }}
              animate={{ width: `${(visitedCount / 195) * 100}%` }}
              transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
            />
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher..."
            className="w-full bg-navy-600 border border-navy-500 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-300 placeholder-slate-600 focus:outline-none focus:border-amber-400/50 transition-colors"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-4 h-4 text-slate-500 hover:text-slate-300" />
            </button>
          )}
        </div>

        {/* Visited list */}
        <div className="flex-1 overflow-y-auto min-h-0 space-y-1 pr-1 custom-scroll">
          <p className="text-xs text-slate-600 uppercase tracking-widest font-semibold mb-3">
            Pays visités
          </p>

          {filteredVisited.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Compass className="w-10 h-10 text-navy-500 mb-3" />
              <p className="text-slate-500 text-sm">
                {search ? 'Aucun résultat' : 'Cliquez sur un pays pour commencer votre voyage !'}
              </p>
            </div>
          ) : (
            filteredVisited
              .sort((a, b) => a.name.localeCompare(b.name))
              .map(country => (
                <motion.button
                  key={country.iso}
                  layout
                  onClick={() => onCountryClick({ ISO_A3: country.iso, name: country.name })}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-navy-600 transition-colors group text-left"
                >
                  <div className="w-6 h-6 rounded-lg bg-amber-400/10 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-3 h-3 text-amber-400" />
                  </div>
                  <span className="flex-1 text-slate-300 text-sm group-hover:text-white transition-colors truncate">
                    {country.name}
                  </span>
                  {country.notes?.length > 0 && (
                    <span className="text-xs bg-teal-400/10 text-teal-400 px-1.5 py-0.5 rounded-lg font-medium">
                      {country.notes.length}
                    </span>
                  )}
                  <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
                </motion.button>
              ))
          )}
        </div>

        {/* Hint */}
        <div className="mt-4 pt-4 border-t border-navy-500">
          <p className="text-xs text-slate-600 text-center">
            🖱️ Cliquez sur un pays pour explorer · Molette pour zoomer
          </p>
        </div>
      </aside>

      {/* Map area */}
      <div
        ref={mapRef}
        className="flex-1 relative"
        style={{ background: 'radial-gradient(ellipse at 50% 60%, #0a1628 0%, #050b14 80%)' }}
      >
        <ComposableMap
          projection="geoNaturalEarth1"
          projectionConfig={{ scale: 165, center: [10, 10] }}
          style={{ width: '100%', height: '100%' }}
        >
          <ZoomableGroup
            zoom={position.zoom}
            center={position.coordinates}
            onMoveEnd={pos => setPosition(pos)}
            maxZoom={12}
          >
            <Geographies geography={GEO_URL}>
              {({ geographies }) =>
                geographies.map(geo => {
                  const iso = geo.properties.ISO_A3
                  const name = geo.properties.ADMIN
                  const visited = !!visitedCountries[iso]
                  const noteCount = visitedCountries[iso]?.notes?.length || 0

                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      onMouseEnter={(e) => {
                        setTooltip({ name, visited, noteCount })
                        setTooltipPos({ x: e.clientX, y: e.clientY })
                      }}
                      onMouseMove={(e) => {
                        setTooltipPos({ x: e.clientX, y: e.clientY })
                      }}
                      onMouseLeave={() => setTooltip(null)}
                      onClick={() => onCountryClick({ ISO_A3: iso, name })}
                      style={{
                        default: {
                          fill: visited
                            ? noteCount > 3 ? '#b45309' : VISITED_FILL
                            : DEFAULT_FILL,
                          stroke: '#0a1220',
                          strokeWidth: 0.4,
                          outline: 'none',
                          cursor: 'pointer',
                          transition: 'fill 0.15s',
                        },
                        hover: {
                          fill: visited ? VISITED_HOVER : DEFAULT_HOVER,
                          stroke: visited ? '#fbbf24' : '#2d4a7a',
                          strokeWidth: 0.8,
                          outline: 'none',
                          cursor: 'pointer',
                          filter: visited ? 'brightness(1.2)' : 'none',
                        },
                        pressed: {
                          fill: visited ? '#92400e' : '#1e3a6e',
                          outline: 'none',
                        },
                      }}
                    />
                  )
                })
              }
            </Geographies>
          </ZoomableGroup>
        </ComposableMap>

        {/* Zoom controls */}
        <div className="absolute bottom-6 right-6 flex flex-col gap-2">
          <button
            onClick={() => setPosition(p => ({ ...p, zoom: Math.min(p.zoom * 1.5, 12) }))}
            className="map-btn"
          >
            +
          </button>
          <button
            onClick={() => setPosition(p => ({ ...p, zoom: Math.max(p.zoom / 1.5, 1) }))}
            className="map-btn"
          >
            −
          </button>
          <button
            onClick={() => setPosition({ coordinates: [10, 20], zoom: 1 })}
            className="map-btn text-xs"
            title="Reset"
          >
            ⊙
          </button>
        </div>

        {/* Legend */}
        <div className="absolute bottom-6 left-6 flex items-center gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-amber-600" />
            <span>Visité</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-navy-500" />
            <span>Non visité</span>
          </div>
        </div>
      </div>

      {/* Tooltip */}
      <AnimatePresence>
        {tooltip && (
          <motion.div
            className="fixed z-50 pointer-events-none"
            style={{ left: tooltipPos.x + 14, top: tooltipPos.y - 44 }}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
          >
            <div className="bg-navy-700 border border-navy-500 rounded-xl px-3 py-2 shadow-2xl min-w-max">
              <div className="flex items-center gap-2">
                {tooltip.visited && (
                  <span className="w-5 h-5 rounded-full bg-amber-400/20 text-amber-400 text-xs flex items-center justify-center">✓</span>
                )}
                <span className="text-white text-sm font-medium">{tooltip.name}</span>
              </div>
              {tooltip.noteCount > 0 && (
                <p className="text-teal-400 text-xs mt-0.5">{tooltip.noteCount} souvenir{tooltip.noteCount > 1 ? 's' : ''}</p>
              )}
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
    teal: 'text-teal-400 bg-teal-400/10 border-teal-400/20',
    violet: 'text-violet-400 bg-violet-400/10 border-violet-400/20',
  }
  return (
    <div className={`rounded-xl border p-3 text-center ${colors[color]}`}>
      <div className="flex justify-center mb-1">{icon}</div>
      <div className="text-xl font-bold">{value}</div>
      <div className="text-xs opacity-70">{label}</div>
    </div>
  )
}
