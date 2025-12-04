import { z } from 'zod'
import { getHeader } from 'h3'
import prisma from '~~/prisma/prisma'
import { kunParsePostBody } from '~~/server/utils/parseZod'
import { verifyPassword } from '~~/server/utils/password'
import { kunError } from '~~/server/utils/kunError'
import { createSession } from '~~/server/utils/session'
import { getRemoteIp } from '~~/server/utils/getRemoteIp'

const schema = z.object({
  username: z.string().min(2).max(50),
  password: z.string().min(6).max(255)
})

export default defineEventHandler(async (event) => {
  const body = await kunParsePostBody(event, schema)
  if (typeof body === 'string') {
    return kunError(event, body, 422, 422)
  }
  const { username, password } = body

  const user = await prisma.user.findUnique({ where: { username } })
  if (!user) {
    return kunError(event, '账号或密码错误', 401, 401)
  }

  const ok = await verifyPassword(password, user.password)
  if (!ok) {
    return kunError(event, '账号或密码错误', 401, 401)
  }

  await createSession(event, user.id, {
    ip: getRemoteIp(event),
    userAgent: getHeader(event, 'user-agent') || ''
  })

  await prisma.user.update({
    where: { id: user.id },
    data: {
      last_login_at: new Date(),
      last_login_ip: getRemoteIp(event)
    }
  })

  return {
    id: user.id,
    username: user.username,
    display_name: user.display_name,
    email: user.email,
    role: user.role
  }
})
