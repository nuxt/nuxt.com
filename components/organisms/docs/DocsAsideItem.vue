<template>
  <li ref="collapsible" class="relative overflow-hidden">
    <template v-if="item.children && item.children.length">
      <!-- TODO: check why 'exact' only works on first link -->
      <ULink
        :to="item.children ? item.children[0].to : item.to"
        :class="{ 'font-semibold u-text-gray-900': isCurrentRoute(item.to) }"
        active-class="font-semibold u-text-gray-900"
        inactive-class="font-medium u-text-gray-500"
      >
        <div ref="asideItem" class="flex items-center justify-between pr-12" @click="collapse">
          <span>{{ item.label }}</span>
        </div>
        <ul v-if="opened" ref="asideLinks" class="flex flex-col mt-2 text-sm">
          <li v-for="link in item.children" :key="link.label" class="py-1 pl-2 border-l-2" :class="{ 'u-border-gray-900': isCurrentRoute(link.to)}">
            <DocsAsideItemLink :link="link" />
          </li>
        </ul>
      </ULink>
    </template>
    <DocsAsideItemLink v-else :link="item" />
  </li>
</template>

<script setup lang="ts">
defineProps({
  item: {
    type: Object,
    required: true
  }
})

const currentRoute = useRoute()

const emit = defineEmits(['collapse'])

const collapsible = ref(null)
const asideItem = ref<HTMLElement | null>(null)
const asideLinks = ref<HTMLElement | null>(null)

const { collapse, opened } = useNavigationItemMotion(emit, collapsible, asideItem, asideLinks, 24)

const isCurrentRoute = (to: string) => (currentRoute.path.includes(to))
</script>
