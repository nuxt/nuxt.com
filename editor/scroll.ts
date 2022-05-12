import type { Ref } from 'vue'

export const useEditorScroll = (file: ReturnType<typeof useProjectFiles>['file']) => {
  const scroll: Ref<HTMLElement> = ref(null)

  if (process.client) {
    watch(file, (current, old) => {
      if (!scroll.value || !current) {
        return
      }

      if (
        (old && old.path === current.oldPath) || // Rename
        (old && old.oldPath === current.path) || // Rename back to original
        (old && typeof old.oldPath !== 'undefined' && old.oldPath === current.oldPath) // Rename when already renamed
      ) {
        return
      }

      scroll.value.scrollTop = 0
    })
  }

  return { scroll }
}
