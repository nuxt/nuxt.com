import { useMotion } from '@vueuse/motion'
import type { MotionInstance } from '@vueuse/motion'
import type { Ref } from 'vue'

export const useNavigationItemMotion = (
  emit: (...props: any) => void,
  collapsible: Ref<HTMLElement>,
  asideItem: Ref<HTMLElement>,
  asideLinks: Ref<HTMLElement>,
  openedPadding: Number
) => {
  const opened = ref(true)
  const asideItemHeight = ref()
  const asideLinksHeight = ref()

  let collapsibleMotion: MotionInstance<any>

  function initCollapsible (): void {
    asideItemHeight.value = asideItem.value?.clientHeight
    asideLinksHeight.value = asideLinks.value?.clientHeight

    collapsibleMotion = useMotion(collapsible, {
      initial: {
        height: asideItemHeight.value + asideLinksHeight.value + openedPadding
      },
      open: {
        height: asideItemHeight.value + asideLinksHeight.value + openedPadding,
        transition: {
          ease: 'ease-in',
          duration: 500
        }
      },
      close: {
        height: asideItemHeight.value,
        transition: {
          ease: 'circOut',
          duration: 250
        }
      }
    })

    collapsibleMotion.set('initial')
  }

  function collapse (): void {
    opened.value = !opened.value

    if (opened.value) { collapsibleMotion.apply('open') } else { collapsibleMotion.apply('close') }

    emit('collapse')
  }

  onMounted(() => {
    initCollapsible()

    window.addEventListener('resize', initCollapsible)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', initCollapsible)
  })

  return {
    collapse,
    collapsible,
    asideItem,
    asideLinks,
    asideItemHeight,
    asideLinksHeight,
    opened
  }
}
