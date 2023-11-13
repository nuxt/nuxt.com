<script lang="ts" setup>
import type { Integration } from '~/types'
import { withoutTrailingSlash } from 'ufo'

const route = useRoute()

const { data: integration } = await useAsyncData(route.path, () => queryContent<Integration>(route.path).findOne())
if (!integration.value) {
  throw createError({ statusCode: 404, statusMessage: 'Integration not found', fatal: true })
}

const { data: surround } = await useAsyncData(`${route.path}-surround`, () => queryContent('/integrations')
  .where({ _extension: 'md' })
  .without(['body', 'excerpt'])
  .sort({ date: -1 })
  .findSurround(withoutTrailingSlash(route.path))
)
</script>

<template>
  <UContainer :ui="{ base: 'my-20', constrained: 'max-w-4xl' }">
    <UPageHeader v-bind="integration" :ui="{ wrapper: 'mb-20', icon: { base: 'text-black dark:text-white' } }">
      <template #title>
        <div class="flex items-center space-x-4">
          <UIcon :name="integration.logo" class="w-8 h-8 text-black dark:text-white" />
          <div>{{ integration.title }}</div>
        </div>
      </template>

      <template #links>
        <UButton
          label="View on Nitro"
          icon="i-ph-lightning-duotone"
          :to="integration.to"
          variant="solid"
          color="gray"
          target="_blank"
        />
        <UButton v-for="(link, index) in integration.links" :key="index" v-bind="link" @click="link.click" />
      </template>

      <div class="absolute top-[34px] -left-[72px] hidden lg:flex">
        <UTooltip text="Back to integrations">
          <UButton
            to="/integrations"
            icon="i-ph-caret-left"
            color="gray"
            :ui="{ rounded: 'rounded-full' }"
            size="lg"
          />
        </UTooltip>
      </div>
    </UPageHeader>

    <UPageBody prose>
      <ContentRenderer v-if="integration && integration.body" :value="integration" />
    </UPageBody>

    <UDivider class="pb-12" />

    <UDocsSurround :surround="surround" />
  </UContainer>
</template>
