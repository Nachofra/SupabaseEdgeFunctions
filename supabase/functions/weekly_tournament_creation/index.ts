import * as postgres from 'postgres'
import { serve } from 'std/server'

// Get the connection string from the environment variable "DATABASE_URL"
const databaseUrl = Deno.env.get('DATABASE_URL')!


// Create a database pool with three connections that are lazily established
const pool = new postgres.Pool(databaseUrl, 3, true)

serve(async (_req) => {
  try {
    // Grab a connection from the pool
    const connection = await pool.connect()

    try {
      // Run a query
      const result = await connection.queryObject(`
        INSERT INTO tournament(tournament_type, admin, name, public, max_teams, min_teams, time_to_confirm, status, description, participants)
        VALUES(1, 'f91b4c9f-6b29-4ce4-9726-2521ccfe5a2b', 'JoyCup', true, 20, 10, 15, 'open', 'The most famous League of Legends cup, now in 1versus1', '{"JoyBoy", "Fabrooos", "Nachofra"}')`)
      const tournament = result.rows
      console.log(tournament)

      // Encode the result as pretty printed JSON
      const body = JSON.stringify(tournament)

      // Return the response with the correct content type header
      return new Response(body, {
        status: 200,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
      })
    } finally {
      // Release the connection back into the pool
      connection.release()
    }
  } catch (err) {
    console.error(err)
    return new Response(String(err?.message ?? err), { status: 500 })
  }
})