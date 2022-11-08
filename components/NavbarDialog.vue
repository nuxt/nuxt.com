<template>
  <USlideover v-model="isOpen" :transition="false">
    <template #header>
      <button v-if="selectedLink" class="flex-1 flex items-start" @click="selectedLink = null">
        <Icon name="uil:arrow-left" class="flex-shrink-0 w-7 h-7" />
      </button>
      <button v-else class="flex-1 flex items-start" @click="isOpen = false">
        <Icon name="uil:multiply" class="flex-shrink-0 w-6 h-6" />
      </button>

      <p v-if="selectedLink" class="text-lg font-semibold">
        {{ selectedLink.title }}
      </p>
      <NuxtLink v-else to="/" class="block u-text-black" @click="isOpen = false">
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

const route = useRoute()

const isOpen: WritableComputedRef<boolean> = computed({
  get () {
    return props.modelValue
  },
  set (value) {
    emit('update:modelValue', value)
  }
})

const selectedLink: Ref<NavItem> = ref(null)

const selectLink = () => {
  if (!route.fullPath.startsWith('/docs')) {
    return
  }

  const path = route.fullPath.split('/').slice(0, 3).join('/')
  const nav: NavItem = navPageFromPath(path, navigation.value)
  if (nav && nav._path === path && nav.children?.length > 1) {
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

  const nav = navigation.value.filter(navLink => props.links.some(link => (navLink._path === `/${link._path.split('/')[1]}`) && (navLink._path !== '/docs')))
  const docs = navigation.value.filter(navLink => navLink._path === '/docs')
  docs[0].icon = 'ph:books'

  // remove bridge and migration from /docs
  docs[0].children = docs[0]?.children?.filter(link => !['/docs/migration', '/docs/bridge'].includes(link._path))

  return [
    ...docs,
    ...nav
  ]
})

const onSelect = (link) => {
  selectedLink.value = link
}
</script>
