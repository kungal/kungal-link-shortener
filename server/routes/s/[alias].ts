import { createError, sendRedirect, getRequestURL, getHeader } from 'h3'
import prisma from '~~/prisma/prisma'
import { getRemoteIp } from '~~/server/utils/getRemoteIp'

const BUCKET_SIZE_MS = 60 * 60 * 1000

const buildDestination = (url: string, forward: boolean, search: string) => {
  if (!forward || !search) return url
  const glue = url.includes('?') ? '&' : '?'
  return `${url}${glue}${search.slice(1)}`
}

const bucketStart = (date: Date) => {
  const copy = new Date(date)
  copy.setMinutes(0, 0, 0)
  return copy
}

export default defineEventHandler(async (event) => {
  const alias = event.context.params?.alias
  if (!alias) {
    throw createError({ statusCode: 404, statusMessage: 'Not found' })
  }

  const link = await prisma.short_link.findUnique({ where: { alias } })
  if (!link) {
    throw createError({ statusCode: 404, statusMessage: 'Link not found' })
  }

  if (link.status !== 0) {
    throw createError({ statusCode: 410, statusMessage: 'Link disabled' })
  }

  if (link.expires_at && link.expires_at < new Date()) {
    throw createError({ statusCode: 410, statusMessage: 'Link expired' })
  }

  if (link.max_visits > 0 && link.visit_count >= link.max_visits) {
    throw createError({ statusCode: 410, statusMessage: 'Visit limit reached' })
  }

  const url = getRequestURL(event)
  const destination = buildDestination(link.destination_url, link.forward_params, url.search)

  const ip = getRemoteIp(event)
  const userAgent = getHeader(event, 'user-agent') || ''
  const referer = getHeader(event, 'referer') || ''
  const now = new Date()
  const bucket = bucketStart(now)

  const uniqueVisit = ip
    ? !(await prisma.short_link_visit.findFirst({
        where: {
          short_link_id: link.id,
          ip,
          created: { gte: new Date(Date.now() - BUCKET_SIZE_MS) }
        }
      }))
    : false

  await prisma.$transaction([
    prisma.short_link.update({
      where: { id: link.id },
      data: {
        visit_count: { increment: 1 },
        last_visited_at: now
      }
    }),
    prisma.short_link_visit.create({
      data: {
        short_link_id: link.id,
        ip,
        user_agent: userAgent,
        referer,
        is_unique: uniqueVisit
      }
    }),
    prisma.short_link_visit_bucket.upsert({
      where: {
        short_link_id_bucket_start: {
          short_link_id: link.id,
          bucket_start: bucket
        }
      },
      update: {
        visits: { increment: 1 },
        unique_ips: { increment: uniqueVisit ? 1 : 0 }
      },
      create: {
        short_link_id: link.id,
        bucket_start: bucket,
        visits: 1,
        unique_ips: uniqueVisit ? 1 : 0
      }
    })
  ])

  return sendRedirect(event, destination, 302)
})
