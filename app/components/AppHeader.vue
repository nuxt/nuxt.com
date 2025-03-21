<script setup lang="ts">
import type { ContentNavigationItem } from '@nuxt/content'

const navigation = inject<Ref<ContentNavigationItem[]>>('navigation')

const logo = ref(null)

const route = useRoute()
const stats = useStats()
const { copy } = useClipboard()
const { headerLinks } = useNavigation()

const version = computed(() => stats.value?.version?.match(/\d+\.\d+/)[0])

const mobileNavigation = computed(() => {
  // Show Migration and Bridge on mobile only when user is reading them
  const docsLink = navigation.value.find(link => link.path === '/docs')
  if (docsLink && !route.path.startsWith('/docs/bridge') && !route.path.startsWith('/docs/migration')) {
    docsLink.children = docsLink.children.filter(link => !['/docs/bridge', '/docs/migration'].includes(link.path as string))
  }

  return [
    docsLink,
    ...headerLinks.value.slice(1).map(link => ({
      ...link,
      title: link.label,
      path: link.to,
      children: link.children?.map(child => ({
        ...child,
        title: child.label,
        path: child.to
      }))
    })),
    {
      title: 'Design Kit',
      icon: 'i-lucide-palette',
      path: '/design-kit'
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
      <UContextMenu :items="logoContextMenuItems" size="xs">
        <NuxtLink to="/" class="flex gap-2 items-end">
          <NuxtLogo ref="logo" class="block w-auto h-6" />

          <UTooltip v-if="version" :text="`Latest release: v${stats.version}`">
            <UBadge variant="subtle" size="sm" class="-mb-[2px] rounded font-semibold text-[12px]/3">
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

      <UColorModeButton />

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
      <UContentNavigation :navigation="mobileNavigation" default-open highlight />
    </template>
  </UHeader>
</template>
