<template>
  <ul :class="{ 'pl-4': level > 1 }" class="px-1">
    <li
      v-for="(link, index) in tablet ? props.tree : links"
      :key="link._path"
      :class="{
        'border-l-2': level > 0,
        'border-gray-300': isActive(link),
        'u-border-gray-300 hover:u-border-gray-900': !isActive(link)
      }"
    >
      <div class="flex justify-between items-center">
        <NuxtLink
          v-if="isClickable(link)"
          :to="isClickable(link) && link.children && link._path !== '/docs' ? '' : link._path"
          class="py-1.5 flex w-full"
          :exact="link.exact"
          :class="linkClass(index, link)"
          @click.stop.prevent="onClick(link)"
        >
          <div class="inline-flex items-center">
            <Icon v-if="link.icon" :name="link.icon" class="w-5 h-5 mr-1" />
            <div class=" flex flex-col">
              <span>{{ link.title }}</span>
              <span class="inset-x-0 -bottom-1 h-0.5" :class="{ 'bg-gradient-to-r from-green-400 to-teal-400': (isActive(link) && !link.children)}" />
            </div>
          </div>
        </NuxtLink>
        <div v-else class="w-full flex justify-between items-center" @click="tablet ? () => {} : expand(link)">
          <span
            class="py-1.5 flex w-full cursor-pointer"
            :class="linkClass(index, link)"
          >{{ link.title }}</span>
          <div v-if="link.isCollapsible && !tablet">
            <AppButton :icon="link.collapsed ? 'bx:expand-vertical' : 'bx:collapse-vertical'" icon-base-class="h-5" variant="transparent" />
          </div>
        </div>
      </div>

      <Transition>
        <DocsAsideTree
          v-if="link.children?.length && (max === null || ((level + 1) < max))"
          v-show="(isChildOpen[link._path] || props.level === 0) && ((!link.collapsed && !tablet) || tablet)"
          :tree="link.children"
          :level="level + 1"
          :max="max"
          class="py-2 transition-all duration-300"
          @select="link => $emit('select', link)"
          @close="$emit('close')"
        />
      </Transition>
    </li>
  </ul>
</template>

<script setup lang="ts">
import type { NavItem } from '@nuxt/content/dist/runtime/types'
import type { PropType, Ref } from 'vue'
import { breakpointsTailwind, useBreakpoints } from '@vueuse/core'

type CollapsibleNavItem = NavItem & {
  isCollapsible: Boolean,
  collapsed: Boolean
}

const props = defineProps({
  tree: {
    type: Array as PropType<NavItem[] | CollapsibleNavItem[]>,
    default: () => []
  },
  level: {
    type: Number,
    default: 0
  },
  max: {
    type: Number as PropType<Number | null>,
    default: null
  }
})

const { smaller } = useBreakpoints(breakpointsTailwind)

const tablet = smaller('lg')

const emit = defineEmits(['close', 'select'])

const route = useRoute()
const router = useRouter()

const isChildOpen = reactive({} as any)

const linkClass = (index: Number, link: NavItem | CollapsibleNavItem) => {
  return [
    props.level > 0 && 'pl-4 lg:text-sm',
    (props.level === 0 && index === 0) ? '!pt-0' : '',
    isActive(link) && 'font-semibold',
    (props.level === 0 && !isActive(link) && link.children) && 'font-medium',
    !isActive(link) && !link.children && 'hover:font-semibold'
  ].filter(Boolean).join(' ')
}

const links: Ref<CollapsibleNavItem[]> = ref(getLinks())

const expand = (link: NavItem | CollapsibleNavItem) => {
  const linkToCollapse = links.value.findIndex(navLink => link._path === navLink._path)

  links.value[linkToCollapse] = { ...link, collapsed: !link.collapsed } as CollapsibleNavItem
}

const isClickable = (link: any) => {
  return !(props.level === 0 && link._path !== '/docs' && link.children)
}

function getLinks () {
  return [
    ...props?.tree?.map((link) => {
      return { ...link, exact: true, isCollapsible: link.children?.length && props.level === 0 && link._path.includes('/docs'), collapsed: !link.children?.some(child => child._path.includes(route.path)) }
    })
  ] as CollapsibleNavItem[]
}

function isActive (link: NavItem | CollapsibleNavItem) {
  return link.exact ? route.fullPath === link._path : route.fullPath.startsWith(link._path)
}

function onClick (link: NavItem | CollapsibleNavItem) {
  if (link.children?.length) {
    // Open dir when element is collapsible
    openDir(link._path)
    // Select element for mobile nav
    if ((props.max !== null && props.level + 1 === props.max)) {
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

function openDir (slug: string, force?: Boolean) {
  isChildOpen[slug] = force ? true : !isChildOpen[slug]
}

watch(() => props.tree, () => {
  links.value = getLinks()
})

watch(() => route.path, () => {
  const paths = route.path.split('/')

  for (let i = paths.length - 1; i > 1; i--) {
    paths.pop()
    openDir(paths.join('/'), true)
  }
}, { immediate: true })
</script>

<style lang="postcss">
.v-enter-active,
.v-leave-active {
    max-height: 100vh;
    opacity: 1;
    transition: all 0.3s linear;
}

.v-enter-from,
.v-leave-to {
  max-height: 0;
  opacity: 0;
  transition: all 0.15s linear;
}
</style>
