import { useState, useCallback, useRef } from 'react'
import { ComposableMap, Geographies, Geography, ZoomableGroup, useMapContext } from 'react-simple-maps'
import { geoCircle } from 'd3-geo'
import { motion, AnimatePresence } from 'framer-motion'
import { Globe, MapPin, Camera, BookOpen, ChevronRight, Search, TrendingUp, X, Compass, Menu, Paintbrush, Trash2 } from 'lucide-react'
import { AnimatePresence as AP } from 'framer-motion'
import RadiusModal from './RadiusModal'
import toast from 'react-hot-toast'

const GEO_URL = 'https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson'
const MAP_W = 800
const MAP_H = 450

// Renders geographic circles using the map projection from context
function PaintedZones({ zones, onRemove }) {
  const { path: pathGen } = useMapContext()
  const [hovered, setHovered] = useState(null)

  if (!zones?.length || !pathGen) return null

  return (
    <g>
      {zones.map(zone => {
        const radiusDeg = zone.radiusKm / 111
        try {
          const circle = geoCircle().center([zone.lng, zone.lat]).radius(radiusDeg)()
          const d = pathGen(circle)
          if (!d) return null
          const isHov = hovered === zone.id
          const centroid = pathGen.centroid(circle)
          if (!centroid || isNaN(centroid[0])) return null
          return (
            <g key={zone.id}>
              <path
                d={d}
                fill={isHov ? 'rgba(251,191,36,0.32)' : 'rgba(245,158,11,0.22)'}
                stroke={isHov ? 'rgba(251,191,36,0.95)' : 'rgba(245,158,11,0.7)'}
                strokeWidth={isHov ? 1.8 : 1.2}
                strokeDasharray="6 3"
                style={{ cursor: 'pointer', transition: 'all 0.2s', pointerEvents: 'all' }}
                onMouseEnter={() => setHovered(zone.id)}
                onMouseLeave={() => setHovered(null)}
              />
              {/* Center dot — click to delete */}
              <circle
                cx={centroid[0]}
                cy={centroid[1]}
                r={isHov ? 6 : 4}
                fill={isHov ? '#fbbf24' : '#f59e0b'}
                stroke="#050b14"
                strokeWidth={1.5}
                style={{ cursor: 'pointer', transition: 'all 0.2s', pointerEvents: 'all' }}
                onMouseEnter={() => setHovered(zone.id)}
                onMouseLeave={() => setHovered(null)}
                onClick={e => { e.stopPropagation(); onRemove(zone.id); toast.success('Zone supprimée') }}
              />
            </g>
          )
        } catch { return null }
      })}
    </g>
  )
}

// Bridge to capture projection for coordinate inversion on click
function ProjectionCapture({ projRef }) {
  const { projection } = useMapContext()
  projRef.current = projection
  return null
}

