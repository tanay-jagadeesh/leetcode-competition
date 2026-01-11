import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const token_hash = requestUrl.searchParams.get('token_hash')
  const type = requestUrl.searchParams.get('type')
  const next = requestUrl.searchParams.get('next') || '/'

  // #region agent log
  console.log('[AUTH_CALLBACK]', { hasToken: !!token_hash, type, next })
  // #endregion

  if (token_hash && type) {
    // Create a server-side Supabase client for this request
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    try {
      // Verify the email confirmation token
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash,
        type: type as any
      })

      // #region agent log
      console.log('[AUTH_CALLBACK] Verification result', { 
        hasSession: !!data?.session, 
        hasUser: !!data?.user,
        userConfirmed: !!data?.user?.email_confirmed_at,
        error: error?.message 
      })
      // #endregion

      if (error) {
        console.error('Error verifying email:', error)
        // Redirect to home with error message
        return NextResponse.redirect(new URL(`/?error=email_verification_failed&message=${encodeURIComponent(error.message)}`, request.url))
      }
    } catch (err) {
      console.error('Error in email confirmation callback:', err)
      return NextResponse.redirect(new URL(`/?error=email_verification_failed`, request.url))
    }
  }

  // Redirect to home page after email confirmation
  return NextResponse.redirect(new URL(next, request.url))
}

