import { useStorage, useDraggable, useResizeObserver, useWindowSize } from '@vueuse/core'

const isOpen = useStorage('project-preview-opened', true, process.client && sessionStorage)
const isExpand = useStorage('project-preview-expanded', false, process.client && sessionStorage)

// Warning: This composable is for client only purposes
export const useProjectPreview = () => {
  const el = ref(null)

  const { width, height } = useWindowSize()

  const defaultSize = ref({ width: 335, height: 189 })
  const defaultPosition = computed(() => ({ x: width.value - size.value.width - 24, y: height.value - size.value.height - 24 }))

  const size = useStorage('project-preview-size', defaultSize.value, process.client && sessionStorage)
  const position = useStorage('project-preview-position', defaultPosition.value, process.client && sessionStorage)

  const isDiff = computed(() => !(size.value.width === defaultSize.value.width && size.value.height === defaultSize.value.height && position.value.x === defaultPosition.value.x && position.value.y === defaultPosition.value.y))

  const style = computed(() => ([
    `width: ${size.value.width}px`,
    `height: ${size.value.height}px`,
    `left:${position.value.x}px`,
    `top:${position.value.y}px;`
  ]))

  // Watch

  watch([width, height], ([newWidth, newHeight], [oldWidth, oldHeight]) => {
    let x = position.value.x + (newWidth - oldWidth)
    if (x < 0) { x = 0 }
    if (x + size.value.width > width.value) { x = width.value - size.value.width }

    let y = position.value.y + (newHeight - oldHeight)
    if (y < 0) { y = 0 }
    if (y + size.value.height > height.value) { y = height.value - size.value.height }

    position.value = { x, y }
  })

  useResizeObserver(el, (entries) => {
    if (isExpand.value) {
      return
    }
    if (!isOpen.value) {
      return
    }

    const entry = entries[0]
    const { width, height } = entry.contentRect

    size.value = { width, height }
  })

  useDraggable(el, {
    initialValue: position,
    onStart: (_position, e: PointerEvent) => {
      // @ts-ignore
      if (e.target.classList.contains('cursor-move')) {
        return
      }

      return false
    }
  })

  function reset () {
    size.value = defaultSize.value
    position.value = defaultPosition.value
  }

  return {
    el,
    style,
    reset,
    isOpen,
    isExpand,
    isDiff
  }
}
