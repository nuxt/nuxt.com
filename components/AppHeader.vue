<script setup lang="ts">
import type { NavItem } from '@nuxt/content/dist/runtime/types'
import type { Link } from '#ui-pro/types'

const navigation = inject<Ref<NavItem[]>>('navigation')

const stats = useStats()
const { metaSymbol } = useShortcuts()

const route = useRoute()
const mobileNav = computed(() => {
  const links = mapContentNavigation(navigation.value)
  // Show Migration and Bridge on mobile only when user is reading them
  const docsLink = links.find((link) => link.to === '/docs')
  if (docsLink && !route.path.startsWith('/docs/bridge') && !route.path.startsWith('/docs/migration')) {
    docsLink.children = docsLink.children.filter((link) => !['/docs/bridge', '/docs/migration'].includes(link.to as string))
  }
  return links
})

defineProps<{
  links?: Link[]
}>()
</script>

<template>
  <UHeader :links="links">
    <template #top>
      <AppBanner :id="1" to="https://masteringnuxt.com/?ref=nuxt">
        <p class="text-gray-600 dark:text-gray-300 flex items-center gap-1">
          <UIcon name="i-ph-lightbulb-duotone" class="w-4 h-4" />

          Enjoy <span class="font-bold text-gray-900 dark:text-white">Mastering Nuxt</span> black friday!
        </p>

        <UButton label="Learn more" color="gray" trailing-icon="i-ph-arrow-right" size="xs" class="rounded-full" />
      </AppBanner>
    </template>

    <template #logo>
      <Logo class="block w-auto h-6" @click.right.prevent="$router.push('/design-kit')" />
    </template>

    <template #right>
      <UTooltip text="Search" :shortcuts="[metaSymbol, 'K']">
        <UDocsSearchButton :label="null" />
      </UTooltip>

      <UTooltip :text="$colorMode.preference === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'">
        <UColorModeButton />
      </UTooltip>

      <UTooltip text="GitHub Stars">
        <UButton
          icon="i-simple-icons-github"
          to="https://github.com/nuxt/nuxt"
          target="_blank"
          :label="stats ? formatNumber(stats.stars) : '...'"
          v-bind="($ui.button.secondary as any)"
        />
      </UTooltip>
    </template>

    <template #panel>
      <UNavigationTree :links="mobileNav" default-open :multiple="false" />
    </template>
  </UHeader>
</template>
