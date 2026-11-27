import { createError, getRouterParams, type RequestEvent } from 'nuxt/server'

/**
 * The route's params, checked by `validate` (a Zod `.parse`, for instance). `nuxt/server` validates the query and
 * the body but not params; a param `validate` rejects is a 400, as h3's `getValidatedRouterParams` answered.
 */
export async function getValidatedParams<T>(event: Pick<RequestEvent, 'context'>, validate: (params: Record<string, string | undefined>) => T | Promise<T>): Promise<T> {
  try {
    return await validate(getRouterParams(event, { decode: true }))
  } catch (cause) {
    throw createError({ status: 400, statusText: 'Validation failed', message: 'Validation failed', cause })
  }
}
