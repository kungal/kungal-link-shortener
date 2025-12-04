import { z } from 'zod'
import prisma from '~~/prisma/prisma'
import { requireUser } from '~~/server/utils/session'
import { kunParsePostBody } from '~~/server/utils/parseZod'
import { kunError } from '~~/server/utils/kunError'
import { useRuntimeConfig } from '#imports'
import { getRequestURL } from 'h3'

const schema = z.object({
  destination_url: z.string().url(),
  alias: z
    .string()
    .trim()
    .min(4)
    .max(32)
    .regex(/^[a-zA-Z0-9-_]+$/)
    .or(z.literal(''))
    .optional(),
  description: z.string().max(500).optional(),
  expires_at: z.string().datetime().optional().nullable(),
  max_visits: z.number().int().min(0).max(1000000).optional(),
  forward_params: z.boolean().optional()
})

const alphabet = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const generateAlias = (length: number = 6) => {
  let alias = ''
  for (let i = 0; i < length; i++) {
    const idx = Math.floor(Math.random() * alphabet.length)
    alias += alphabet[idx]
  }
  return alias
}

const ensureAlias = async (alias?: string) => {
  if (alias) {
    const exists = await prisma.short_link.count({ where: { alias } })
    if (exists > 0) {
      throw new Error('短链已经存在')
    }
    return alias
  }
  for (let i = 0; i < 5; i++) {
    const candidate = generateAlias()
    const exists = await prisma.short_link.count({ where: { alias: candidate } })
    if (!exists) return candidate
  }
  throw new Error('未能生成短链')
}

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const payload = await kunParsePostBody(event, schema)
  if (typeof payload === 'string') {
    return kunError(event, payload, 422, 422)
  }
  let alias: string
  try {
    const aliasCandidate = payload.alias?.trim()
      ? payload.alias.trim()
      : undefined
    alias = await ensureAlias(aliasCandidate)
  } catch (error) {
    return kunError(event, error instanceof Error ? error.message : '别名不可用', 400, 400)
  }

  const expiresAt = payload.expires_at ? new Date(payload.expires_at) : null
  const description = payload.description?.trim() || ''
  const forwardParams = payload.forward_params ?? false

  const link = await prisma.short_link.create({
    data: {
      alias,
      destination_url: payload.destination_url,
      description,
      expires_at: expiresAt,
      max_visits: payload.max_visits ?? 0,
      forward_params: forwardParams,
      user_id: user.id
    }
  })

  const config = useRuntimeConfig()
  const baseUrl = config.public.WEBSITE_URL || getRequestURL(event).origin

  return {
    id: link.id,
    alias: link.alias,
    short_url: `${baseUrl}/s/${link.alias}`,
    destination_url: link.destination_url,
    description: link.description,
    expires_at: link.expires_at,
    max_visits: link.max_visits,
    forward_params: link.forward_params,
    status: link.status,
    created: link.created
  }
})
