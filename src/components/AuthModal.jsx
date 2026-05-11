import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Globe, Mail, Lock, Eye, EyeOff, Loader } from 'lucide-react'

export default function AuthModal({ onSignIn, onSignUp }) {
  const [tab, setTab] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(''); setSuccess(''); setLoading(true)
    try {
      if (tab === 'login') {
        const { error } = await onSignIn(email, password)
        if (error) setError(translateError(error.message))
      } else {
        const { error } = await onSignUp(email, password)
        if (error) setError(translateError(error.message))
        else setSuccess('Vérifie tes e-mails pour confirmer ton compte !')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    /* Overlay sur la carte — fond semi-transparent flou */
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(to bottom, rgba(4,8,16,0.6) 0%, rgba(4,8,16,0.85) 100%)', backdropFilter: 'blur(6px)' }}>

      <motion.div
        className="w-full max-w-sm"
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <motion.div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-3 shadow-xl"
            style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.35)' }}
            animate={{ boxShadow: ['0 0 0px rgba(245,158,11,0)', '0 0 24px rgba(245,158,11,0.3)', '0 0 0px rgba(245,158,11,0)'] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <Globe className="w-8 h-8 text-amber-400" />
          </motion.div>
          <h1 className="text-white font-bold text-3xl tracking-widest">EMMA</h1>
          <p className="text-slate-400 text-sm mt-1">Colorie ta carte, garde tes souvenirs</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl overflow-hidden shadow-2xl" style={{ background: 'rgba(10,22,40,0.92)', border: '1px solid #1a2d4a' }}>
          {/* Tabs */}
          <div className="flex p-1 gap-1" style={{ background: '#080e1c' }}>
            {[
              { id: 'login', label: 'Se connecter' },
              { id: 'signup', label: 'Créer un compte' },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => { setTab(t.id); setError(''); setSuccess('') }}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all relative"
                style={{ color: tab === t.id ? '#050b14' : '#64748b' }}
              >
                {tab === t.id && (
                  <motion.div layoutId="auth-tab"
                    className="absolute inset-0 rounded-xl"
                    style={{ background: 'linear-gradient(to right, #f59e0b, #fbbf24)' }}
                    transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                  />
                )}
                <span className="relative z-10">{t.label}</span>
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="p-5 space-y-3">
            {/* Email */}
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="ton@email.com"
                required
                className="form-input pl-10"
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={tab === 'signup' ? 'Choisir un mot de passe (6 car. min.)' : 'Mot de passe'}
                required
                minLength={6}
                className="form-input pl-10 pr-10"
                autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
              />
              <button
                type="button"
                onClick={() => setShowPw(p => !p)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Feedback */}
            <AnimatePresence mode="wait">
              {error && (
                <motion.p key="err" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="text-red-400 text-sm px-1 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block flex-shrink-0" />
                  {error}
                </motion.p>
              )}
              {success && (
                <motion.p key="ok" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="text-teal-400 text-sm px-1 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400 inline-block flex-shrink-0" />
                  {success}
                </motion.p>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
              style={{ background: 'linear-gradient(to right, #f59e0b, #fbbf24)', color: '#050b14' }}
            >
              {loading && <Loader className="w-4 h-4 animate-spin" />}
              {tab === 'login' ? 'Se connecter' : 'Créer mon compte'}
            </button>
          </form>
        </div>

        <p className="text-center text-slate-600 text-xs mt-4">
          Tes données sont sauvegardées et accessibles partout
        </p>
      </motion.div>
    </div>
  )
}

function translateError(msg) {
  if (msg.includes('Invalid login credentials')) return 'Email ou mot de passe incorrect.'
  if (msg.includes('Email not confirmed')) return 'Confirme ton email avant de te connecter.'
  if (msg.includes('User already registered')) return 'Cet email est déjà utilisé.'
  if (msg.includes('Password should be at least')) return 'Le mot de passe doit faire au moins 6 caractères.'
  if (msg.includes('Unable to validate')) return 'Connexion impossible. Vérifie ta connexion.'
  return msg
}
