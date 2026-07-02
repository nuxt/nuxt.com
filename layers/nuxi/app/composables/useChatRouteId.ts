import { readNavigationChatId } from './useChatDetailCache'

export function resolveChatRouteId(path: string, param: string | string[] | undefined) {
  if (typeof param === 'string' && param) return param
  if (Array.isArray(param) && param[0]) return param[0]

  const match = path.match(/^\/dashboard\/chat\/([^/]+)\/?$/)
  if (match?.[1]) return match[1]

  return readNavigationChatId()
}

export function useChatRouteId() {
  const route = useRoute()
  return computed(() => resolveChatRouteId(route.path, route.params.id))
}
