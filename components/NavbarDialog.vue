<template>
  <USlideover v-model="isOpen" :transition="false" :overlay="false" base-class="relative flex-1 flex flex-col w-full focus:outline-none max-w-md u-bg-white border-r border-r-gray-300 dark:border-r-gray-700">
    <template #header>
      <button v-if="selectedLink" type="button" class="flex-1 flex items-start focus:outline-none focus-visible:outline-2" @click="selectedLink = null">
        <Icon name="uil:arrow-left" class="flex-shrink-0 w-7 h-7" />
        <span class="hidden">Go back</span>
      </button>
      <button v-else type="button" class="flex-1 flex items-start focus:outline-none focus-visible:outline-2" @click="isOpen = false">
        <Icon name="uil:multiply" class="flex-shrink-0 w-6 h-6" />
        <span class="hidden">Close menu</span>
      </button>

      <p v-if="selectedLink" class="text-lg font-semibold">
        {{ selectedLink.title }}
      </p>
      <NuxtLink v-else to="/" class="block u-text-black" @click="isOpen = false">
        <span class="sr-only">Nuxt logo</span>
        <Logo class="block w-auto h-6" />
      </NuxtLink>

      <div class="flex justify-end flex-1">
        <ThemeSelect size="sm" />
      </div>
    </template>

    <div class="flex-1 px-4 py-4 overflow-y-scroll sm:px-6">
      <DocsAsideTree :tree="tree" :max="selectedLink ? null : 2" @select="onSelect" @close="isOpen = false" />
    </div>
  </USlideover>
</template>

<script setup lang="ts">
import type { NavItem } from '@nuxt/content/dist/runtime/types'
import type { PropType, Ref, WritableComputedRef } from 'vue'

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

const emit = defineEmits(['update:modelValue'])

const { navigation } = useContent()
const { navPageFromPath } = useContentHelpers()

if (!navigation.value) {
  navigation.value = await fetchContentNavigation()
}

const route = useRoute()

const isOpen: WritableComputedRef<boolean> = computed({
  get () {
    return props.modelValue
  },
  set (value) {
    emit('update:modelValue', value)
  }
})

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

  const nav = navigation.value.filter((navLink: NavItem) => props.links.some(link => (navLink._path === `/${link._path.split('/')[1]}`) && (navLink._path !== '/docs')))
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
