<script setup lang="ts">
const route = useRoute()

const stats = useStats()
const { loggedIn } = useUserSession()
const { headerLinks } = useHeaderLinks()
const { track } = useAnalytics()

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
      <HeaderLogo />

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
