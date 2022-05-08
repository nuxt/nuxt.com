import { useStorage, useDraggable, useResizeObserver, useWindowSize } from '@vueuse/core'
import type { Ref } from 'vue'

const isOpen = useStorage('project-preview-opened', true, process.client && sessionStorage)
const isExpand = useStorage('project-preview-expanded', false, process.client && sessionStorage)

// Warning: This composable is for client only purposes
export const useProjectPreview = () => {
  const el = ref(null)

  let size: Ref<{ width: number, height?: number }> = ref({ width: 0, height: 0 })
  let position: Ref<{ x: number, y: number }> = ref({ x: 0, y: 0 })

  const style = computed(() => ([
    `width: ${size.value.width}px`,
    size.value.height && `height: ${size.value.height}px`,
    `left:${position.value.x}px`,
    `top:${position.value.y}px;`
  ].filter(Boolean)))

  const { width, height } = useWindowSize()

  size = useStorage('project-preview-size', { width: 335, height: 189 }, process.client && sessionStorage)
  position = useStorage('project-preview-position', { x: width.value - size.value.width - 24, y: height.value - size.value.height - 24 }, process.client && sessionStorage)

  watch([width, height], ([newWidth, newHeight], [oldWidth, oldHeight]) => {
    let x = position.value.x + (newWidth - oldWidth)
    if (x < 0) { x = 0 }
    if (x + size.value.width > width.value) { x = width.value - size.value.width }

    let y = position.value.y + (newHeight - oldHeight)
    if (y < 0) { y = 0 }
    if (y + size.value.height > height.value) { y = height.value - size.value.height }

    position.value.x = x
    position.value.y = y
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

  return {
    el,
    style,
    isOpen,
    isExpand
  }
}
