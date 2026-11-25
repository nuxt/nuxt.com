<script setup lang="ts">
import type { NavigationItem } from 'comark-content'

// Below `lg`, a module's docs asides collapse into drawers, as on `/docs`.
defineProps<{
  title: string
  navigation: NavigationItem[]
  tocLinks: any[]
}>()

const route = useRoute()
const menuOpen = ref(false)
const tocOpen = ref(false)

watch(() => route.path, () => {
  menuOpen.value = false
  tocOpen.value = false
})
</script>

<template>
  <div class="lg:hidden sticky top-(--ui-header-height) z-10 bg-default/75 backdrop-blur -mx-4 sm:-mx-6 p-6 border-b border-dashed border-default flex justify-between">
    <UDrawer
      v-model:open="menuOpen"
      direction="left"
      :title="title"
      inset
      :handle="false"
      :ui="{ content: 'w-full max-w-2/3' }"
    >
      <UButton
        label="Menu"
        icon="i-lucide-text-align-start"
        color="neutral"
        variant="link"
        size="xs"
        aria-label="Open navigation"
        class="-m-4"
      />
      <template #body>
        <UContentNavigation
          :navigation="navigation"
          :collapsible="false"
          :ui="{ link: 'data-[state=open]:text-muted data-[state=open]:hover:text-highlighted', trigger: 'font-normal' }"
          highlight
        />
      </template>
    </UDrawer>
    <UDrawer
      v-if="tocLinks.length"
      v-model:open="tocOpen"
      direction="right"
      :handle="false"
      inset
      no-body-styles
      :ui="{ content: 'w-full max-w-2/3' }"
    >
      <UButton
        label="On this page"
        trailing-icon="i-lucide-chevron-right"
        color="neutral"
        variant="link"
        size="xs"
        aria-label="Open on this page"
        class="-m-4"
      />
      <template #body>
        <UContentToc
          :links="tocLinks"
          :open="true"
          default-open
          :ui="{
            root: '!mx-0 !px-1 top-0 overflow-visible',
            container: '!pt-0 border-b-0',
            trailingIcon: 'hidden'
          }"
        />
      </template>
    </UDrawer>
  </div>
</template>
