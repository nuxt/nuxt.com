<template>
  <USlideover v-model="isOpen">
    <template #header>
      <button v-if="selectedLink" @click="selectedLink = null">
        <UIcon name="heroicons-outline:arrow-sm-left" class="flex-shrink-0 w-6 h-6" />
      </button>
      <button v-else @click="isOpen = false">
        <UIcon name="heroicons-outline:x" class="flex-shrink-0 w-6 h-6" />
      </button>

      <p v-if="selectedLink" class="text-lg font-semibold">
        {{ selectedLink.title }}
      </p>
      <NuxtLink v-else to="/" class="block u-text-black" @click="isOpen = false">
        <Logo class="block w-auto h-6" />
      </NuxtLink>

      <div class="w-6" />
    </template>

    <div class="flex-1 px-4 py-4 overflow-y-scroll sm:px-6">
      <DocsAsideTree :tree="tree" :max="selectedLink ? null : 2" @select="onSelect" @close="isOpen = false" />
    </div>
  </USlideover>
</template>

<script setup lang="ts">
import type { NavItem } from '@nuxt/content/dist/runtime/types'
import { omit } from 'lodash-es'
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

const { navigation, navFromPath } = usePage()

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

watch(
  () => route.fullPath,
  () => {
    if (!route.fullPath.startsWith('/docs')) {
      return
    }

    const path = route.fullPath.split('/').slice(0, 3).join('/')
    const nav: NavItem = navigation.value ? navFromPath(path) : null
    if (nav && nav._path === path && nav.children?.length > 1) {
      selectedLink.value = nav
    }
  },
  { immediate: true }
)

const tree = computed(() => {
  if (selectedLink.value) {
    return selectedLink.value.children.filter(child => child._path !== route.fullPath)
  }

  return props.links.map((link) => {
    const children = navFromPath(link._path)?.children

    return {
      ...link,
      children: children?.map(child => omit(child, 'children'))
    } as NavItem
  })
})

const onSelect = (link) => {
  selectedLink.value = link
}
</script>
