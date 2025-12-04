import { z } from 'zod'
import prisma from '~~/prisma/prisma'
import { requireUser } from '~~/server/utils/session'
import { kunParseGetQuery } from '~~/server/utils/parseZod'
import { kunError } from '~~/server/utils/kunError'

const querySchema = z.object({
  range: z.coerce.number().min(1).max(30).optional()
})

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const alias = event.context.params?.alias
  if (!alias) {
    return kunError(event, '缺少短链', 400, 400)
  }

  const query = kunParseGetQuery(event, querySchema)
  if (typeof query === 'string') {
    return kunError(event, query, 422, 422)
  }
  const rangeDays = query.range ?? 7
  const rangeStart = new Date(Date.now() - rangeDays * 24 * 60 * 60 * 1000)

  const link = await prisma.short_link.findFirst({
    where: { alias, user_id: user.id }
  })

  if (!link) {
    return kunError(event, '短链不存在', 404, 404)
  }

  const [buckets, recent, uniqueVisitorGroups] = await Promise.all([
    prisma.short_link_visit_bucket.findMany({
      where: { short_link_id: link.id, bucket_start: { gte: rangeStart } },
      orderBy: { bucket_start: 'asc' }
    }),
    prisma.short_link_visit.findMany({
      where: { short_link_id: link.id },
      orderBy: { created: 'desc' },
      take: 10
    }),
    prisma.short_link_visit.groupBy({
      by: ['ip'],
      where: { short_link_id: link.id },
      _count: { _all: true }
    })
  ])
  const uniqueVisitors = uniqueVisitorGroups.length

  return {
    link: {
      alias: link.alias,
      destination_url: link.destination_url,
      description: link.description,
      created: link.created,
      visit_count: link.visit_count,
      expires_at: link.expires_at
    },
    summary: {
      total_visits: link.visit_count,
      unique_visitors: uniqueVisitors,
      last_visit: link.last_visited_at,
      range_days: rangeDays
    },
    buckets,
    recent
  }
})
