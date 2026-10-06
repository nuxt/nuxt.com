<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'
import wordmarkDark from '~~/public/assets/design-kit/logo-green-white.svg?raw'
import wordmarkLight from '~~/public/assets/design-kit/logo-green-black.svg?raw'
import icon from '~~/public/assets/design-kit/icon-green.svg?raw'

const route = useRoute()
const colorMode = useColorMode()

const logoLink = useTemplateRef('logoLink')
const logoMenuOpen = ref(false)

const stats = useStats()
const { loggedIn } = useUserSession()
const { copy } = useClipboard()
const { headerLinks } = useHeaderLinks()
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

function trackSearchOpen() {
  track('Search Opened')
}

function trackGitHubClick() {
  track('Header Action', { action: 'GitHub Stars' })
}
</script>

<template>
  <UHeader :ui="{ left: 'min-w-0 items-end' }" class="flex flex-col">
    <template #left>
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

      <VersionMenu />
    </template>

    <UNavigationMenu
      :items="headerLinks.map((link) => {
        if (link.to.startsWith('/docs')) {
          return { ...link, children: [] }
        }
        return link
      })"
      variant="link"
      content-orientation="vertical"
      :ui="{ linkLeadingIcon: 'hidden' }"
    />

    <template #right>
      <AgentChatButton />
      <UTooltip text="Search" :kbds="['meta', 'K']" ignore-non-keyboard-focus>
        <UContentSearchButton @click="trackSearchOpen" />
      </UTooltip>

      <template v-if="!loggedIn">
        <UTooltip text="Toggle theme" :kbds="['d']">
          <UColorModeButton />
        </UTooltip>

        <UTooltip text="GitHub Stars">
          <UButton
            icon="i-simple-icons-github"
            to="https://go.nuxt.com/github"
            target="_blank"
            variant="ghost"
            color="neutral"
            square
            :label="stats ? formatNumber(stats.stars) : '...'"
            aria-label="Nuxt on GitHub"
            :ui="{
              label: 'hidden sm:inline-flex'
            }"
            @click="trackGitHubClick"
          />
        </UTooltip>
      </template>

      <HeaderUserMenu v-else />
    </template>

    <template #toggle="{ open, toggle }">
      <HeaderToggle
        :open="open"
        class="lg:hidden"
        @click="() => { track('Mobile Menu Toggled', { open: !open }); toggle() }"
      />
    </template>

    <template #body>
      <HeaderBody />
    </template>

    <template v-if="route.path.startsWith('/docs/') || route.path.startsWith('/deploy')" #bottom>
      <HeaderBottom />
    </template>
  </UHeader>
</template>
