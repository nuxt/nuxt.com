<script lang="ts" setup>
import type { ContentListFile, SourceData } from 'comark-content'

const props = defineProps<{
  template: ContentListFile<SourceData<'local'>>
  index: number
}>()

const { track } = useAnalytics()

function trackTemplateAction(action: 'Demo' | 'GitHub' | 'Purchase') {
  track('Template Action', { template: props.template.data.name, action })
}
</script>

<template>
  <UPageCard
    :description="template.data.description"
    :ui="{
      container: 'p-0 sm:p-0',
      body: 'p-4 h-[105px]',
      header: 'relative mb-0 aspect-video',
      title: 'flex items-center w-full',
      description: 'line-clamp-2',
      footer: 'mt-0 px-4 pb-4 w-full'
    }"
    class="overflow-hidden"
  >
    <template #header>
      <NuxtImg
        :src="`/assets/templates/${template.data.slug}.webp`"
        class="object-cover object-top size-full"
        :alt="template.data.name"
        width="640"
        height="360"
        sizes="674px sm:524px lg:426px xl:600px"
        format="webp"
        :modifiers="{ position: 'top' }"
        :loading="index > 3 ? 'lazy' : undefined"
      />
    </template>
    <template #title>
      <div class="w-full grid grid-cols-[1fr_auto] items-center gap-2">
        <p class="truncate m-0">
          {{ template.data.name }}
        </p>
        <div class="flex shrink-0 gap-1">
          <UBadge
            v-if="template.data.badge === 'Premium'"
            :label="template.data.badge"
            color="info"
            variant="subtle"
            size="sm"
            class="rounded-full"
          />
          <UBadge
            v-else-if="template.data.badge === 'Freemium'"
            :label="template.data.badge"
            color="success"
            variant="subtle"
            size="sm"
            class="rounded-full"
          />
        </div>
      </div>
    </template>
    <template #footer>
      <UFieldGroup class="w-full">
        <UButton
          label="Demo"
          icon="i-lucide-laptop"
          :to="template.data.demo"
          target="_blank"
          size="sm"
          color="neutral"
          variant="subtle"
          class="w-1/2 justify-center"
          @click="trackTemplateAction('Demo')"
        />
        <UButton
          v-if="template.data.repo"
          label="GitHub"
          icon="i-simple-icons-github"
          :to="`https://github.com/${template.data.repo}`"
          target="_blank"
          size="sm"
          color="neutral"
          variant="subtle"
          class="w-1/2 justify-center"
          @click="trackTemplateAction('GitHub')"
        />
        <UButton
          v-else-if="template.data.purchase"
          target="_blank"
          :to="template.data.purchase"
          color="neutral"
          label="Purchase"
          variant="subtle"
          icon="i-lucide-credit-card"
          size="sm"
          class="w-1/2 justify-center"
          @click="trackTemplateAction('Purchase')"
        />
      </UFieldGroup>
    </template>
  </UPageCard>
</template>
