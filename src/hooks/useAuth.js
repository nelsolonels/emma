import { useState, useEffect } from 'react'
import { supabase, hasSupabase } from '../lib/supabase'

export function useAuth() {
  const [user, setUser] = useState(null)
  // If Supabase isn't configured, skip auth entirely (localStorage mode)
  const [loading, setLoading] = useState(hasSupabase)

  useEffect(() => {
    if (!hasSupabase) return

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    }).catch(() => setLoading(false))

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = (email, password) =>
    hasSupabase
      ? supabase.auth.signInWithPassword({ email, password })
      : Promise.resolve({ error: { message: 'Supabase non configuré' } })

  const signUp = (email, password) =>
    hasSupabase
      ? supabase.auth.signUp({ email, password })
      : Promise.resolve({ error: { message: 'Supabase non configuré' } })

  const signOut = () =>
    hasSupabase ? supabase.auth.signOut() : Promise.resolve()

  return { user, loading, hasSupabase, signIn, signUp, signOut }
}
