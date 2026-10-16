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

// Animate the width of the auth actions when switching between guest and user
// so the buttons on the left slide instead of jumping
const authActions = useTemplateRef<HTMLElement>('authActions')
let fromWidth = 0

function onBeforeLeave() {
  fromWidth = authActions.value?.offsetWidth || 0
}

function onEnter() {
  const el = authActions.value
  if (!el || !fromWidth || matchMedia('(prefers-reduced-motion: reduce)').matches) return

  el.style.width = ''
  const toWidth = el.offsetWidth
  el.style.width = `${fromWidth}px`
  void el.offsetWidth
  el.style.width = `${toWidth}px`
}

function onWidthTransitionEnd(event: TransitionEvent) {
  if (event.target === event.currentTarget && event.propertyName === 'width') {
    authActions.value?.style.removeProperty('width')
  }
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

      <div
        ref="authActions"
        class="relative flex items-center justify-end transition-[width] duration-300 ease-out motion-reduce:transition-none"
        @transitionend="onWidthTransitionEnd"
      >
        <Transition
          enter-active-class="transition duration-300 ease-out motion-reduce:transition-none"
          enter-from-class="opacity-0 scale-50 blur-xs"
          leave-active-class="absolute right-0 origin-right transition duration-200 ease-in motion-reduce:transition-none"
          leave-to-class="opacity-0 scale-75 blur-xs"
          @before-leave="onBeforeLeave"
          @enter="onEnter"
        >
          <div v-if="!loggedIn" key="guest" class="flex items-center gap-1.5">
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
          </div>

          <div v-else key="user" class="flex items-center">
            <HeaderUserMenu />
          </div>
        </Transition>
      </div>
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
