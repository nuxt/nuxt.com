<script setup lang="ts">
import type { Module } from '~/types'
const route = useRoute()

const { data: module } = await useFetch<Module>(`https://api.nuxt.com/modules/${route.params.slug}`)

const links = computed(() => [{
  label: 'Documentation',
  color: 'black',
  size: 'md',
  icon: 'i-ph-book-open',
  to: module.value.website,
  target: '_blank'
}])
</script>

<template>
  <UContainer>
    <UAlert
      v-if="!module.compatibility?.nuxt?.includes('^3')"
      class="mt-4"
      icon="i-ph-warning-duotone"
      color="orange"
      variant="subtle"
      title="This module is not yet compatible with Nuxt 3"
    >
      <template #description>
        Head over to <NuxtLink to="https://v2.nuxt.com" target="_blank" class="underline">
          v2.nuxt.com
        </NuxtLink>
      </template>
    </UAlert>
    <UPageHeader :description="module.description" :links="links" class="sm:py-16">
      <template #title>
        {{ module.name }}

        <UTooltip v-if="module.type === 'official'" text="Official module" class="tracking-normal">
          <UIcon name="i-ph-medal-duotone" class="h-6 w-6 text-primary" />
        </UTooltip>
      </template>

      <template #icon>
        <UAvatar
          :src="moduleImage(module.icon)"
          :icon="moduleIcon(module.category)"
          :alt="module.name"
          size="3xl"
          :ui="{ rounded: 'rounded-lg' }"
          class="mt-[2px]"
        />
      </template>

      <div class="flex flex-col lg:flex-row lg:items-center gap-3 mt-4">
        <UTooltip text="Monthly NPM Downloads">
          <NuxtLink class="flex items-center gap-1.5" :to="`https://npmjs.org/package/${module.npm}`" target="_blank">
            <UIcon name="i-ph-arrow-circle-down-duotone" class="w-5 h-5 flex-shrink-0" />
            <span class="text-sm font-medium">{{ formatNumber(module.stats.downloads) }} downloads</span>
          </NuxtLink>
        </UTooltip>

        <span class="hidden lg:block text-gray-500 dark:text-gray-400">&bull;</span>

        <UTooltip text="GitHub Stars">
          <NuxtLink class="flex items-center gap-1.5" :to="`https://github.com/${module.repo}`" target="_blank">
            <UIcon name="i-ph-star-duotone" class="w-5 h-5 flex-shrink-0" />
            <span class="text-sm font-medium">{{ formatNumber(module.stats.stars) }} stars</span>
          </NuxtLink>
        </UTooltip>

        <div class="mx-3 h-6 border-l border-gray-200 dark:border-gray-800 w-px hidden lg:block" />

        <div v-for="(maintainer, index) in module.maintainers" :key="maintainer.github" class="flex items-center gap-3">
          <NuxtLink :to="`https://github.com/${maintainer.github}`" target="_blank" class="flex items-center gap-1.5 hover:text-primary">
            <UAvatar :src="`https://github.com/${maintainer.github}.png`" :alt="maintainer.github" size="2xs" />
            <span class="text-sm font-medium">{{ maintainer.github }}</span>
          </NuxtLink>

          <span v-if="index < module.maintainers.length - 1" class="hidden lg:block text-gray-500 dark:text-gray-400">&bull;</span>
        </div>
      </div>
    </UPageHeader>

    <UPage :ui="{ right: 'my-8' }">
      <UPageBody prose>
        <ContentRenderer v-if="module.readme?.body" :value="module.readme" />
      </UPageBody>

      <template #right>
        <p class="text-sm/6 font-semibold flex items-center gap-1.5 mb-3">
          Links
        </p>

        <div class="space-y-3">
          <NuxtLink :to="module.repo" target="_blank" class="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <UIcon name="i-simple-icons-github" class="w-5 h-5" />
            <span class="text-sm font-medium">View source</span>
          </NuxtLink>

          <NuxtLink v-if="module.npm" :to="`https://npmjs.org/package/${module.npm}`" target="_blank" class="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <UIcon name="i-simple-icons-npm" class="w-5 h-5" />
            <span class="text-sm font-medium">{{ module.npm }}</span>
          </NuxtLink>

          <NuxtLink v-if="module.learn_more" :to="module.learn_more" target="_blank" class="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <UIcon name="i-ph-link" class="w-5 h-5" />
            <span class="text-sm font-medium">Learn more</span>
          </NuxtLink>
        </div>

        <hr class="border-dashed border-gray-200 dark:border-gray-800 my-6">

        <p class="text-sm/6 font-semibold flex items-center gap-1.5 mb-3">
          Contributors <UBadge :label="module.contributors.length.toString()" color="gray" size="xs" :ui="{ rounded: 'rounded-full' }" />
        </p>

        <div class="space-y-3">
          <NuxtLink v-for="contributor in module.contributors" :key="contributor.username" :to="`https://github.com/${contributor.username}`" target="_blank" class="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <UAvatar :src="`https://github.com/${contributor.username}.png`" :alt="contributor.username" size="2xs" />
            <span class="text-sm font-medium">{{ contributor.username }}</span>
          </NuxtLink>
        </div>
      </template>
    </UPage>
  </UContainer>
</template>
