<script setup lang="ts">
import type { NavItem } from '@nuxt/content/dist/runtime/types'
import type { Link } from '#ui-pro/types'

const navigation = inject<Ref<NavItem[]>>('navigation')
const stats = useStats()

defineProps<{
  links?: Link[]
}>()
</script>

<template>
  <UHeader :links="links">
    <template #logo>
      <Logo class="block w-auto h-6" @click.right.prevent="$router.push('/design-kit')" />
    </template>

    <template #right>
      <UTooltip :text="$colorMode.preference === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'">
        <UColorModeButton />
      </UTooltip>

      <UTooltip text="GitHub Stars">
        <UButton
          icon="i-simple-icons-github"
          to="https://github.com/nuxt/nuxt"
          target="_blank"
          :label="formatNumber(stats.stars)"
          v-bind="($ui.button.secondary as any)"
        />
      </UTooltip>
    </template>

    <template #panel>
      <UNavigationTree :links="mapContentNavigation(navigation)" default-open :multiple="false" />
    </template>
  </UHeader>
</template>
