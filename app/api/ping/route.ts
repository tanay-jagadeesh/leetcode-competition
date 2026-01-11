import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function POST(req: NextRequest) {
  try {
    const { playerId } = await req.json()

    if (!playerId) {
      return NextResponse.json(
        { error: 'Player ID is required' },
        { status: 400 }
      )
    }

    // Use service role key or anon key with proper RLS policies
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // First try to update last_seen for existing user
    const { data: updateData, error: updateError } = await supabase
      .from('user_profiles')
      .update({ last_seen: new Date().toISOString() })
      .eq('id', playerId)
      .select()

    // If no rows were updated, the user doesn't exist, so create a minimal profile
    if (!updateError && (!updateData || updateData.length === 0)) {
      const { error: insertError } = await supabase
        .from('user_profiles')
        .insert({
          id: playerId,
          username: 'Anonymous',
          total_points: 0,
          matches_played: 0,
          matches_won: 0,
          problems_solved: 0,
          last_seen: new Date().toISOString()
        })

      if (insertError) {
        console.error('Error inserting user profile:', insertError)
        return NextResponse.json(
          { error: 'Failed to create presence' },
          { status: 500 }
        )
      }
    } else if (updateError) {
      console.error('Error updating last_seen:', updateError)
      return NextResponse.json(
        { error: 'Failed to update presence' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in ping endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

