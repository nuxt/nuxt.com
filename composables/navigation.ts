import { useMotion } from '@vueuse/motion'
import type { MotionInstance } from '@vueuse/motion'
import type { Ref } from 'vue'

export const useNavigationMotion = (navigationContainer: Ref<HTMLElement>) => {
  // Navigation motion instance
  const navigationMotion = useMotion(navigationContainer)

  function onEnter (el: HTMLElement, done: any) {
    /* if (isMobileLayout) {
      setTimeout(() => {
        navigationMotion.apply({
          height: el.clientHeight
        })
      }, 0)
    } */

    // Slide-in
    useMotion(el, {
      initial: {
        opacity: 0,
        x: -Math.abs(el.offsetWidth) / 2,
        zIndex: 10
      },
      enter: {
        opacity: 1,
        x: 0,
        transition: {
          delay: 0,
          duration: 200,
          ease: 'circOut',
          onComplete: done
        }
      }
    })
  }

  function onLeave (el: HTMLElement, done: any) {
    /* if (isMobileLayout) {
      setTimeout(() => {
        navigationMotion.set({
          height: el.clientHeight
        })
      }, 0)
    } */

    // Slide-out
    useMotion(el, {
      initial: {
        opacity: 1,
        x: 0
      },
      enter: {
        opacity: 0,
        x: 0,
        // TODO: Fix this
        // x: backDirection.value ? 0 : 50,
        transition: {
          duration: 100,
          ease: 'linear',
          onComplete: done
        }
      }
    })
  }

  /* function updateHeight () {
    if (isMobileLayout) {
      navigationMotion.set({
        height: 'auto'
      })
    }
  } */

  return {
    onEnter,
    onLeave
    // updateHeight
  }
}

export const useNavigationItemMotion = (
  emit: (...props: any) => void,
  collapsible: Ref<HTMLElement>,
  content: Ref<HTMLElement>
) => {
  const button = ref(null)
  const buttonHeight = ref()
  const contentHeight = ref()
  const opened = ref(true)

  let collapsibleMotion: MotionInstance<any>
  function initCollapsible (): void {
    buttonHeight.value = button.value?.clientHeight
    contentHeight.value = content.value?.clientHeight

    collapsibleMotion = useMotion(collapsible, {
      initial: {
        height: buttonHeight.value + contentHeight.value
      },
      open: {
        height: buttonHeight.value + contentHeight.value,
        transition: {
          ease: 'circOut',
          duration: 250
        }
      },
      close: {
        height: buttonHeight.value,
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
    button,
    content,
    buttonHeight,
    contentHeight,
    opened
  }
}
