// Solution to get great block links
// From https://css-tricks.com/block-links-the-search-for-a-perfect-solution/#aa-method-4-sprinkle-javascript-on-the-second-method

export const useBlockLinks = (rootRef) => {
  const stopPropagation = (e: Event) => e.stopPropagation()
  onMounted(() => {
    Array.from(rootRef.value.querySelectorAll('a')).forEach((el: Element) => {
      el.addEventListener('click', stopPropagation)
    })
  })
  onBeforeUnmount(() => {
    Array.from(rootRef.value.querySelectorAll('a')).forEach((el: Element) => {
      el.removeEventListener('click', stopPropagation)
    })
  })
}
