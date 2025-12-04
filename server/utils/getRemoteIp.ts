import type { H3Event } from 'h3'
import { getHeader } from 'h3'

export const getRemoteIp = (event: H3Event) => {
  const forwarded = getHeader(event, 'x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0]?.trim() || ''
  }
  const realIp = getHeader(event, 'x-real-ip')
  if (realIp) return realIp
  return event.node.req.socket.remoteAddress || ''
}
