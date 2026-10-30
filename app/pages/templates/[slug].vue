<script setup lang="ts">
definePageMeta({
  heroBackground: false
})

const route = useRoute()
const { all, templates, health } = await useTemplates()

const template = computed(() => all.value.find(item => item.slug === route.params.slug))
if (!template.value) {
  throw createError({ statusCode: 404, statusMessage: 'Template not found', fatal: true })
}
const templateHealth = computed(() => health.value[template.value!.slug])
const hasWorkingAlternative = computed(() => templates.value.some(item => item.slug !== template.value?.slug && item.category === template.value?.category && isWorking(health.value[item.slug])))

const { track } = useAnalytics()

const links = computed(() => [
  template.value!.demo && { label: 'Demo', icon: 'i-lucide-globe', to: template.value!.demo, target: '_blank', action: 'Demo' },
  template.value!.repo && { label: 'GitHub', icon: 'i-simple-icons-github', to: templateRepoUrl(template.value!), target: '_blank', action: 'GitHub' },
  template.value!.docs && { label: 'Docs', icon: 'i-lucide-book-open', to: template.value!.docs, action: 'Docs' }
].filter(link => !!link))

const title = `${template.value.name} ${isStarter(template.value) ? 'Starter' : 'Template'}`
useSeoMeta({
  title,
  description: template.value.description,
  ogTitle: `${title} · Nuxt`,
  ogDescription: template.value.description
})
useCanonical()
defineOgImage('Docs.takumi', { title, description: template.value.description })
</script>

<template>
  <UContainer v-if="template" class="pt-6 sm:pt-8 pb-24 flex flex-col gap-8">
    <div class="flex flex-col gap-4">
      <UButton
        to="/templates"
        label="Templates"
        icon="i-lucide-arrow-left"
        color="neutral"
        variant="link"
        size="sm"
        class="self-start px-0 text-muted"
      />

      <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div class="min-w-0 flex flex-col gap-2">
          <h1 class="flex flex-wrap items-center gap-x-3 gap-y-1 text-3xl sm:text-4xl font-semibold text-highlighted text-balance">
            {{ template.name }}
            <UBadge v-if="isStarter(template)" label="Starter" color="primary" variant="subtle" class="rounded-full" />
            <UBadge v-else-if="template.official" label="Official" color="primary" variant="subtle" class="rounded-full" />
            <UBadge v-else-if="template.purchase" label="Paid" color="neutral" variant="subtle" class="rounded-full ring-default" />
          </h1>
          <p class="max-w-2xl text-lg text-muted text-pretty">
            {{ template.description }}
          </p>
        </div>
        <div v-if="links.length" class="flex gap-2 shrink-0">
          <UButton
            v-for="link in links"
            :key="link.label"
            :label="link.label"
            :icon="link.icon"
            :to="link.to"
            :target="link.target"
            color="neutral"
            variant="ghost"
            @click="track('Template Action', { template: template.name, action: link.action })"
          />
        </div>
      </div>

      <TemplatesMeta :template="template" :health="templateHealth" />
    </div>

    <TemplatesAlert :template="template" :health="templateHealth" :has-working-alternative="hasWorkingAlternative" />

    <TemplatesUse :template="template" :health="templateHealth" />
    <div class="flex flex-col gap-3">
      <TemplatesPreview :template="template" :health="templateHealth" />
      <TemplatesPoweredBy v-if="templateHealth?.check" class="self-end" />
    </div>
    <TemplatesIncluded :template="template" :health="templateHealth" />
  </UContainer>
</template>
