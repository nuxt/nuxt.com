const isShortcutsSlideoverOpen = ref(false)

function openShortcutsSlideover () {
  isShortcutsSlideoverOpen.value = true
}

export const useProjectSlideovers = () => {
  return {
    isShortcutsSlideoverOpen,
    openShortcutsSlideover
  }
}
