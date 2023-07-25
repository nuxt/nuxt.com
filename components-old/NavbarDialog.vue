<template>
  <AppSlideover v-if="visible" :visible="visible">
    <template #header>
      <button v-if="selectedLink" type="button" class="flex-1 flex items-start focus:outline-none focus-visible:outline-2" @click="selectedLink = null">
        <Icon name="uil:arrow-left" size="28px" class="flex-shrink-0 u-text-gray-900" />
        <span class="sr-only">Go back</span>
      </button>
      <button v-else type="button" class="flex-1 flex items-start focus:outline-none focus-visible:outline-2" @click="close">
        <span class="sr-only">Close menu</span>
        <Icon name="uil:multiply" size="24px" class="flex-shrink-0 u-text-gray-900" />
      </button>

      <p v-if="selectedLink" class="text-lg font-semibold">
        {{ selectedLink.title }}
      </p>
      <NuxtLink v-else to="/" class="block u-text-black" @click="close">
        <span class="sr-only">Nuxt logo</span>
        <Logo class="block w-auto h-6" />
      </NuxtLink>

      <div class="flex justify-end flex-1">
        <ThemeSelect size="sm" />
      </div>
    </template>

    <div class="flex-1 px-4 py-4 overflow-y-scroll sm:px-6">
      <DocsAsideTree :tree="tree" :max="selectedLink ? null : 2" @select="onSelect" @close="close" />
    </div>
  </AppSlideover>
</template>

<script setup lang="ts">
import type { NavItem } from '@nuxt/content/dist/runtime/types'
import type { PropType, Ref } from 'vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  links: {
    type: Array as PropType<NavItem[]>,
    default: () => []
  }
})

const { navigation } = useContent()
const { navPageFromPath } = useContentHelpers()

if (!navigation.value) {
  navigation.value = await fetchContentNavigation()
}

const route = useRoute()

const { close, visible } = useSlideover()

const selectedLink: Ref<NavItem | null> = ref(null)

const selectLink = () => {
  if (!route.fullPath.startsWith('/docs')) {
    return
  }

  const path = route.fullPath.split('/').slice(0, 3).join('/')
  const nav: NavItem = navPageFromPath(path, navigation.value)
  if (nav && nav.children && nav._path === path && nav.children?.length > 1) {
    selectedLink.value = nav
  }
}

watch(
  () => route.fullPath,
  () => {
    selectLink()
  },
  { immediate: true }
)

const tree = computed(() => {
  if (selectedLink.value) {
    return selectedLink.value.children
  }

  const nav = navigation.value.filter((navLink: NavItem) => props.links.some(link => (navLink._path === `/${link._path.split('/')[1]}`) && (navLink._path !== '/docs'))).map((navLink: NavItem) => {
    if (navLink._path === '/blog') {
      delete navLink.children
    }
    return navLink
  })

  const docs = navigation.value.filter((navLink: NavItem) => navLink._path === '/docs')
  docs[0].icon = 'ph:books'

  docs[0].children = formatDocsNav(docs[0]?.children)

  return [
    ...docs,
    ...nav
  ]
})

const onSelect = (link: NavItem | null) => {
  selectedLink.value = link
}
</script>
