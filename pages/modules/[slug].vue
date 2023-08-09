<script setup lang="ts">
const route = useRoute()
const { fetchOne, module } = useModules()
const { copy } = useCopyToClipboard()

await fetchOne(route.params.slug as string)

const links = computed(() => [{
  label: 'Documentation',
  color: 'black',
  size: 'md',
  icon: 'i-ph-book-open',
  to: module.value.website,
  target: '_blank'
}, {
  label: `yarn add ${module.value.npm}`,
  color: 'white',
  size: 'md',
  trailingIcon: 'i-ph-copy',
  click: () => copy(`yarn add ${module.value.npm}`, { title: 'Copied to clipboard' })
}])
</script>

<template>
  <UContainer>
    <UPageHeader :description="module.description" :links="links">
      <template #title>
        {{ module.name }}

        <UTooltip v-if="module.type === 'official'" text="Official module" class="tracking-normal">
          <UIcon name="i-ph-medal-duotone" class="h-6 w-6 text-primary" />
        </UTooltip>
      </template>

      <template #icon>
        <UAvatar :src="module.icon.match(/^http(s)?:\/\//) ? module.icon : `https://api.nuxtjs.org/api/ipx/s_80,f_webp/gh/nuxt/modules/main/icons/${module.icon}`" :alt="module.name" size="3xl" :ui="{ rounded: 'rounded-lg' }" />
      </template>

      <div class="flex items-center gap-3 mt-4">
        <UTooltip text="Monthly NPM Downloads">
          <div class="flex items-center gap-1">
            <UIcon name="i-ph-arrow-circle-down-duotone" class="w-6 h-6 flex-shrink-0" />
            <span class="font-medium">{{ formatNumber(module.stats.downloads) }} downloads</span>
          </div>
        </UTooltip>

        &bull;

        <UTooltip text="GitHub Stars">
          <div class="flex items-center gap-1">
            <UIcon name="i-ph-star-duotone" class="w-6 h-6 flex-shrink-0" />
            <span class="font-medium">{{ formatNumber(module.stats.stars) }} stars</span>
          </div>
        </UTooltip>

        <div class="mx-3 h-6 border-l w-px" />

        <UButton
          v-for="maintainer in module.maintainers"
          :key="maintainer.github"
          color="gray"
          :label="maintainer.github"
          :to="`https://github.com/${maintainer.github}`"
          target="_blank"
          class="-my-1.5 -mx-1.5"
        >
          <template #leading>
            <UAvatar :src="`https://github.com/${maintainer.github}.png`" :alt="maintainer.github" size="2xs" />
          </template>
        </UButton>
      </div>
    </UPageHeader>

    <UPage>
      <UPageBody prose>
        <ContentRenderer v-if="module.readme?.body" :value="module.readme" />
      </UPageBody>

      <template #right>
        <UAside>
          <p class="font-semibold flex items-center gap-1.5 mb-3">
            Contributors <UBadge :label="module.contributors.length.toString()" color="gray" size="sm" />
          </p>

          <div class="space-y-2">
            <NuxtLink v-for="contributor in module.contributors" :key="contributor.username" :to="`https://github.com/${contributor.username}`" target="_blank" class="flex items-center gap-2.5 text-muted hover:text-subdued">
              <UAvatar :src="`https://github.com/${contributor.username}.png`" :alt="contributor.username" size="2xs" />
              <span class="text-sm font-medium">{{ contributor.username }}</span>
            </NuxtLink>
          </div>
        </UAside>
      </template>
    </UPage>
  </UContainer>
</template>
