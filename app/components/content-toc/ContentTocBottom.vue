<script setup lang="ts">
interface PageLink {
  label: string
  icon?: string
  to?: string
  target?: '_blank' | '_parent' | '_self' | '_top' | string
  external?: boolean
}

interface Props {
  hasLinks?: boolean
  communityLinks: PageLink[]
  drawer?: boolean
}

const props = defineProps<Props>()

const route = useRoute()
const { open } = useNuxtAgent()
const { track } = useAnalytics()

// Carbon only renders a single ad per page, so mount it in the toc that is
// actually visible: the drawer below `lg`, the aside above.
const isLargeScreen = useMediaQuery('(min-width: 1024px)')
const showAds = computed(() => props.drawer ? !isLargeScreen.value : isLargeScreen.value)

function explainWithAI() {
  track('Nuxi Explain Page', { page: route.path })
  open('Explain this page')
}
</script>

<template>
  <USeparator v-if="hasLinks" type="dashed" />
  <UPageLinks title="Community" :links="communityLinks" />
  <USeparator type="dashed" />
  <UPageLinks
    :links="[{
      label: 'Explain with Agent',
      icon: 'i-lucide-brain',
      onClick: explainWithAI
    }]"
  />
  <USeparator type="dashed" />
  <SocialLinks />
  <Ads v-if="showAds" />
</template>
