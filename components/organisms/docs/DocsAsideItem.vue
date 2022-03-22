<template>
  <li ref="collapsible" class="relative overflow-hidden">
    <template v-if="item.children && item.children.length">
      <DocsLink :link="item" disabled>
        <div ref="asideItem" class="flex items-center justify-between pr-12" @click="collapse">
          <span>{{ item.label }}</span>
        </div>
        <ul v-if="opened" ref="asideLinks" class="flex flex-col mt-4 text-sm">
          <li
            v-for="link in item.children"
            :key="link.label"
            class="relative pl-4 transition-all duration-500 ease-out border-l-2 translate u-border-gray-300"
            :class="{ 'u-border-gray-900': isSubMenu ? route.path === link.to || link.slug : route.path.includes(link.to || link.slug) }"
          >
            <DocsAsideItemLink :link="link" />
          </li>
        </ul>
      </DocsLink>
    </template>

    <DocsAsideItemLink v-else :link="item" />
  </li>
</template>

<script setup lang="ts">
const props = defineProps({
  item: {
    type: Object,
    required: true
  },
  disabled: {
    type: Boolean,
    dafault: false
  }
})

const route = useRoute()

const emit = defineEmits(['collapse'])

const { visible, isSubMenu } = useMenu()

const collapsible = ref(null)
const asideItem = ref<HTMLElement | null>(null)
const asideLinks = ref<HTMLElement | null>(null)

const { collapse, opened } = useNavigationItemMotion(emit, collapsible, asideItem, asideLinks, 24)
</script>
