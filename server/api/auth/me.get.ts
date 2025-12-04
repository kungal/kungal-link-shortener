import { getSession } from '~~/server/utils/session'

export default defineEventHandler(async (event) => {
  const session = await getSession(event)
  if (!session) return null
  const { user } = session
  return {
    id: user.id,
    username: user.username,
    display_name: user.display_name,
    email: user.email,
    role: user.role
  }
})
