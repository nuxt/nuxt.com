<script setup lang="ts">
const route = useRoute()

const logo = useTemplateRef('logo')
const stats = useStats()
const { copy } = useClipboard()
const { headerLinks } = useHeaderLinks()
const { track } = useAnalytics()

const logoContextMenuItems = [
  [{
    label: 'Copy logo as SVG',
    icon: 'i-simple-icons-nuxtdotjs',
    onSelect() {
      track('Logo Action', { action: 'Copy SVG' })
      if (logo.value) {
        copy(logo.value.$el.outerHTML, {
          title: 'Nuxt logo copied as SVG',
          description: 'You can now paste it into your project',
          icon: 'i-lucide-circle-check',
          color: 'success'
        })
      }
    }
  }],
  [{
    label: 'Browse design kit',
    icon: 'i-lucide-shapes',
    to: '/design-kit',
    onSelect: () => track('Logo Action', { action: 'Browse Design Kit' })
  }]
]

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
      <NuxtLink to="/" aria-label="Back to home">
        <UContextMenu :items="logoContextMenuItems" size="xs">
          <NuxtLogo ref="logo" class="block w-auto h-6" />
        </UContextMenu>
      </NuxtLink>

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
      <UTooltip text="Search" :kbds="['meta', 'K']">
        <UContentSearchButton @click="trackSearchOpen" />
      </UTooltip>

      <UColorModeButton />

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
