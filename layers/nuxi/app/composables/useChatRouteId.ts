export function resolveChatRouteId(path: string, param: string | string[] | undefined) {
  if (typeof param === 'string' && param) return param
  if (Array.isArray(param) && param[0]) return param[0]
  const match = path.match(/^\/dashboard\/chat\/([^/]+)\/?$/)
  return match?.[1] ?? ''
}

export function useChatRouteId() {
  const route = useRoute()
  return computed(() => resolveChatRouteId(route.path, route.params.id))
}
