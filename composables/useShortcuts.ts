import type { UseMagicKeysOptions } from '@vueuse/core'
import { useActiveElement, useMagicKeys } from '@vueuse/core'

interface MagicKeysPrevent {
  // KeyboardEvent attributes
  altKey: boolean
  code: string
  ctrlKey: boolean
  key: string
  keyCode: number
  metaKey: boolean
  shiftKey: boolean
  // Custom attributes
  notUsingInput: true
}

export const useShortcuts = () => {
  const activeElement = useActiveElement()
  const keys = useMagicKeys()

  // Computed
  const notUsingInput = computed(() => !(activeElement.value?.tagName === 'INPUT' || activeElement.value?.tagName === 'TEXTAREA' || activeElement.value?.contentEditable === 'true'))

  const notUsingMeta = computed(() => !keys.current.has('MetaLeft') && !keys.current.has('MetaRight'))

  // Functions

  // https://vueuse.org/core/usemagickeys/#custom-event-handler
  function magicKeysOptions (
    { prevents = [] }: { prevents?: Partial<MagicKeysPrevent>[] } = {}
  ): UseMagicKeysOptions<false> {
    return {
      passive: !prevents.length,
      onEventFired (e: KeyboardEvent) {
        const isPrevented = e.type === 'keydown' && !!prevents.find((prevent) => {
          return Object.entries(prevent).every(([key, value]) => {
            if (['notUsingInput'].includes(key)) {
              return true
            }
            return e[key] === value
          }) && !(prevent.notUsingInput && !notUsingInput.value)
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
