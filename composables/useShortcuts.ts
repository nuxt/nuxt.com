import type { UseMagicKeysOptions } from '@vueuse/core'
import { useActiveElement, useMagicKeys } from '@vueuse/core'

export const useShortcuts = () => {
  const activeElement = useActiveElement()
  const keys = useMagicKeys()

  // Computed
  const notUsingInput = computed(() => !(activeElement.value?.tagName === 'INPUT' || activeElement.value?.tagName === 'TEXTAREA' || activeElement.value?.contentEditable === 'true'))

  const notUsingMeta = computed(() => !keys.current.has('MetaLeft') && !keys.current.has('MetaRight'))

  // Functions

  // https://vueuse.org/core/usemagickeys/#custom-event-handler
  function magicKeysOptions (
    { prevents = [] }: { prevents?: Partial<KeyboardEvent>[] } = {}
  ): UseMagicKeysOptions<false> {
    return {
      passive: !prevents.length,
      onEventFired (e: KeyboardEvent) {
        const isPrevented = e.type === 'keydown' && !!prevents.find((prevent) => {
          return Object.entries(prevent).every(([key, value]) => e[key] === value)
        })
        if (isPrevented) {
          e.preventDefault()
        }
      }
    }
  }

  return {
    // Computed
    notUsingInput,
    notUsingMeta,
    // Functions
    magicKeysOptions
  }
}
