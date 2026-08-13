<script setup lang="ts">
import { kebabCase } from 'scule'

definePageMeta({
  heroBackground: 'opacity-30 -z-10'
})

const route = useRoute()

const { data: agency } = await useAsyncData(kebabCase(route.path), () => clientContent.get(route.path))
if (!agency.value) {
  throw createError({ statusCode: 404, statusMessage: 'Agency not found', fatal: true })
}

const links = computed(() => agency.value
  ? [{
      label: `Visit ${agency.value.data.title}`,
      color: 'neutral' as const,
      size: 'md' as const,
      variant: 'solid' as const,
      icon: 'i-lucide-square-arrow-out-up-right',
      trailing: true,
      to: agency.value.data.link,
      target: '_blank'
    }]
  : [])

const title = agency.value.data.title
const description = agency.value.data.description
useSeoMeta({
  titleTemplate: '%s · Nuxt Agencies',
  title,
  description,
  ogDescription: description,
  ogTitle: `${title} · Nuxt Agencies`
})
useCanonical()

defineOgImage('Docs.takumi', {
  headline: 'Nuxt Agencies',
  title,
  description
})
</script>

<template>
  <UContainer v-if="agency">
    <UPageHeader :description="agency.data.description" :links="links" :ui="{ headline: 'mb-8' }">
      <template #headline>
        <UBreadcrumb :items="[{ label: 'Agencies', to: '/enterprise/agencies' }, { label: agency.data.title }]" />
      </template>

      <template #title>
        <div class="flex items-center gap-4">
          <UColorModeAvatar :light="agency.data.logo.light" :dark="agency.data.logo.dark" size="lg" class="-m-[4px] rounded-none bg-transparent" :alt="`${agency.data.title} logo`" />

          <span>{{ agency.data.title }}</span>
        </div>
      </template>

      <div class="flex flex-col lg:flex-row lg:items-center gap-3 mt-4">
        <div class="flex items-center gap-1.5">
          <UIcon name="i-lucide-map-pin" class="size-5 shrink-0" />
          <span class="text-sm font-medium">{{ agency.data.location }}</span>
        </div>

        <span v-if="agency.data.x" class="hidden lg:block text-muted">&bull;</span>
        <NuxtLink v-if="agency.data.x" :to="`https://x.com/${agency.data.x}`" target="_blank" class="flex items-center gap-1.5 hover:text-primary">
          <UIcon name="i-simple-icons-x" class="size-5" />
          <span class="text-sm font-medium">{{ agency.data.x }}</span>
        </NuxtLink>

        <span v-if="agency.data.github" class="hidden lg:block text-muted">&bull;</span>
        <NuxtLink v-if="agency.data.github" :to="`https://github.com/${agency.data.github}`" target="_blank" class="flex items-center gap-1.5 hover:text-primary">
          <UIcon name="i-simple-icons-github" class="size-5" />
          <span class="text-sm font-medium">{{ agency.data.github }}</span>
        </NuxtLink>

        <span v-if="agency.data.linkedin" class="hidden lg:block text-muted">&bull;</span>
        <NuxtLink v-if="agency.data.linkedin" :to="`https://linkedin.com/company/${agency.data.linkedin}`" target="_blank" class="flex items-center gap-1.5 hover:text-primary">
          <UIcon name="i-simple-icons-linkedin" class="size-5" />
          <span class="text-sm font-medium">{{ agency.data.linkedin }}</span>
        </NuxtLink>

        <span v-if="agency.data.instagram" class="hidden lg:block text-muted">&bull;</span>
        <NuxtLink v-if="agency.data.instagram" :to="`https://instagram.com/${agency.data.instagram}`" target="_blank" class="flex items-center gap-1.5 hover:text-primary">
          <UIcon name="i-simple-icons-instagram" class="size-5" />
          <span class="text-sm font-medium">{{ agency.data.instagram }}</span>
        </NuxtLink>

        <span v-if="agency.data.link" class="hidden lg:block text-muted">&bull;</span>
        <NuxtLink v-if="agency.data.link" :to="agency.data.link" target="_blank" class="flex items-center gap-1.5 hover:text-primary">
          <UIcon name="i-lucide-link" class="size-5" />
          <span class="text-sm font-medium">Website</span>
        </NuxtLink>
      </div>
    </UPageHeader>

    <UPage :ui="{ right: 'my-8' }">
      <UPageBody>
        <MarkdownDocument v-if="agency.nodes?.length" :value="agency" />
      </UPageBody>

      <template #right>
        <div>
          <UPageLinks
            v-if="agency.data.services?.length"
            title="Technical Expertise"
            :links="agency.data.services.map(service => ({ label: service }))"
          />

          <div v-if="agency.data.resources?.length">
            <USeparator type="dashed" class="my-6" />

            <UPageLinks title="Resources" :links="agency.data.resources" />
          </div>
        </div>
      </template>
    </UPage>
  </UContainer>
</template>
