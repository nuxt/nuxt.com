<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'
import wordmarkDark from '~~/public/assets/design-kit/logo-green-white.svg?raw'
import wordmarkLight from '~~/public/assets/design-kit/logo-green-black.svg?raw'
import icon from '~~/public/assets/design-kit/icon-green.svg?raw'

const colorMode = useColorMode()

const logoLink = useTemplateRef('logoLink')
const logoMenuOpen = ref(false)

const { copy } = useClipboard()
const { track } = useAnalytics()

function copySvg(name: string, svg: string) {
  track('Logo Action', { action: `Copy ${name}` })
  copy(svg, {
    title: `Nuxt ${name.toLowerCase()} copied as SVG`,
    icon: 'i-lucide-circle-check',
    color: 'success'
  })
}

const logoMenuItems = computed(() => [
  [{
    label: 'Copy Wordmark',
    slot: 'asset' as const,
    value: 'wordmark',
    class: 'p-0 before:hidden',
    onSelect: () => copySvg('Wordmark', colorMode.value === 'dark' ? wordmarkDark : wordmarkLight)
  }, {
    label: 'Copy Logo',
    slot: 'asset' as const,
    value: 'icon',
    class: 'p-0 before:hidden',
    onSelect: () => copySvg('Logo', icon)
  }],
  [{
    label: 'Download Brand Assets',
    icon: 'i-lucide-download',
    to: '/nuxt-brand-assets.zip',
    download: 'nuxt-brand-assets.zip',
    external: true,
    onSelect: () => track('Logo Action', { action: 'Download Brand Assets' })
  }, {
    label: 'Brand Guidelines',
    icon: 'i-lucide-shapes',
    to: '/design-kit',
    onSelect: () => track('Logo Action', { action: 'Browse Design Kit' })
  }]
] satisfies DropdownMenuItem[][])
</script>

<template>
  <NuxtLink
    ref="logoLink"
    to="/"
    aria-label="Back to home"
    @contextmenu.prevent="logoMenuOpen = true"
  >
    <NuxtLogo class="block w-auto h-6" />
  </NuxtLink>

  <UDropdownMenu
    v-model:open="logoMenuOpen"
    :items="logoMenuItems"
    :modal="false"
    :content="{ reference: logoLink?.$el, align: 'start', sideOffset: 12 }"
    :ui="{
      content: 'w-80 rounded-xl',
      group: 'p-2 first:grid first:grid-cols-2 first:gap-2',
      itemLeadingIcon: 'size-4.5'
    }"
  >
    <template #asset="{ item }">
      <div class="flex flex-col gap-2 w-full">
        <div class="flex items-center justify-center h-16 rounded-lg bg-muted ring ring-default transition-colors group-data-highlighted:ring-accented group-data-highlighted:bg-elevated">
          <NuxtLogo v-if="item.value === 'wordmark'" class="h-5 w-auto" />
          <UIcon v-else name="i-custom-nuxt" class="size-7" />
        </div>
        <span class="text-sm text-default group-data-highlighted:text-highlighted">{{ item.label }}</span>
      </div>
    </template>
  </UDropdownMenu>
</template>
