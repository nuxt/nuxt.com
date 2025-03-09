<script setup lang="ts">
const { headerLinks } = useNavigation()

const logo = ref(null)

const stats = useStats()

const { copy } = useClipboard()

const version = computed(() => stats.value?.version?.match(/\d+\.\d+/)[0])

const mobileNav = computed(() => {
  return [
    ...headerLinks.value,
    {
      label: 'Design Kit',
      icon: 'i-lucide-palette',
      to: '/design-kit'
    }
  ]
})

const logoContextMenuItems = [
  [{
    label: 'Copy logo as SVG',
    icon: 'i-simple-icons-nuxtdotjs',
    onSelect() {
      copy(logo.value.$el.outerHTML, {
        title: 'Nuxt logo copied as SVG',
        description: 'You can now paste it into your project',
        icon: 'i-lucide-circle-check',
        color: 'success'
      })
    }
  }],
  [{
    label: 'Browse design kit',
    icon: 'i-lucide-shapes',
    to: '/design-kit'
  }]
]
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
        <UContentSearchButton />
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
          :ui="{
            label: 'hidden sm:inline-flex'
          }"
        />
      </UTooltip>
    </template>

    <template #body>
      <UNavigationMenu :items="mobileNav" orientation="vertical" class="-mx-2.5" />
    </template>
  </UHeader>
</template>
