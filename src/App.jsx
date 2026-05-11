import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Toaster } from 'react-hot-toast'
import WorldMap from './components/WorldMap'
import CountryView from './components/CountryView'
import { useTravel } from './hooks/useTravel'

export default function App() {
  const [selectedCountry, setSelectedCountry] = useState(null)
  const travel = useTravel()

  return (
    <div className="w-screen h-screen overflow-hidden bg-space font-sans">
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: '#132236',
            color: '#e2e8f0',
            border: '1px solid #1a2d4a',
            borderRadius: '12px',
            fontSize: '14px',
          },
          success: { iconTheme: { primary: '#f59e0b', secondary: '#132236' } },
        }}
      />
      <AnimatePresence mode="wait">
        {!selectedCountry ? (
          <motion.div key="world" className="w-full h-full"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 1.04 }}
            transition={{ duration: 0.4 }}>
            <WorldMap
              visitedCountries={travel.visitedCountries}
              zones={travel.zones}
              onCountryClick={setSelectedCountry}
              onAddZone={travel.addZone}
              onRemoveZone={travel.removeZone}
            />
          </motion.div>
        ) : (
          <motion.div key="country" className="w-full h-full"
            initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.4 }}>
            <CountryView
              country={selectedCountry}
              notes={travel.getNotes(selectedCountry.ISO_A3)}
              isVisited={travel.isVisited(selectedCountry.ISO_A3)}
              onBack={() => setSelectedCountry(null)}
              onAddNote={(note) => travel.addNote(selectedCountry.ISO_A3, selectedCountry.name, note)}
              onDeleteNote={(id) => travel.deleteNote(selectedCountry.ISO_A3, id)}
              onToggleVisited={() => travel.toggleVisited(selectedCountry.ISO_A3, selectedCountry.name)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
