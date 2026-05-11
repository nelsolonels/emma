import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Toaster } from 'react-hot-toast'
import WorldMap from './components/WorldMap'
import CountrySheet from './components/CountrySheet'
import AuthModal from './components/AuthModal'
import { useTravel } from './hooks/useTravel'
import { useAuth } from './hooks/useAuth'

export default function App() {
  const { user, loading: authLoading, hasSupabase, signIn, signUp, signOut } = useAuth()
  const travel = useTravel(user?.id)
  const [selectedCountry, setSelectedCountry] = useState(null)

  return (
    <div className="w-screen h-screen overflow-hidden font-sans relative" style={{ background: '#040810' }}>
      <Toaster
        position="top-center"
        toastOptions={{
          style: { background: '#132236', color: '#e2e8f0', border: '1px solid #1a2d4a', borderRadius: '12px', fontSize: '14px' },
          success: { iconTheme: { primary: '#f59e0b', secondary: '#132236' } },
        }}
      />

      {/* Map always rendered — serves as background even during auth */}
      <div className={user ? '' : 'pointer-events-none select-none'}>
        <WorldMap
          visitedCountries={travel.visitedCountries}
          onCountryClick={setSelectedCountry}
          userEmail={user?.email}
          onSignOut={signOut}
        />
      </div>

      {/* Auth overlay — only when Supabase is configured and user not logged in */}
      <AnimatePresence>
        {hasSupabase && (!user || authLoading) && (
          authLoading ? (
            <motion.div key="loading"
              className="fixed inset-0 z-40 flex items-center justify-center"
              style={{ background: '#040810' }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="w-8 h-8 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
            </motion.div>
          ) : (
            <motion.div key="auth" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <AuthModal onSignIn={signIn} onSignUp={signUp} />
            </motion.div>
          )
        )}
      </AnimatePresence>

      {/* Country bottom sheet */}
      <AnimatePresence>
        {(!hasSupabase || user) && selectedCountry && (
          <CountrySheet
            key={selectedCountry.ISO_A3}
            country={selectedCountry}
            notes={travel.getNotes(selectedCountry.ISO_A3)}
            isVisited={travel.isVisited(selectedCountry.ISO_A3)}
            onClose={() => setSelectedCountry(null)}
            onToggleVisited={() => travel.toggleVisited(selectedCountry.ISO_A3, selectedCountry.name)}
            onAddNote={(note) => travel.addNote(selectedCountry.ISO_A3, selectedCountry.name, note)}
            onDeleteNote={(id) => travel.deleteNote(selectedCountry.ISO_A3, id)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
