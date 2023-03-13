import { serve } from 'std/server'
import { createClient } from '@supabase/supabase-js'
import { corsHeaders } from '../_shared/cors.ts'
import { joinTeamInvitation, searchUserProfileIdByUserId } from './functions.ts'
import { CustomError } from './models.ts'


console.log(`Function "team_invitation" up and running!`)


serve(async (req) => {
  // This is needed if you're planning to invoke your function from a browser.
  const { url, method } = req
  if (method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  try {
    // Create a Supabase client with current user context.
    const currentUserSupabaseClient = createClient(
      // Supabase API URL - env var exported by default.
      Deno.env.get('SUPABASE_URL') ?? '',
      // Supabase ANON KEY - env var exported by default.
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      // Create client with Auth context of the user that called the function.
      // This way your row-level-security (RLS) policies are applied.
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // Now we can get the session or user object
    const {
      data: { user },
    } = await currentUserSupabaseClient.auth.getUser()

    // Create a Supabase client with Admin context.
    const adminSupabaseClient = createClient(
      // Supabase API URL - env var exported by default.
      Deno.env.get('SUPABASE_URL') ?? '',
      // Supabase SERVICE ROLE - env var exported by default.
      Deno.env.get('SERVICE_ROLE') ?? ''
    )

    // Search user profile with user id and admin context
    const userId: string = await searchUserProfileIdByUserId(adminSupabaseClient, user!.id)

    // Obtaining code from url
    const taskPattern = new URLPattern({ pathname: '/team_invitation/join/:code' })
    const matchingPath = taskPattern.exec(url)
    const receivedCode = matchingPath ? matchingPath.pathname.groups.code : null

    // Obtaining team-invitation-id from headers
    // let invitationId = null
    // if (method === 'GET') {
    //   invitationId = await req.headers.get("team-invitation-id")
    // }

    // Filter request methods
    switch (true) {
      case method === 'GET':
        return await joinTeamInvitation(adminSupabaseClient, userId, receivedCode as string)
      default:
        throw new CustomError('Method request must be GET', 400)
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: error.statusCode || 400,
    })
  }
})

// To invoke:
// curl -i --location --request GET 'http://localhost:54321/functions/v1/team_invitation/join/97c315c1-4603-4172-b033-e527e049cc5e' \
//   --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
