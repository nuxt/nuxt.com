export default defineNuxtPlugin(() => {
  // https://gist.github.com/IceCreamYou/cd517596e5847a88e2bb0a091da43fb4#file-force-scrollbars-visible-js
  // Returns whether scrollbars show up on scrollable elements.
  // This is false on Macs when the "General > Show scroll bars" setting is
  // not set to "Always" (the default is "When scrolling"). The approach
  // taken here is to create an element that will scroll and then compare
  // its outer width (including scrollbars) to its inner width (excluding
  // scrollbars).
  function areScrollbarsVisible () {
    const scrollableElem = document.createElement('div')
    const innerElem = document.createElement('div')
    scrollableElem.style.width = '30px'
    scrollableElem.style.height = '30px'
    scrollableElem.style.overflow = 'scroll'
    scrollableElem.style.borderWidth = '0'
    innerElem.style.width = '30px'
    innerElem.style.height = '60px'
    scrollableElem.appendChild(innerElem)
    document.body.appendChild(scrollableElem) // Elements only have width if they're in the layout
    const diff = scrollableElem.offsetWidth - scrollableElem.clientWidth
    document.body.removeChild(scrollableElem)
    return diff > 0
  }

  // Show custom scrollbars if they're shown.
  if (areScrollbarsVisible()) {
    document.documentElement.classList.add('nuxt-scrollbars')
  }
})
