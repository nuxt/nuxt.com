<script setup lang="ts">
import {
  AgentsAside,
  AgentsCard,
  AgentsCaveat,
  AgentsChatPreview,
  AgentsCodeFrameVisual,
  AgentsCodeGroup,
  AgentsConfigCheckVisual,
  AgentsConnect,
  AgentsErrorCodeVisual,
  AgentsEvalSuites,
  AgentsFileTree,
  AgentsHalfHeader,
  AgentsLinkList,
  AgentsLoopRing,
  AgentsMcpLink,
  AgentsMcpTools,
  AgentsMcpTree,
  AgentsNuxiCard,
  AgentsProblemsPanel,
  AgentsProsePre,
  AgentsRelease,
  AgentsSection,
  AgentsSizeBar,
  AgentsStat,
  AgentsStatBand,
  AgentsTabs,
  AgentsTip,
  AgentsTokenRange,
  AgentsTypedCommand,
  AgentsWebMcpDemo,
  UInputCopy
} from '#components'
import { AGENTS_HALVES_KEY, type AgentsHalf } from '~/utils/agents'

definePageMeta({
  heroBackground: 'opacity-70 -z-10'
})

const markdownComponents = {
  ...proseComponents,
  AgentsAside,
  AgentsCard,
  AgentsCaveat,
  AgentsChatPreview,
  AgentsCodeFrameVisual,
  AgentsConfigCheckVisual,
  AgentsConnect,
  AgentsErrorCodeVisual,
  AgentsEvalSuites,
  AgentsFileTree,
  AgentsHalfHeader,
  AgentsLinkList,
  AgentsLoopRing,
  AgentsMcpLink,
  AgentsMcpTools,
  AgentsMcpTree,
  AgentsNuxiCard,
  AgentsProblemsPanel,
  AgentsRelease,
  AgentsSection,
  AgentsSizeBar,
  AgentsStat,
  AgentsStatBand,
  AgentsTip,
  AgentsTokenRange,
  AgentsTypedCommand,
  AgentsWebMcpDemo,
  UInputCopy,
  // Page-local overrides: pill tabs, code groups whose tabs clear the copy button,
  // and code blocks with line numbers and diff marks.
  ProseTabs: AgentsTabs,
  ProseCodeGroup: AgentsCodeGroup,
  ProsePre: AgentsProsePre
}

const { data: page } = await useAsyncData('agents', () => useContent('site').get('/agents'))
if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
}

const pageData = computed(() => page.value!.data)
const halves = computed(() => (pageData.value.halves ?? []) as AgentsHalf[])
provide(AGENTS_HALVES_KEY, halves)

// The hero title ends with the words in `highlight`, shown in primary.
const titleParts = computed(() => {
  const title: string = pageData.value.title
  const highlight: string | undefined = pageData.value.highlight
  if (!highlight || !title.endsWith(highlight)) return { start: title, highlight: '' }
  return { start: title.slice(0, -highlight.length), highlight }
})

const motion = useAgentsMotion()

const title = pageData.value.head?.title || pageData.value.title
const description = pageData.value.head?.description || pageData.value.description

useSeoMeta({
  titleTemplate: '%s',
  title,
  description,
  ogDescription: description,
  ogTitle: title
})
useCanonical()
defineOgImage('Docs.takumi', {
  title,
  description
})
</script>

<template>
  <div v-if="pageData">
    <section class="border-b border-default">
      <UContainer class="flex flex-col gap-8 lg:gap-14 pt-16 sm:pt-24 lg:pt-32 pb-14 sm:pb-20 lg:pb-24">
        <p class="flex items-center gap-3 font-mono text-[13px]/none font-medium tracking-[0.08em] uppercase text-muted">
          <span class="size-2 rounded-full bg-primary" :class="{ 'agents-ping': motion }" />
          {{ title }}
        </p>

        <div class="flex flex-wrap items-end justify-between gap-x-16 gap-y-7">
          <h1 class="-ms-[0.04em] font-heading font-medium text-[clamp(54px,10.8vw,164px)]/[0.9] tracking-[-0.05em] text-highlighted">
            {{ titleParts.start }}<br><span class="text-primary">{{ titleParts.highlight }}</span>
          </h1>

          <div class="flex-[0_1_30rem] min-w-0 flex flex-col gap-6 lg:pb-3.5">
            <p class="text-[clamp(17px,1.5vw,21px)]/[1.55] text-muted text-pretty">
              {{ pageData.description }}
            </p>
            <div class="flex flex-wrap gap-3">
              <UButton
                v-for="(link, index) in pickLinks(pageData.links)"
                :key="index"
                v-bind="link"
                class="flex-[1_1_200px] justify-center min-h-12 px-5 rounded-[10px] font-semibold"
              />
            </div>
          </div>
        </div>

        <AgentsHeroSplit class="mt-2 lg:mt-6" />
      </UContainer>
    </section>

    <AgentsHalfOverview :halves="halves" />

    <div>
      <AgentsHalfBar :halves="halves" />
      <MarkdownDocument v-if="page" :value="page" :components="markdownComponents" />
    </div>
  </div>
</template>

<style>
.agents-ping {
  animation: agents-ping 2.4s ease-out infinite;
}

@keyframes agents-ping {
  0% { box-shadow: 0 0 0 0 color-mix(in oklab, var(--ui-primary) 50%, transparent) }
  100% { box-shadow: 0 0 0 10px transparent }
}
</style>
