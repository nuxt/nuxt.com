<script setup lang="ts">
import type { NuxtError } from '#app'

useSeoMeta({
  title: 'Page not found',
  description: 'We are sorry but this page could not be found.'
})

const props = defineProps<{ error: NuxtError }>()

const route = useRoute()
const { version } = useDocsVersion()

const { data: navigation } = await useFetch('/api/navigation.json')

const versionNavigation = computed(() => navigation.value?.filter(item => item.path === version.value.path || item.path === '/blog') ?? [])

provide('navigation', versionNavigation)

// Agents that asked for HTML get this page rather than the markdown error body
// `nuxt-agent-discovery` serves, so the same recovery links are rendered here:
// where to go next on the site, and where the machine-readable indexes live.
const notFound = computed(() => props.error?.statusCode === 404 || props.error?.statusCode === 410)

const links = [
  { label: 'Documentation', to: '/docs' },
  { label: 'Modules', to: '/modules' },
  { label: 'Blog', to: '/blog' }
]

// Straight from the discovery registry, so a document the site starts or stops
// publishing shows up here without anyone remembering to edit this list. The
// two rels that are pages rather than documents are dropped: `/docs` is already
// a button above, and the markdown twin of a page that does not exist is not
// somewhere to send anyone. Labelled by filename, because the registry titles
// are written for the markdown error body and run a paragraph long.
const SKIPPED_RELS = new Set(['service-doc', 'alternate'])

const documents = computed(() => useAgentResources()
  .filter(resource => !SKIPPED_RELS.has(resource.rel))
  .map(resource => ({ href: resource.href, title: resource.title, label: resource.href.split('/').pop() || resource.href })))
</script>

<template>
  <UApp>
    <div :class="[(route.path.startsWith('/docs/') || route.path.startsWith('/deploy')) && 'root']">
      <Header />

      <UError :error="error">
        <template #links>
          <div class="flex flex-col items-center gap-6">
            <div class="flex flex-wrap items-center justify-center gap-2">
              <UButton to="/" size="lg" color="primary" variant="solid" label="Back to home" />
              <template v-if="notFound">
                <UButton
                  v-for="link in links"
                  :key="link.to"
                  :to="link.to"
                  size="lg"
                  color="neutral"
                  variant="ghost"
                  :label="link.label"
                />
              </template>
            </div>

            <p v-if="notFound" class="max-w-xl text-sm text-muted text-balance">
              For agents:
              <template v-for="(document, index) in documents" :key="document.href">
                <ULink :to="document.href" :title="document.title" external class="whitespace-nowrap text-default hover:text-primary">{{ document.label }}</ULink><span v-if="index < documents.length - 1"> · </span>
              </template>
            </p>
          </div>
        </template>
      </UError>

      <AppFooter />

      <ClientOnly>
        <Search :navigation="versionNavigation" />
      </ClientOnly>
    </div>
  </UApp>
</template>
