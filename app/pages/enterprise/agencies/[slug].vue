<script setup lang="ts">
definePageMeta({
  heroBackground: 'opacity-30 -z-10'
})

const route = useRoute()

const { data: agency } = await useAsyncData(route.path, () => queryCollection('agencies').path(route.path).first())
if (!agency.value) {
  throw createError({ statusCode: 404, statusMessage: 'Agency not found', fatal: true })
}

const links = computed(() => [{
  label: `Visit ${agency.value.title}`,
  color: 'neutral' as const,
  size: 'md' as const,
  variant: 'solid' as const,
  icon: 'i-lucide-square-arrow-out-up-right',
  trailing: true,
  to: agency.value.link,
  target: '_blank'
}])

const title = agency.value.title
const description = agency.value.description
useSeoMeta({
  titleTemplate: '%s · Nuxt Agencies',
  title,
  description,
  ogDescription: description,
  ogTitle: `${title} · Nuxt Agencies`
})

defineOgImageComponent('Docs', {
  headline: 'Nuxt Agencies',
  title,
  description
})
</script>

<template>
  <UContainer>
    <UPageHeader :description="agency.description" :links="links" :ui="{ headline: 'mb-8' }">
      <template #headline>
        <UBreadcrumb :items="[{ label: 'Agencies', to: '/enterprise/agencies' }, { label: agency.title }]" />
      </template>

      <template #title>
        <div class="flex items-center gap-4">
          <UColorModeAvatar :light="agency.logo.light" :dark="agency.logo.dark" size="lg" class="-m-[4px] rounded-none bg-transparent" />

          <span>{{ agency.title }}</span>
        </div>
      </template>

      <div class="flex flex-col lg:flex-row lg:items-center gap-3 mt-4">
        <div class="flex items-center gap-1.5">
          <UIcon name="i-lucide-map-pin" class="size-5 shrink-0" />
          <span class="text-sm font-medium">{{ agency.location }}</span>
        </div>

        <span v-if="agency.x" class="hidden lg:block text-(--ui-text-muted)">&bull;</span>
        <NuxtLink v-if="agency.x" :to="`https://x.com/${agency.x}`" target="_blank" class="flex items-center gap-1.5 hover:text-(--ui-primary)">
          <UIcon name="i-simple-icons-x" class="size-5" />
          <span class="text-sm font-medium">{{ agency.x }}</span>
        </NuxtLink>

        <span v-if="agency.github" class="hidden lg:block text-(--ui-text-muted)">&bull;</span>
        <NuxtLink v-if="agency.github" :to="`https://github.com/${agency.github}`" target="_blank" class="flex items-center gap-1.5 hover:text-(--ui-primary)">
          <UIcon name="i-simple-icons-github" class="size-5" />
          <span class="text-sm font-medium">{{ agency.github }}</span>
        </NuxtLink>

        <span v-if="agency.linkedin" class="hidden lg:block text-(--ui-text-muted)">&bull;</span>
        <NuxtLink v-if="agency.linkedin" :to="`https://linkedin.com/company/${agency.linkedin}`" target="_blank" class="flex items-center gap-1.5 hover:text-(--ui-primary)">
          <UIcon name="i-simple-icons-linkedin" class="size-5" />
          <span class="text-sm font-medium">{{ agency.linkedin }}</span>
        </NuxtLink>

        <span v-if="agency.instagram" class="hidden lg:block text-(--ui-text-muted)">&bull;</span>
        <NuxtLink v-if="agency.instagram" :to="`https://instagram.com/${agency.instagram}`" target="_blank" class="flex items-center gap-1.5 hover:text-(--ui-primary)">
          <UIcon name="i-simple-icons-instagram" class="size-5" />
          <span class="text-sm font-medium">{{ agency.instagram }}</span>
        </NuxtLink>

        <span v-if="agency.link" class="hidden lg:block text-(--ui-text-muted)">&bull;</span>
        <NuxtLink v-if="agency.link" :to="agency.link" target="_blank" class="flex items-center gap-1.5 hover:text-(--ui-primary)">
          <UIcon name="i-lucide-link" class="size-5" />
          <span class="text-sm font-medium">Website</span>
        </NuxtLink>
      </div>
    </UPageHeader>

    <UPage :ui="{ right: 'my-8' }">
      <UPageBody>
        <ContentRenderer v-if="agency && agency.body" :value="agency" />
      </UPageBody>

      <template #right>
        <div>
          <UPageLinks
            v-if="agency.services?.length"
            title="Technical Expertise"
            :links="agency.services.map(service => ({ label: service }))"
          />

          <div v-if="agency.resources?.length">
            <USeparator type="dashed" class="my-6" />

            <UPageLinks title="Resources" :links="agency.resources" />
          </div>
        </div>
      </template>
    </UPage>
  </UContainer>
</template>
