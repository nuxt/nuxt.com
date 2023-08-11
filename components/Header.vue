<script setup lang="ts">
import type { NavItem } from '@nuxt/content/dist/runtime/types'
import type { Link } from '@elements/types'

const navigation = inject<Ref<NavItem[]>>('navigation')

defineProps<{
  links?: Link[]
}>()

const { mapContentNavigation } = useElementsHelpers()
</script>

<template>
  <UHeader :links="links">
    <template #logo>
      <Logo class="block w-auto h-6" />
    </template>

    <template #right>
      <UColorModeButton />

      <UButton
        icon="i-ph-star-duotone"
        to="https://github.com/nuxt/nuxt"
        target="_blank"
        label="46.6k"
        color="gray"
        variant="ghost"
      />
    </template>

    <template #panel>
      <UNavigationTree :links="mapContentNavigation(navigation)" default-open :multiple="false" />
    </template>
  </UHeader>
</template>
