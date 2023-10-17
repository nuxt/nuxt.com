<script setup lang="ts">
import type { Agency } from '~/types'

const route = useRoute()

const { data: agency } = await useAsyncData(route.path, () => queryContent<Agency>(route.path).findOne())
if (!agency.value) {
  throw createError({ statusCode: 404, statusMessage: 'Agency not found', fatal: true })
}

const links = computed(() => [{
  label: `Visit ${agency.value.title}`,
  color: 'black' as const,
  size: 'md' as const,
  icon: 'i-ph-arrow-square-out',
  trailing: true,
  to: agency.value.link,
  target: '_blank'
}])

const title = agency.value.head?.title || agency.value.title
const description = agency.value.head?.description || agency.value.description
useSeoMeta({
  titleTemplate: '%s · Nuxt Agencies',
  title,
  description,
  ogDescription: description,
  ogTitle: `${title} · Nuxt Agencies`
})

defineOgImage({
  component: 'Docs',
  title,
  description,
  headline: 'Nuxt Agencies'
})
</script>

<template>
  <UContainer>
    <UPageHeader :title="agency.title" :description="agency.description" :links="links" class="sm:py-16">
      <template #icon>
        <UColorModeAvatar :light="agency.logo.light" :dark="agency.logo.dark" size="3xl" class="mt-[2px]" :ui="{ rounded: 'rounded-sm' }" />
      </template>

      <div class="absolute top-[72px] -left-[72px] hidden lg:flex">
        <UTooltip text="Back to agencies">
          <UButton
            to="/enterprise/agencies"
            icon="i-ph-caret-left"
            color="gray"
            :ui="{ rounded: 'rounded-full' }"
            size="lg"
            class=""
          />
        </UTooltip>
      </div>

      <div class="flex flex-col lg:flex-row lg:items-center gap-3 mt-4">
        <div class="flex items-center gap-1.5">
          <UIcon name="i-ph-map-pin" class="w-5 h-5 flex-shrink-0" />
          <span class="text-sm font-medium">{{ agency.location }}</span>
        </div>

        <span v-if="agency.twitter" class="hidden lg:block text-gray-500 dark:text-gray-400">&bull;</span>

        <NuxtLink v-if="agency.twitter" :to="`https://twitter.com/${agency.twitter}`" target="_blank" class="flex items-center gap-1.5 hover:text-primary">
          <UIcon name="i-simple-icons-twitter" class="w-5 h-5" />
          <span class="text-sm font-medium">Twitter</span>
        </NuxtLink>

        <span v-if="agency.github" class="hidden lg:block text-gray-500 dark:text-gray-400">&bull;</span>

        <NuxtLink v-if="agency.github" :to="`https://github.com/${agency.github}`" target="_blank" class="flex items-center gap-1.5 hover:text-primary">
          <UIcon name="i-simple-icons-github" class="w-5 h-5" />
          <span class="text-sm font-medium">GitHub</span>
        </NuxtLink>

        <span v-if="agency.link" class="hidden lg:block text-gray-500 dark:text-gray-400">&bull;</span>

        <NuxtLink v-if="agency.link" :to="agency.link" target="_blank" class="flex items-center gap-1.5 hover:text-primary">
          <UIcon name="i-ph-link-duotone" class="w-5 h-5" />
          <span class="text-sm font-medium">Website</span>
        </NuxtLink>
      </div>
    </UPageHeader>

    <UPage :ui="{ right: 'my-8' }">
      <UPageBody prose class="prose-lg">
        <ContentRenderer v-if="agency && agency.body" :value="agency" />
      </UPageBody>

      <template #right>
        <UPageLinks v-if="agency.services?.length" title="Technical Expertise">
          <div class="prose dark:prose-invert -ml-1.5">
            <ul class="space-y-3">
              <li v-for="(service, index) in agency.services" :key="index" class="text-sm text-gray-500 dark:text-gray-400">
                {{ service }}
              </li>
            </ul>
          </div>
        </UPageLinks>

        <div v-if="agency.resources?.length">
          <UDivider type="dashed" class="my-6" />

          <UPageLinks title="Resources" :links="agency.resources" />
        </div>
      </template>
    </UPage>
  </UContainer>
</template>
