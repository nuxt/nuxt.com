<script setup lang="ts">
import type { NuxtersPage, NuxterSummary } from '#shared/types'

const props = defineProps<{
  initial: NuxtersPage
}>()

const PAGE_SIZE = 100

const more = ref<NuxterSummary[]>([])
const loading = ref(false)
const items = computed(() => [...props.initial.items, ...more.value])
const total = computed(() => props.initial.total)

// Another period: start again from its first page.
watch(() => props.initial, () => {
  more.value = []
})

async function showMore() {
  loading.value = true
  try {
    const page = await $fetch<NuxtersPage>('/api/nuxters', { query: { period: props.initial.period, offset: items.value.length, limit: PAGE_SIZE } })
    more.value.push(...page.items)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div>
    <ul class="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-3 sm:gap-4">
      <li v-for="nuxter in items" :key="nuxter.githubId" class="relative">
        <UTooltip :text="nuxter.username">
          <NuxtLink :to="`/nuxters/${nuxter.username}`" class="block aspect-square rounded-lg overflow-hidden bg-muted ring ring-default hover:ring-primary transition">
            <NuxtImg
              :src="`/gh_avatar/${nuxter.username}`"
              provider="ipx"
              densities="x1 x2"
              width="80"
              height="80"
              format="auto"
              loading="lazy"
              :alt="nuxter.username"
              class="size-full"
            />
          </NuxtLink>
        </UTooltip>
        <span class="absolute -bottom-1.5 right-1 px-1 rounded bg-default ring ring-default text-xs font-medium tabular-nums">
          {{ nuxter.rank }}
        </span>
      </li>
    </ul>

    <div v-if="items.length < total" class="flex justify-center mt-10">
      <UButton
        label="Show more"
        icon="i-lucide-plus"
        color="neutral"
        variant="outline"
        :loading="loading"
        @click="showMore"
      />
    </div>
  </div>
</template>
