import type { Ref } from 'vue'

// Solution to get great block links
// From https://css-tricks.com/block-links-the-search-for-a-perfect-solution/#aa-method-4-sprinkle-javascript-on-the-second-method

export const useBlockLinks = (rootRef: Ref) => {
  const stopPropagation = (e: Event) => e.stopPropagation()
  onMounted(() => {
    Array.from<HTMLElement>(rootRef.value.querySelectorAll('a')).forEach((el) => {
      el.addEventListener('click', stopPropagation)
    })
  })
  onBeforeUnmount(() => {
    Array.from<HTMLElement>(rootRef.value.querySelectorAll('a')).forEach((el) => {
      el.removeEventListener('click', stopPropagation)
    })
  })
}
