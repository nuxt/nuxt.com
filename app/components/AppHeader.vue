<script setup lang="ts">
const { headerLinks } = useNavigation()

const logo = ref(null)

const stats = useStats()
const { copy } = useClipboard()
const toast = useToast()
const version = computed(() => stats.value?.version?.match(/\d+\.\d+/)[0])

/* const mobileNav = computed(() => {
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
}) */

const logoContextMenuItems = [
  [{
    label: 'Copy logo as SVG',
    icon: 'i-simple-icons-nuxtdotjs',
    onSelect() {
      copy(logo.value.$el.outerHTML)
      toast.add({
        title: 'Nuxt logo copied as SVG',
        description: 'You can now paste it into your project',
        icon: 'i-lucide-circle-check',
        color: 'success'
      })
    }
  }],
  [{
    label: 'Browse design kit',
    icon: 'i-ph-shapes',
    to: '/design-kit'
  }]
]
const isMobile = ref(false)

onMounted(() => {
  isMobile.value = ('ontouchstart' in document.documentElement)
})
</script>

<template>
  <UHeader>
    <template #left>
      <UContextMenu
        :items="logoContextMenuItems"
      >
        <NuxtLink to="/" class="flex gap-2 items-end">
          <NuxtLogo ref="logo" class="block w-auto h-6" />

          <UTooltip v-if="version" :text="`Latest release: v${stats.version}`">
            <UBadge variant="subtle" size="sm" class="-mb-[2px] rounded font-semibold">
              v{{ version }}
            </UBadge>
          </UTooltip>
        </NuxtLink>
      </UContextMenu>
    </template>

    <UNavigationMenu :items="headerLinks" variant="link" :ui="{ linkLeadingIcon: 'hidden' }" />

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
      <UNavigationMenu :items="headerLinks" orientation="vertical" class="-mx-2.5" />
    </template>
  </UHeader>
</template>
