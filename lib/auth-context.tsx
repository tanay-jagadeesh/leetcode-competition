'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from './supabase'
import { updateCachedAuthUserId } from './session'

type AuthContextType = {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string, username: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null }),
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)

      // Update cached user ID for getPlayerId()
      updateCachedAuthUserId(session?.user?.id ?? null)

      // When user signs in, ensure their profile exists
      if (session?.user) {
        ensureUserProfile(session.user.id, session.user.email || 'Anonymous')
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const ensureUserProfile = async (userId: string, email: string) => {
    try {
      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('id', userId)
        .single()

      if (!existingProfile) {
        // Create profile for authenticated user
        const username = email.split('@')[0] || 'User'
        await supabase
          .from('user_profiles')
          .insert({
            id: userId,
            username: username,
            total_points: 0,
            matches_played: 0,
            matches_won: 0,
            problems_solved: 0,
            last_seen: new Date().toISOString()
          })
      }
    } catch (error) {
      console.error('Error ensuring user profile:', error)
    }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { error }
  }

  const signUp = async (email: string, password: string, username: string) => {
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (authError) {
      return { error: authError }
    }

    // Wait a moment for the user to be created, then update profile
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: user.id,
          username: username,
          total_points: 0,
          matches_played: 0,
          matches_won: 0,
          problems_solved: 0,
          last_seen: new Date().toISOString()
        })

      if (profileError) {
        console.error('Error creating user profile:', profileError)
      }
    }

    return { error: null }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

