import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { tanstackStartCookies } from 'better-auth/tanstack-start'
import { username } from 'better-auth/plugins'
import { json } from '@tanstack/react-start'
import { db } from '#/db/index'

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'pg' }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [tanstackStartCookies(), username()],
})

export async function requireAuth(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session?.user) {
    throw json({ error: 'Unauthorized' }, { status: 401 })
  }
  return session
}
