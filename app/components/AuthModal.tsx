'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'

type AuthMode = 'login' | 'signup'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { signIn, signUp } = useAuth()

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (mode === 'login') {
        const { error } = await signIn(email, password)
        if (error) {
          // Check if error is due to unconfirmed email
          const errorMessage = error.message || ''
          if (errorMessage.toLowerCase().includes('email') && errorMessage.toLowerCase().includes('confirm')) {
            setError('Please check your email and click the confirmation link to verify your account before signing in.')
          } else {
            setError(error.message || 'Failed to sign in. Please check your credentials.')
          }
        } else {
          onClose()
          setEmail('')
          setPassword('')
        }
      } else {
        if (!username.trim()) {
          setError('Username is required')
          setLoading(false)
          return
        }
        const { error } = await signUp(email, password, username.trim())
        if (error) {
          setError(error.message || 'Failed to create account. Email may already be in use.')
        } else {
          setError(null)
          setMode('login')
          setEmail('')
          setPassword('')
          setUsername('')
          // Show success message - email confirmation is handled by Supabase
          alert('Account created! Please check your email and click the confirmation link to verify your account, then sign in.')
        }
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-card border border-border rounded-lg shadow-lg max-w-md w-full p-8">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-2 text-text">
            {mode === 'login' ? 'Sign In' : 'Create Account'}
          </h2>
          <p className="text-sm text-sub">
            {mode === 'login' 
              ? 'Sign in to save your progress and compete on leaderboards'
              : 'Create an account to track your stats and compete'}
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 p-3 bg-lose/10 border border-lose/30 rounded-lg">
            <p className="text-sm text-lose">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-sm font-medium text-text mb-2">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input w-full"
                placeholder="Choose a username"
                required
                disabled={loading}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-text mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input w-full"
              placeholder="your@email.com"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input w-full"
              placeholder="••••••••"
              required
              minLength={6}
              disabled={loading}
            />
            {mode === 'signup' && (
              <p className="text-xs text-sub mt-1">At least 6 characters</p>
            )}
          </div>

          <div className="flex flex-col gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full disabled:opacity-50"
            >
              {loading ? 'Loading...' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>

            <button
              type="button"
              onClick={() => {
                setMode(mode === 'login' ? 'signup' : 'login')
                setError(null)
                setEmail('')
                setPassword('')
                setUsername('')
              }}
              className="text-sm text-sub hover:text-text transition-colors"
              disabled={loading}
            >
              {mode === 'login' 
                ? "Don't have an account? Sign up"
                : 'Already have an account? Sign in'}
            </button>
          </div>
        </form>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-sub hover:text-text transition-colors"
          disabled={loading}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}


