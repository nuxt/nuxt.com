import { decodePath, hasProtocol, joinURL, withoutBase } from 'ufo'
import { localeRedirect } from '#shared/utils/l10n'
import { createError, defineHandler, matchRouteRules, sendRedirect } from 'nuxt/server'

/** The target of the site's redirect rule for an English path, as Nitro would send it. */
function redirectRuleFor(pathname: string): string | undefined {
  const rules = matchRouteRules(pathname)
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
export default defineHandler((event) => {
  const target = localeRedirect(decodePath(event.url.pathname) + event.url.search, redirectRuleFor)
  if (!target) return

  if (hasProtocol(target, { acceptRelative: true })) {
    throw createError({ status: 400, statusText: 'Invalid localised path' })
  }

  return sendRedirect(event, target, 302)
})
