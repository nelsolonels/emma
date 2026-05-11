import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Globe, Mail, Lock, Eye, EyeOff, Loader } from 'lucide-react'

export default function AuthModal({ onSignIn, onSignUp }) {
  const [tab, setTab] = useState('login') // 'login' | 'signup'
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'radial-gradient(ellipse at 50% 40%, #0d1e38 0%, #040810 80%)' }}>

      <motion.div
        className="w-full max-w-sm"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center mb-4">
            <Globe className="w-7 h-7 text-amber-400" />
          </div>
          <h1 className="text-white font-bold text-2xl tracking-widest">EMMA</h1>
          <p className="text-slate-500 text-sm mt-1">Tes aventures, partout avec toi</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-6 shadow-2xl" style={{ background: '#0a1628', border: '1px solid #1a2d4a' }}>
          {/* Tabs */}
          <div className="flex rounded-xl p-1 mb-6" style={{ background: '#132236' }}>
            {['login', 'signup'].map(t => (
              <button key={t} onClick={() => { setTab(t); setError(''); setSuccess('') }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  tab === t ? 'bg-amber-400 text-[#050b14] shadow' : 'text-slate-400 hover:text-white'
                }`}>
                {t === 'login' ? 'Se connecter' : 'Créer un compte'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Email"
                required
                className="form-input pl-10"
              />
            </div>

            {/* Password */}
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Mot de passe"
                required
                minLength={6}
                className="form-input pl-10 pr-10"
              />
              <button type="button" onClick={() => setShowPw(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Error / Success */}
            <AnimatePresence>
              {error && (
                <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="text-red-400 text-sm px-1">{error}</motion.p>
              )}
              {success && (
                <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="text-teal-400 text-sm px-1">{success}</motion.p>
              )}
            </AnimatePresence>

            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(to right, #f59e0b, #fbbf24)', color: '#050b14' }}>
              {loading && <Loader className="w-4 h-4 animate-spin" />}
              {tab === 'login' ? 'Se connecter' : 'Créer mon compte'}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  )
}

function translateError(msg) {
  if (msg.includes('Invalid login credentials')) return 'Email ou mot de passe incorrect.'
  if (msg.includes('Email not confirmed')) return 'Confirme ton email avant de te connecter.'
  if (msg.includes('User already registered')) return 'Cet email est déjà utilisé.'
  if (msg.includes('Password should be at least')) return 'Le mot de passe doit faire au moins 6 caractères.'
  return msg
}
