<script setup lang="ts">
import type { NavItem } from '@nuxt/content'
import type { Link } from '#ui-pro/types'
import { mapContentNavigation } from '#ui-pro/utils'

const logo = ref(null)
const navigation = inject<Ref<NavItem[]>>('navigation')

const stats = useStats()
const { copy } = useClipboard()

const version = computed(() => stats.value?.version?.match(/[0-9]+\.[0-9]+/)[0])

const route = useRoute()
const headerLinks = useNavigation().headerLinks
const mobileNav = computed(() => {
  const links = mapContentNavigation(navigation.value)

  // Show Migration and Bridge on mobile only when user is reading them
  const docsLink = links.find(link => link.to === '/docs')
  if (docsLink && !route.path.startsWith('/docs/bridge') && !route.path.startsWith('/docs/migration')) {
    docsLink.children = docsLink.children.filter(link => !['/docs/bridge', '/docs/migration'].includes(link.to as string))
  }

  return [
    docsLink,
    ...headerLinks.value.slice(1),
    {
      label: 'Design Kit',
      icon: 'i-ph-palette',
      to: '/design-kit'
    }
  ]
})

const open = ref(false)
const dropdownItems = [
  [{
    label: 'Copy logo as SVG',
    icon: 'i-simple-icons-nuxtdotjs',
    click: () => copy(logo.value.$el.outerHTML)
  }],
  [{
    label: 'Browse design kit',
    icon: 'i-ph-shapes',
    to: '/design-kit'
  }]
]
const isMobile = ref(false)
function openLogoContext() {
  if (isMobile.value) return navigateTo('/')
  open.value = true
}

onMounted(() => {
  isMobile.value = ('ontouchstart' in document.documentElement)
})

defineProps<{
  links?: Link[]
}>()
</script>

<template>
  <UHeader :links="links" class="dark:bg-(--ui-color-neutral-950)">
    <template #title>
      <UDropdownMenu
        v-model:open="open"
        :items="dropdownItems"
      >
        <NuxtLink to="/" class="flex gap-2 items-end">
          <NuxtLogo ref="logo" class="block w-auto h-6" @click.right.prevent="openLogoContext" @click.left.prevent="navigateTo('/')" />

          <UTooltip v-if="version" :text="`Latest release: v${stats.version}`">
            <UBadge variant="subtle" size="sm" class="-mb-[2px] rounded font-semibold">
              v{{ version }}
            </UBadge>
          </UTooltip>
        </NuxtLink>
      </UDropdownMenu>
    </template>

    <UNavigationMenu :items="links" :ui="{ linkLeadingIcon: 'hidden' }" />

    <template #right>
      <UTooltip text="Search" :kbds="['meta', 'K']">
        <UContentSearchButton :label="null" />
      </UTooltip>

      <UTooltip :text="$colorMode.preference === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'">
        <UColorModeButton />
      </UTooltip>

      <UTooltip text="GitHub Stars">
        <UButton
          icon="i-simple-icons-github"
          to="https://go.nuxt.com/github"
          target="_blank"
          variant="ghost"
          color="neutral"
          :label="stats ? formatNumber(stats.stars) : '...'"
        />
      </UTooltip>
    </template>

    <template #body>
      <UNavigationMenu :items="mobileNav" orientation="vertical" />
    </template>
  </UHeader>
</template>
