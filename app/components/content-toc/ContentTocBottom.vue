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
}

defineProps<Props>()

const route = useRoute()
const { open } = useNuxtAgent()
const { track } = useAnalytics()

function explainWithAI() {
  track('Nuxt Agent Explain Page', { page: route.path })
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
  <Ads />
</template>
