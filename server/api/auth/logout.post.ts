import { revokeSession } from '~~/server/utils/session'

export default defineEventHandler(async (event) => {
  await revokeSession(event)
  return { success: true }
})
