<template>
  <ul :class="{ 'pl-4': level > 1 }">
    <li
      v-for="(link, index) in tree"
      :key="link._path"
      :class="{
        'border-l-2': level > 0,
        'border-green-500': isActive(link),
        'u-border-gray-300 hover:u-border-gray-900': !isActive(link)
      }"
    >
      <ULink
        :to="link._path"
        class="py-1.5 flex w-full"
        :exact="link.exact"
        :class="{
          'pl-4 lg:text-sm': level > 0,
          '!pt-0': level === 0 && index === 0,
          'font-semibold text-green-500': isActive(link),
          'font-medium': level === 0 && !isActive(link) && link.children,
          'hover:font-semibold': !isActive(link) && !link.children
        }"
        @click.stop.prevent="onClick(link)"
      >
        <span class="inline-flex items-center">
          <Icon v-if="link.icon" :name="link.icon" class="w-5 h-5 mr-1" />
          <span>{{ link.title }}</span>
        </span>
      </ULink>

      <DocsAsideTree
        v-if="link.children?.length && (max === null || ((level + 1) < max))"
        v-show="isChildOpen[link._path] || props.level === 0"
        :tree="link.children"
        :level="level + 1"
        :max="max"
        class="py-2"
        @select="link => $emit('select', link)"
        @close="$emit('close')"
      />
    </li>
  </ul>
</template>

<script setup lang="ts">
import type { NavItem } from '@nuxt/content/dist/runtime/types'
import type { PropType } from 'vue'

const props = defineProps({
  tree: {
    type: Array as PropType<NavItem[]>,
    default: () => []
  },
  level: {
    type: Number,
    default: 0
  },
  max: {
    type: Number,
    default: null
  }
})
const emit = defineEmits(['close', 'select'])

const route = useRoute()
const router = useRouter()

const isChildOpen = reactive({})

function isActive (link) {
  return link.exact ? route.fullPath === link._path : route.fullPath.startsWith(link._path)
}

function onClick (link) {
  if (link.children?.length) {
    // Open dir when element is collapsible
    openDir(link._path)
    // Select element for mobile nav
    if (props.max !== null && props.level + 1 === props.max) {
      emit('select', link)
    }
  } else {
    if (link.redirect) {
      window.open(link.redirect, '_blank')
    } else {
      router.push(link._path)
    }
    emit('close')
  }
}

function openDir (slug, force?) {
  isChildOpen[slug] = force ? true : !isChildOpen[slug]
}

watch(() => route.path, () => {
  const paths = route.path.split('/')

  for (let i = paths.length - 1; i > 1; i--) {
    paths.pop()
    openDir(paths.join('/'), true)
  }
}, { immediate: true })
</script>
