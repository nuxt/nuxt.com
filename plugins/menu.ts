import { withBase } from 'ufo'

export default defineNuxtPlugin((ctx: any) => {
  const scrollBarGap = ref()

  // Current menu visible
  const isSubMenu = ref(false)

  // current subNav
  const currentSubNav = ref()

  // current parent of subnav
  const currentParent = ref()

  // Menu visible reference
  const visible = ref(false)

  // first nav level
  const navLinks = navLink => ({ to: navLink.slug, label: navLink.title, children: navLink.children?.map(items) || null })
  const items = item => ({ to: item.slug, label: item.title, children: item.children?.map(itemLinks) || null })
  const itemLinks = itemLink => ({ to: itemLink.slug, label: itemLink.title })

  // Open the menu
  const open = () => (visible.value = true)

  // Close the menu
  const close = () => {
    visible.value = false
  }

  // Toggle the menu (useful for one-off buttons)
  const toggle = () => (visible.value = !visible.value)

  async function getSubNav (to) {
    const withContentBase = (url: string) => withBase(url, '/api/' + useRuntimeConfig().content.basePath)

    const { data: navigation } = await useAsyncData('framework-docs-top-nav', async () => {
      return await $fetch(withContentBase('/navigation'), {
        method: 'POST',
        body: { slug: to }
      })
    })

    return navigation.value[0].children[0].children[0]
  }

  const getSubMenuNav = async (link) => {
    if (link.children && link.children.length) {
      isSubMenu.value = true
      await getSubNav(link.slug).then((subNav) => {
        currentParent.value = { label: subNav.title }
        currentSubNav.value = subNav.children.map(navLinks)
      })
    } else {
      isSubMenu.value = false
    }
  }

  // Watch route change, close on change
  ctx.$router.afterEach(() => setTimeout(close, 50))

  // Watch visible and remove overflow so the scrollbar disappears when menu is opened
  if (process.client) {
    watch(
      visible,
      (isVisible) => {
        if (isVisible) {
          scrollBarGap.value = window.innerWidth - document.documentElement.clientWidth
          document.body.style.overflow = 'hidden'
          document.body.style.paddingRight = `${scrollBarGap.value}px`
        } else {
          setTimeout(() => {
            document.body.style.overflow = ''
            document.body.style.paddingRight = ''
          }, 100) /* had to put it, because of layout shift on leave transition */
        }
      },
      {
        immediate: true
      }
    )
  }

  // Inject menu
  ctx.provide('menu', {
    scrollBarGap,
    visible,
    close,
    open,
    toggle,
    getSubMenuNav,
    isSubMenu,
    currentSubNav,
    getSubNav,
    currentParent
  })
})
