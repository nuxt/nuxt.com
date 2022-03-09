<template>
  <li ref="collapsible" class="relative overflow-hidden">
    <template v-if="item.children && item.children.length">
      <ULink
        :to="item.children ? item.children[0].to : item.to"
        :class="{ 'font-semibold u-text-gray-900': isSelectedLink(item.to) }"
        active-class="font-semibold u-text-gray-900"
        inactive-class="font-medium u-text-gray-400"
      >
        <div class="flex items-center justify-between">
          <span>{{ item.label }}</span>
          <UButton
            v-if="item.children && item.children.length"
            variant="transparent"
            :icon="!opened ? 'heroicons-solid:plus-sm' : 'heroicons-solid:minus-sm'"
            @click="collapse"
          />
        </div>
        <ul v-if="opened" ref="content" class="flex flex-col mt-2 text-sm">
          <li v-for="link in item.children" :key="link.label" class="py-1 pl-2 border-l-2" :class="{ 'u-border-gray-900': isSelectedLink(link.to)}">
            <DocsAsideItemLink :link="link" @click="emit('navigate', item)" />
          </li>
        </ul>
      </ULink>
    </template>
    <DocsAsideItemLink v-else :link="item" @click="emit('navigate', item)" />
  </li>
</template>
<script setup lang="ts">

defineProps({
  item: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['navigate', 'collapse'])

const route = useRoute()

const collapsible = ref(null)
const content = ref(null)

const { collapse, opened } = useNavigationItemMotion(emit, collapsible, content)

const isSelectedLink = (to: string) => (route.path.includes(to))
</script>
