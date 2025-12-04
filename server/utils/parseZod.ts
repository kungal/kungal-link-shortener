import type { z } from 'zod'
import type { H3Event } from 'h3'
import { readBody, getQuery } from 'h3'
import { kunError } from './kunError'

export const parseBodyAs = async <T extends z.ZodTypeAny>(
  event: H3Event,
  schema: T
): Promise<z.infer<T>> => {
  const body = await readBody(event)
  const result = schema.safeParse(body)
  if (!result.success) {
    const message = result.error.errors.at(0)?.message || '参数错误'
    kunError(event, message, 422, 422)
    throw result.error
  }
  return result.data
}

export const parseQueryAs = <T extends z.ZodTypeAny>(
  event: H3Event,
  schema: T
): z.infer<T> => {
  const result = schema.safeParse(getQuery(event))
  if (!result.success) {
    const message = result.error.errors.at(0)?.message || '参数错误'
    kunError(event, message, 422, 422)
    throw result.error
  }
  return result.data
}