export default function WorldMap({ visitedCountries, zones, onCountryClick, onAddZone, onRemoveZone }) {
  const [tooltip, setTooltip] = useState(null)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })
  const [search, setSearch] = useState('')
  const [position, setPosition] = useState({ coordinates: [10, 20], zoom: 1 })
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [painting, setPainting] = useState(false)
  const [paintLoc, setPaintLoc] = useState(null)
  const [showRadiusModal, setShowRadiusModal] = useState(false)
  const [zoneHovered, setZoneHovered] = useState(null)
  const projRef = useRef(null)

  const visitedCount = Object.keys(visitedCountries).length
  const notesCount = Object.values(visitedCountries).reduce((a, c) => a + (c.notes?.length || 0), 0)
  const zonesCount = zones.length

  const filteredVisited = Object.values(visitedCountries)
    .filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name))

  // Convert SVG click to geographic coordinates (accounts for zoom/pan + viewBox)
  const svgToLatLng = useCallback((e) => {
    const proj = projRef.current
    if (!proj) return null
    const svg = e.currentTarget
    // createSVGPoint correctly handles viewBox, preserveAspectRatio, CSS transforms
    const pt = svg.createSVGPoint()
    pt.x = e.clientX
    pt.y = e.clientY
    const svgPt = pt.matrixTransform(svg.getScreenCTM().inverse())
    // Undo ZoomableGroup: translate(W/2, H/2) scale(zoom) translate(-cx, -cy)
    const [cx, cy] = proj(position.coordinates)
    const { zoom } = position
    const gX = cx + (svgPt.x - MAP_W / 2) / zoom
    const gY = cy + (svgPt.y - MAP_H / 2) / zoom
    const coords = proj.invert([gX, gY])
    if (!coords || isNaN(coords[0]) || isNaN(coords[1])) return null
    return { lat: coords[1], lng: coords[0] }
  }, [position])

  const handleSvgClick = useCallback((e) => {
    if (!painting) return
    const loc = svgToLatLng(e)
    if (loc) {
      setPaintLoc(loc)
      setShowRadiusModal(true)
      setPainting(false)
    }
  }, [painting, svgToLatLng])

  const handleSaveZone = (zone) => {
    onAddZone(zone)
    setShowRadiusModal(false)
    setPaintLoc(null)
    toast.success(`Zone "${zone.label}" peinte !`)
  }

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
        fixed md:relative z-30 md:z-auto
        h-full flex-shrink-0
        w-72 md:w-[280px]
        transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        sidebar-panel
      `}>
        {/* Close button (mobile only) */}
        <button onClick={() => setSidebarOpen(false)} className="absolute top-4 right-4 md:hidden w-8 h-8 rounded-xl bg-navy-600 flex items-center justify-center text-slate-400">
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
        <div className="grid grid-cols-3 gap-2 mb-5">
          <StatCard value={visitedCount} label="Pays" icon={<MapPin className="w-4 h-4" />} color="amber" />
          <StatCard value={notesCount} label="Souvenirs" icon={<BookOpen className="w-4 h-4" />} color="teal" />
          <StatCard value={zonesCount} label="Zones" icon={<Paintbrush className="w-4 h-4" />} color="violet" />
        </div>

        {/* Progress */}
        <div className="mb-5">
          <div className="flex justify-between text-xs text-slate-400 mb-2">
            <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Monde exploré</span>
            <span className="text-amber-400 font-medium">{Math.round((visitedCount / 195) * 100)}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-navy-500 overflow-hidden">
            <motion.div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-300"
              initial={{ width: 0 }} animate={{ width: `${(visitedCount / 195) * 100}%` }}
              transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }} />
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un pays…"
            className="w-full bg-navy-600 border border-navy-500 rounded-xl pl-9 pr-9 py-2.5 text-sm text-slate-300 placeholder-slate-600 focus:outline-none focus:border-amber-400/50 transition-colors" />
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
              <Compass className="w-10 h-10 text-navy-500 mb-3" />
              <p className="text-slate-500 text-sm">{search ? 'Aucun résultat' : 'Clique sur un pays pour commencer !'}</p>
            </div>
          ) : (
            filteredVisited.map(country => (
              <motion.button key={country.iso} layout
                onClick={() => { onCountryClick({ ISO_A3: country.iso, name: country.name }); setSidebarOpen(false) }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-navy-600 transition-colors group text-left mb-0.5"
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

          {/* Painted zones list */}
          {zones.length > 0 && (
            <>
              <p className="text-xs text-slate-600 uppercase tracking-widest font-semibold mb-3 mt-4">Zones peintes</p>
              {zones.map(zone => (
                <div key={zone.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl group mb-0.5">
                  <div className="w-6 h-6 rounded-lg bg-amber-400/10 flex items-center justify-center flex-shrink-0">
                    <Paintbrush className="w-3 h-3 text-amber-400" />
                  </div>
                  <span className="flex-1 text-slate-400 text-sm truncate">{zone.label}</span>
                  <span className="text-xs text-slate-600 mr-1">{zone.radiusKm}km</span>
                  <button onClick={() => { onRemoveZone(zone.id); toast.success('Zone supprimée') }}
                    className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center transition-all">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-navy-500">
          <p className="text-xs text-slate-600 text-center">Clic sur un pays · Molette pour zoomer</p>
        </div>
      </aside>

      {/* ── Map area ──────────────────────────────── */}
      <div className="flex-1 relative" style={{ background: 'radial-gradient(ellipse at 50% 60%, #0a1628 0%, #050b14 80%)' }}>

        {/* Mobile top bar */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 pt-safe pt-4 md:hidden">
          <button onClick={() => setSidebarOpen(true)}
            className="w-11 h-11 rounded-xl bg-navy-700/90 backdrop-blur border border-navy-500 flex items-center justify-center text-slate-300 shadow-lg active:scale-95 transition-transform">
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <div className="bg-navy-700/90 backdrop-blur border border-navy-500 rounded-xl px-3 py-2 flex items-center gap-2 shadow-lg">
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-white text-sm font-bold">{visitedCount}</span>
              <span className="text-slate-500 text-xs">pays</span>
            </div>
          </div>

          <button
            onClick={() => setPainting(p => !p)}
            className={`w-11 h-11 rounded-xl border flex items-center justify-center shadow-lg active:scale-95 transition-all ${
              painting
                ? 'bg-amber-400 border-amber-400 text-navy-800'
                : 'bg-navy-700/90 backdrop-blur border-navy-500 text-slate-300'
            }`}
          >
            <Paintbrush className="w-5 h-5" />
          </button>
        </div>

        {/* Desktop paint button */}
        <div className="absolute top-4 right-4 z-10 hidden md:flex flex-col gap-2">
          <button
            onClick={() => setPainting(p => !p)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all shadow-lg ${
              painting
                ? 'bg-amber-400 border-amber-400 text-navy-800'
                : 'bg-navy-700/90 backdrop-blur border-navy-500 text-slate-300 hover:border-amber-400/40 hover:text-amber-400'
            }`}
          >
            <Paintbrush className="w-4 h-4" />
            {painting ? 'Cliquez sur la carte…' : 'Peindre une zone'}
          </button>

          {/* Also open modal without clicking */}
          {!painting && (
            <button
              onClick={() => { setPaintLoc(null); setShowRadiusModal(true) }}
              className="text-xs text-slate-500 hover:text-slate-300 text-center transition-colors"
            >
              ou chercher un lieu →
            </button>
          )}
        </div>

        {/* Paint mode hint */}
        <AnimatePresence>
          {painting && (
            <motion.div
              className="absolute top-20 md:top-4 left-1/2 -translate-x-1/2 z-10 pointer-events-none"
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            >
              <div className="flex items-center gap-2 bg-amber-400 text-navy-800 text-sm font-semibold px-4 py-2.5 rounded-full shadow-xl">
                <MapPin className="w-4 h-4 animate-bounce" />
                Appuyez sur la carte pour placer une zone
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* The Map */}
        <ComposableMap
          width={MAP_W} height={MAP_H}
          projection="geoNaturalEarth1"
          projectionConfig={{ scale: 165, center: [10, 10] }}
          style={{ width: '100%', height: '100%', cursor: painting ? 'crosshair' : 'default' }}
          onClick={handleSvgClick}
        >
          <ZoomableGroup zoom={position.zoom} center={position.coordinates} onMoveEnd={setPosition} maxZoom={12}>
            <ProjectionCapture projRef={projRef} />

            <Geographies geography={GEO_URL}>
              {({ geographies }) =>
                geographies.map(geo => {
                  const iso = geo.properties.ISO_A3
                  const name = geo.properties.ADMIN
                  const visited = !!visitedCountries[iso]
                  const noteCount = visitedCountries[iso]?.notes?.length || 0
                  return (
                    <Geography key={geo.rsmKey} geography={geo}
                      onMouseEnter={e => { setTooltip({ name, visited, noteCount }); setTooltipPos({ x: e.clientX, y: e.clientY }) }}
                      onMouseMove={e => setTooltipPos({ x: e.clientX, y: e.clientY })}
                      onMouseLeave={() => setTooltip(null)}
                      onClick={() => { if (!painting) onCountryClick({ ISO_A3: iso, name }) }}
                      style={{
                        default: { fill: visited ? '#d97706' : '#1a2744', stroke: '#0a1220', strokeWidth: 0.4, outline: 'none', cursor: painting ? 'crosshair' : 'pointer' },
                        hover: { fill: visited ? '#f59e0b' : '#243a5e', stroke: visited ? '#fbbf24' : '#2d4a7a', strokeWidth: 0.8, outline: 'none', cursor: painting ? 'crosshair' : 'pointer' },
                        pressed: { fill: visited ? '#92400e' : '#1e3a6e', outline: 'none' },
                      }}
                    />
                  )
                })
              }
            </Geographies>

            {/* Zones rendered AFTER countries so they appear on top */}
            <PaintedZones zones={zones} onRemove={onRemoveZone} />
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
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-navy-500" /><span>Non visité</span></div>
          {zones.length > 0 && <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm border border-dashed border-amber-400/50 bg-amber-400/15" /><span>Zone peinte</span></div>}
        </div>
      </div>

      {/* Country tooltip */}
      <AnimatePresence>
        {tooltip && (
          <motion.div className="fixed z-50 pointer-events-none" style={{ left: tooltipPos.x + 14, top: tooltipPos.y - 48 }}
            initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.1 }}>
            <div className="bg-navy-700 border border-navy-500 rounded-xl px-3 py-2 shadow-2xl min-w-max">
              <div className="flex items-center gap-2">
                {tooltip.visited && <span className="w-5 h-5 rounded-full bg-amber-400/20 text-amber-400 text-xs flex items-center justify-center">✓</span>}
                <span className="text-white text-sm font-medium">{tooltip.name}</span>
              </div>
              {tooltip.noteCount > 0 && <p className="text-teal-400 text-xs mt-0.5">{tooltip.noteCount} souvenir{tooltip.noteCount > 1 ? 's' : ''}</p>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Radius modal */}
      <AnimatePresence>
        {showRadiusModal && (
          <RadiusModal
            location={paintLoc}
            onSave={handleSaveZone}
            onClose={() => { setShowRadiusModal(false); setPaintLoc(null) }}
          />
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
