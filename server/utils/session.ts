import crypto from 'node:crypto'
import type { H3Event } from 'h3'
import { setCookie, getCookie, deleteCookie } from 'h3'
import prisma from '~~/prisma/prisma'
import { kunError } from './kunError'

const SESSION_COOKIE = 'kun_link_session'
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7

const cookieOptions = {
  httpOnly: true,
  sameSite: 'strict' as const,
  path: '/',
  secure: process.env.NODE_ENV === 'production'
}

const createToken = () => crypto.randomBytes(32).toString('hex')

export const createSession = async (
  event: H3Event,
  userId: number,
  meta: { ip?: string; userAgent?: string }
) => {
  const token = createToken()
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS)

  await prisma.auth_session.create({
    data: {
      token,
      user_id: userId,
      ip: meta.ip || '',
      user_agent: meta.userAgent || '',
      expires_at: expiresAt
    }
  })

  setCookie(event, SESSION_COOKIE, token, {
    ...cookieOptions,
    expires: expiresAt
  })
}

export const getSessionToken = (event: H3Event) => {
  return getCookie(event, SESSION_COOKIE)
}

export const getSession = async (event: H3Event) => {
  const token = getSessionToken(event)
  if (!token) return null

  const session = await prisma.auth_session.findUnique({
    where: { token },
    include: { user: true }
  })

  if (!session) {
    deleteCookie(event, SESSION_COOKIE, cookieOptions)
    return null
  }

  if (session.expires_at < new Date()) {
    await prisma.auth_session.delete({ where: { id: session.id } })
    deleteCookie(event, SESSION_COOKIE, cookieOptions)
    return null
  }

  return session
}

export const requireUser = async (event: H3Event) => {
  const session = await getSession(event)
  if (!session) {
    kunError(event, '未登录', 401, 401)
    throw new Error('Unauthorized')
  }
  return session.user
}

export const revokeSession = async (event: H3Event) => {
  const token = getSessionToken(event)
  if (!token) return
  await prisma.auth_session.deleteMany({ where: { token } })
  deleteCookie(event, SESSION_COOKIE, cookieOptions)
}
