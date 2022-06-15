import { withoutTrailingSlash } from 'ufo'
import type { NavItem, ParsedContent } from '@nuxt/content/dist/runtime/types'
import type { RouteLocationNormalized, RouteLocationNormalizedLoaded } from 'vue-router'
import layouts from '#build/layouts'

const findLayout = (page: ParsedContent, navigation: NavItem[]) => {
  if (page.layout) { return page.layout }

  const { navKeyFromPath } = useContentHelpers()

  const layoutFromNav = navKeyFromPath(page._path, 'layout', navigation)

  if (layoutFromNav) { return layoutFromNav }

  return 'default'
}

export const fetchPage = async (route: RouteLocationNormalized | RouteLocationNormalizedLoaded, force = false) => {
  const path = withoutTrailingSlash(route.path)

  const { page, surround, navigation } = useContentState()

  // Page is already fetched, apply it
  if (!force && page.value && page.value._path === path) {
    route.meta.layout = findLayout(page.value, navigation.value)
    return
  }

  // Fetch page
  return await Promise.all([
    queryContent().where({ _path: path }).findOne() as Promise<ParsedContent>,
    queryContent()
      .where({ _partial: { $not: true }, navigation: { $not: false } })
      .findSurround(path) as Promise<ParsedContent[]>
  ])
    .then(async ([_page, _surround]) => {
      try {
        const layoutName = findLayout(_page, navigation.value)

        // Prefetch layout component
        const layout = layouts[layoutName]
        if (layout?.__asyncLoader && !layout.__asyncResolved) {
          await layout.__asyncLoader()
        }

        // Update values
        route.meta.layout = layoutName
        if (_page) { page.value = _page } else { page.value = undefined }

        if (_surround && _surround.length) { surround.value = _surround } else { surround.value = undefined }
      } catch (e) {
        console.log(e)
      }
    })
    .catch((e) => {
      console.warn(`Could not find page for path ${path}`)
      page.value = undefined
      surround.value = undefined
      return throwError({ statusMessage: 'Page not found', message: 'This page does not exist.', statusCode: 404 })
    })
}

export const fetchNavigation = async (force = false) => {
  const { navigation } = useContentState()

  if (!force && navigation.value) { return }

  await fetchContentNavigation(
    queryContent().where({
      navigation: {
        $not: false
      }
    })
  ).then((_navigation) => {
    navigation.value = _navigation
  })
}
