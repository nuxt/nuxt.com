<script setup lang="ts">
import { kebabCase } from 'scule'

definePageMeta({
  heroBackground: 'opacity-30 -z-10'
})

const route = useRoute()

const { data: agency } = await useAsyncData(kebabCase(route.path), () => useContent('site').get(route.path))
if (!agency.value) {
  throw createError({ statusCode: 404, statusMessage: 'Agency not found', fatal: true })
}

const agencyData = computed(() => agency.value!.data)

const links = computed(() => agencyData.value
  ? [{
      label: `Visit ${agencyData.value.title}`,
      color: 'neutral' as const,
      size: 'md' as const,
      variant: 'solid' as const,
      icon: 'i-lucide-square-arrow-out-up-right',
      trailing: true,
      to: agencyData.value.link,
      target: '_blank'
    }]
  : [])

const title = agencyData.value.title
const description = agencyData.value.description
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
  <UContainer v-if="agencyData">
    <UPageHeader :description="agencyData.description" :links="links" :ui="{ headline: 'mb-8' }">
      <template #headline>
        <UBreadcrumb :items="[{ label: 'Agencies', to: '/enterprise/agencies' }, { label: agencyData.title }]" />
      </template>

      <template #title>
        <div class="flex items-center gap-4">
          <UColorModeAvatar :light="agencyData.logo.light" :dark="agencyData.logo.dark" size="lg" class="-m-[4px] rounded-none bg-transparent" :alt="`${agencyData.title} logo`" />

          <span>{{ agencyData.title }}</span>
        </div>
      </template>

      <div class="flex flex-col lg:flex-row lg:items-center gap-3 mt-4">
        <div class="flex items-center gap-1.5">
          <UIcon name="i-lucide-map-pin" class="size-5 shrink-0" />
          <span class="text-sm font-medium">{{ agencyData.location }}</span>
        </div>

        <span v-if="agencyData.x" class="hidden lg:block text-muted">&bull;</span>
        <NuxtLink v-if="agencyData.x" :to="`https://x.com/${agencyData.x}`" target="_blank" class="flex items-center gap-1.5 hover:text-primary">
          <UIcon name="i-simple-icons-x" class="size-5" />
          <span class="text-sm font-medium">{{ agencyData.x }}</span>
        </NuxtLink>

        <span v-if="agencyData.github" class="hidden lg:block text-muted">&bull;</span>
        <NuxtLink v-if="agencyData.github" :to="`https://github.com/${agencyData.github}`" target="_blank" class="flex items-center gap-1.5 hover:text-primary">
          <UIcon name="i-simple-icons-github" class="size-5" />
          <span class="text-sm font-medium">{{ agencyData.github }}</span>
        </NuxtLink>

        <span v-if="agencyData.linkedin" class="hidden lg:block text-muted">&bull;</span>
        <NuxtLink v-if="agencyData.linkedin" :to="`https://linkedin.com/company/${agencyData.linkedin}`" target="_blank" class="flex items-center gap-1.5 hover:text-primary">
          <UIcon name="i-simple-icons-linkedin" class="size-5" />
          <span class="text-sm font-medium">{{ agencyData.linkedin }}</span>
        </NuxtLink>

        <span v-if="agencyData.instagram" class="hidden lg:block text-muted">&bull;</span>
        <NuxtLink v-if="agencyData.instagram" :to="`https://instagram.com/${agencyData.instagram}`" target="_blank" class="flex items-center gap-1.5 hover:text-primary">
          <UIcon name="i-simple-icons-instagram" class="size-5" />
          <span class="text-sm font-medium">{{ agencyData.instagram }}</span>
        </NuxtLink>

        <span v-if="agencyData.link" class="hidden lg:block text-muted">&bull;</span>
        <NuxtLink v-if="agencyData.link" :to="agencyData.link" target="_blank" class="flex items-center gap-1.5 hover:text-primary">
          <UIcon name="i-lucide-link" class="size-5" />
          <span class="text-sm font-medium">Website</span>
        </NuxtLink>
      </div>
    </UPageHeader>

    <UPage :ui="{ right: 'my-8' }">
      <UPageBody>
        <MarkdownDocument v-if="agency" :value="agency" />
      </UPageBody>

      <template #right>
        <div>
          <UPageLinks
            v-if="agencyData.services?.length"
            title="Technical Expertise"
            :links="agencyData.services.map(service => ({ label: service }))"
          />

          <div v-if="agencyData.resources?.length">
            <USeparator type="dashed" class="my-6" />

            <UPageLinks title="Resources" :links="agencyData.resources" />
          </div>
        </div>
      </template>
    </UPage>
  </UContainer>
</template>
