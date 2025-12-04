import prisma from '~~/prisma/prisma'
import { requireUser } from '~~/server/utils/session'
import { getRequestURL } from 'h3'
import { useRuntimeConfig } from '#imports'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const config = useRuntimeConfig()
  const baseUrl = config.public.WEBSITE_URL || getRequestURL(event).origin

  const links = await prisma.short_link.findMany({
    where: { user_id: user.id },
    orderBy: { created: 'desc' }
  })

  return links.map((link) => ({
    id: link.id,
    alias: link.alias,
    short_url: `${baseUrl}/s/${link.alias}`,
    destination_url: link.destination_url,
    description: link.description,
    status: link.status,
    expires_at: link.expires_at,
    max_visits: link.max_visits,
    visit_count: link.visit_count,
    last_visited_at: link.last_visited_at,
    created: link.created
  }))
})
