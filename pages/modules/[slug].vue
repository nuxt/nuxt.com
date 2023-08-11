<script setup lang="ts">
const route = useRoute()
const { fetchOne, module } = useModules()

await fetchOne(route.params.slug as string)

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
    <UPageHeader :description="module.description" :links="links" class="sm:py-16">
      <template #title>
        {{ module.name }}

        <UTooltip v-if="module.type === 'official'" text="Official module" class="tracking-normal">
          <UIcon name="i-ph-medal-duotone" class="h-6 w-6 text-primary" />
        </UTooltip>
      </template>

      <template #icon>
        <UAvatar :src="module.icon.match(/^http(s)?:\/\//) ? module.icon : `https://ipx.nuxt.com/s_80,f_webp/gh/nuxt/modules/main/icons/${module.icon}`" :alt="module.name" size="3xl" :ui="{ rounded: 'rounded-lg' }" class="mt-[2px]" />
      </template>

      <div class="flex flex-col lg:flex-row lg:items-center gap-3 mt-4">
        <UTooltip text="Monthly NPM Downloads">
          <div class="flex items-center gap-1.5">
            <UIcon name="i-ph-arrow-circle-down-duotone" class="w-6 h-6 flex-shrink-0" />
            <span class="font-medium">{{ formatNumber(module.stats.downloads) }} downloads</span>
          </div>
        </UTooltip>

        <span class="hidden lg:block text-gray-500 dark:text-gray-400">&bull;</span>

        <UTooltip text="GitHub Stars">
          <div class="flex items-center gap-1.5">
            <UIcon name="i-ph-star-duotone" class="w-6 h-6 flex-shrink-0" />
            <span class="font-medium">{{ formatNumber(module.stats.stars) }} stars</span>
          </div>
        </UTooltip>

        <div class="mx-3 h-6 border-l border-gray-200 dark:border-gray-800 w-px hidden lg:block" />

        <div v-for="(maintainer, index) in module.maintainers" :key="maintainer.github" class="flex items-center gap-3">
          <NuxtLink :to="`https://github.com/${maintainer.github}`" target="_blank" class="flex items-center gap-1.5 hover:text-primary">
            <UAvatar :src="`https://github.com/${maintainer.github}.png`" :alt="maintainer.github" size="xs" />
            <span class="font-medium">{{ maintainer.github }}</span>
          </NuxtLink>

          <span v-if="index < module.maintainers.length - 1" class="hidden lg:block text-gray-500 dark:text-gray-400">&bull;</span>
        </div>
      </div>
    </UPageHeader>

    <UPage :ui="{ right: 'mt-8' }">
      <UPageBody prose>
        <ContentRenderer v-if="module.readme?.body" :value="module.readme" />
      </UPageBody>

      <template #right>
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

        <p class="font-semibold flex items-center gap-1.5 mb-3">
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
