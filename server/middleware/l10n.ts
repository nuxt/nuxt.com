import type { H3Event } from 'h3'
import { hasProtocol, joinURL, withoutBase } from 'ufo'
import { localeRedirect } from '#shared/utils/l10n'

/** The target of the site's redirect rule for an English path, as Nitro would send it. */
function redirectRuleFor(pathname: string): string | undefined {
  const rules = getRouteRules({ path: pathname, context: {} } as unknown as H3Event)
  const redirect = rules.redirect as { to: string, _redirectStripBase?: string } | undefined
  if (!redirect) return
  if (!redirect.to.endsWith('/**')) return redirect.to

  const rest = redirect._redirectStripBase ? withoutBase(pathname, redirect._redirectStripBase) : pathname
  return joinURL(redirect.to.slice(0, -3), rest)
}

/**
 * Only localised docs pages are served under a locale prefix: everything else redirects,
 * to the localised index or to the English URL.
 */
export default defineEventHandler((event) => {
  const target = localeRedirect(event.path, redirectRuleFor)
  if (!target) return

  if (hasProtocol(target, { acceptRelative: true })) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid localised path' })
  }

  return sendRedirect(event, target, 302)
})
