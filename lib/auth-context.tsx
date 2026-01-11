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
    } = supabase.auth.onAuthStateChange((event, session) => {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/57ea0f00-4069-46d2-8141-8d61c6e09443',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/auth-context.tsx:42',message:'Auth state change',data:{event,hasSession:!!session,hasUser:!!session?.user,userConfirmed:session?.user?.email_confirmed_at?true:false},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)

      // Update cached user ID for getPlayerId()
      updateCachedAuthUserId(session?.user?.id ?? null)

      // When user signs in (or email is confirmed), ensure their profile exists
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
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/57ea0f00-4069-46d2-8141-8d61c6e09443',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/auth-context.tsx:88',message:'signIn called',data:{email},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    
    const { data: signInData, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/57ea0f00-4069-46d2-8141-8d61c6e09443',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/auth-context.tsx:94',message:'signIn response',data:{hasSession:!!signInData?.session,hasUser:!!signInData?.user,userConfirmed:signInData?.user?.email_confirmed_at?true:false,error:error?.message||null},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    
    // Handle specific error for unconfirmed email
    if (error && error.message?.includes('Email not confirmed')) {
      return { error: { ...error, message: 'Please check your email and click the confirmation link to verify your account.' } }
    }
    
    return { error }
  }

  const signUp = async (email: string, password: string, username: string) => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/57ea0f00-4069-46d2-8141-8d61c6e09443',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/auth-context.tsx:96',message:'signUp called',data:{email,hasUsername:!!username},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    const { data: signUpData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username }, // Store username in metadata
        emailRedirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback`
      }
    })

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/57ea0f00-4069-46d2-8141-8d61c6e09443',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/auth-context.tsx:106',message:'signUp response',data:{hasUser:!!signUpData?.user,hasSession:!!signUpData?.session,userConfirmed:signUpData?.user?.email_confirmed_at?true:false,error:authError?.message||null},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,B'})}).catch(()=>{});
    // #endregion

    if (authError) {
      return { error: authError }
    }

    // If email confirmation is required, user won't have a session yet
    // But we can still create the profile if user exists
    if (signUpData?.user) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/57ea0f00-4069-46d2-8141-8d61c6e09443',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/auth-context.tsx:116',message:'Creating profile for user',data:{userId:signUpData.user.id,emailConfirmed:!!signUpData.user.email_confirmed_at},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: signUpData.user.id,
          username: username,
          total_points: 0,
          matches_played: 0,
          matches_won: 0,
          problems_solved: 0,
          last_seen: new Date().toISOString()
        })

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/57ea0f00-4069-46d2-8141-8d61c6e09443',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/auth-context.tsx:129',message:'Profile creation result',data:{profileError:profileError?.message||null},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion

      if (profileError) {
        console.error('Error creating user profile:', profileError)
      }
    }

    // Return null error even if email confirmation is pending
    // The modal will show the appropriate message
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

