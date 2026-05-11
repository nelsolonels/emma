import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Toaster } from 'react-hot-toast'
import WorldMap from './components/WorldMap'
import CountrySheet from './components/CountrySheet'
import AuthModal from './components/AuthModal'
import { useTravel } from './hooks/useTravel'
import { useAuth } from './hooks/useAuth'

export default function App() {
  const { user, loading: authLoading, signIn, signUp, signOut } = useAuth()
  const travel = useTravel(user?.id)
  const [selectedCountry, setSelectedCountry] = useState(null)

  // Show nothing while checking session
  if (authLoading) {
    return (
      <div className="w-screen h-screen flex items-center justify-center" style={{ background: '#040810' }}>
        <div className="w-8 h-8 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
      </div>
    )
  }

  // Not logged in → auth screen
  if (!user) {
    return (
      <>
        <Toaster position="top-center" />
        <AuthModal onSignIn={signIn} onSignUp={signUp} />
      </>
    )
  }

  return (
    <div className="w-screen h-screen overflow-hidden bg-space font-sans relative">
      <Toaster
        position="top-center"
        toastOptions={{
          style: { background: '#132236', color: '#e2e8f0', border: '1px solid #1a2d4a', borderRadius: '12px', fontSize: '14px' },
          success: { iconTheme: { primary: '#f59e0b', secondary: '#132236' } },
        }}
      />

      <WorldMap
        visitedCountries={travel.visitedCountries}
        onCountryClick={setSelectedCountry}
        userEmail={user.email}
        onSignOut={signOut}
      />

      <AnimatePresence>
        {selectedCountry && (
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
