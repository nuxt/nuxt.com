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
const { open, isOpen } = useNuxtAgent()
const { track } = useAnalytics()

// Carbon only renders a single ad per page, so mount it in the toc that is
// actually visible: the drawer below `lg`, the aside above unless the agent
// panel covers it. `isOpen` is restored from local storage on nuxt ready, so
// wait for it to settle rather than loading an ad we tear down right after.
const isLargeScreen = useMediaQuery('(min-width: 1024px)')
const agentSettled = ref(false)
onNuxtReady(() => nextTick(() => agentSettled.value = true))
const showAds = computed(() => props.drawer ? !isLargeScreen.value : agentSettled.value && isLargeScreen.value && !isOpen.value)

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
