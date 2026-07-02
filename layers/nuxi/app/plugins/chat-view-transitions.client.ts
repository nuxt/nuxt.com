/**
 * Scoped View Transitions for dashboard chat only.
 * Morphs the prompt between /dashboard/chat and /dashboard/chat/:id.
 */
export default defineNuxtPlugin((nuxtApp) => {
  if (!document.startViewTransition) return

  let transition: ViewTransition | undefined
  let finishTransition: (() => void) | undefined
  let hasUAVisualTransition = false

  const resetTransitionState = () => {
    transition = undefined
    finishTransition = undefined
    hasUAVisualTransition = false
  }

  window.addEventListener('popstate', (event) => {
    hasUAVisualTransition
      = (event as PopStateEvent & { hasUAVisualTransition?: boolean }).hasUAVisualTransition ?? false
    if (hasUAVisualTransition) {
      transition?.skipTransition()
    }
  })

  const router = useRouter()

  router.beforeResolve(async (to, from) => {
    if (to.matched.length === 0) return

    if (!isChatPromptTransition(to.path, from.path)) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (hasUAVisualTransition) return

    const promise = new Promise<void>((resolve) => {
      finishTransition = resolve
    })

    let changeRoute: () => void
    const ready = new Promise<void>(resolve => (changeRoute = resolve))

    transition = document.startViewTransition(() => {
      changeRoute!()
      return promise
    })

    transition.ready.catch(handleViewTransitionRejection)
    transition.updateCallbackDone.catch(handleViewTransitionRejection)
    transition.finished.catch(handleViewTransitionRejection).finally(resetTransitionState)

    await nuxtApp.callHook('page:view-transition:start', transition)

    return ready
  })

  router.onError(() => {
    finishTransition?.()
    resetTransitionState()
  })
  nuxtApp.hook('app:error', () => {
    finishTransition?.()
    resetTransitionState()
  })
  nuxtApp.hook('vue:error', () => {
    finishTransition?.()
    resetTransitionState()
  })

  nuxtApp.hook('page:finish', () => {
    finishTransition?.()
    resetTransitionState()
  })
})

function isChatPromptTransition(toPath: string, fromPath: string) {
  const toChat = /^\/dashboard\/chat\/[^/]+$/.test(toPath)
  const fromHome = fromPath === '/dashboard/chat'
  const fromChat = /^\/dashboard\/chat\/[^/]+$/.test(fromPath)
  const toHome = toPath === '/dashboard/chat'
  return (fromHome && toChat) || (fromChat && toHome)
}

function handleViewTransitionRejection(error: unknown) {
  if (!import.meta.dev || isExpectedViewTransitionRejection(error)) return
  console.warn('[chat-view-transitions] transition promise rejected', error)
}

function isExpectedViewTransitionRejection(error: unknown) {
  const name = error instanceof Error ? error.name : ''
  const message = error instanceof Error ? error.message : String(error)
  return name === 'AbortError' || message.includes('Transition was aborted')
}
