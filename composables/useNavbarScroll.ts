import { useWindowScroll } from '@vueuse/core'

export const useNavbarScroll = () => {
  const { y } = useWindowScroll()

  const hasScrolledPastNavbar = ref(false)
  const hasScrolledPastSubNavbar = ref(false)

  onMounted(() => {
    watch(y, (newVal) => {
      hasScrolledPastNavbar.value = newVal > 0
      hasScrolledPastSubNavbar.value = newVal > 80
    }, { immediate: true })
  })

  return {
    hasScrolledPastNavbar,
    hasScrolledPastSubNavbar
  }
}
