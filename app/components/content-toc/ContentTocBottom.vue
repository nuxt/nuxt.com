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
const { open } = useAssistant()
const { track } = useAnalytics()

function explainWithAI() {
  track('Assistant Explain Page', { page: route.path })
  open(`[Page: ${route.path}] Explain this page`, true)
}
</script>

<template>
  <USeparator v-if="hasLinks" type="dashed" />
  <UPageLinks title="Community" :links="communityLinks" />
  <USeparator type="dashed" />
  <UButton
    icon="i-lucide-brain"
    label="Explain with AI"
    size="sm"
    variant="link"
    color="neutral"
    class="p-0 -my-2"
    @click="explainWithAI"
  />
  <USeparator type="dashed" />
  <SocialLinks />
  <Ads />
</template>
