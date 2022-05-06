import { useStorage } from '@vueuse/core'

let isOpen
if (process.client) {
  isOpen = useStorage('project-preview-open', true, sessionStorage)
}

// Warning: This composable is for client only purposes
export const useProjectPreview = () => {
  const isExpanded = ref(false)

  return {
    isOpen,
    isExpanded
  }
}
