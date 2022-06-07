<template>
  <Page id="smooth" class="pt-16 -mt-16">
    <div class="flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
      <h2 class="text-3xl font-semibold u-text-gray-900">
        Top 100 Nuxters
      </h2>
      <div class="flex justify-end gap-6">
        <CommunityNuxtersFilterTime />
        <!-- <CommunityNuxtersFilterSort /> -->
      </div>
    </div>
    <div v-if="filteredNuxters.length && !pending" class="mt-12">
      <ul v-if="!q" role="list" class="grid grid-cols-6 gap-8">
        <CommunityNuxtersNuxterLarge v-if="lg && nuxter1" :nuxter="nuxter1" />
        <CommunityNuxtersNuxterMedium v-else-if="md && nuxter1" :nuxter="nuxter1" />
        <CommunityNuxtersNuxterSmall v-else-if="nuxter1" :nuxter="nuxter1" />
        <CommunityNuxtersNuxterMedium v-if="md && nuxter2" :nuxter="nuxter2" />
        <CommunityNuxtersNuxterSmall v-else-if="nuxter2" :nuxter="nuxter2" />
        <CommunityNuxtersNuxterMedium v-if="md && nuxter3" :nuxter="nuxter3" />
        <CommunityNuxtersNuxterSmall v-else-if="nuxter3" :nuxter="nuxter3" />

        <CommunityNuxtersNuxterSmall v-for="nuxter in otherNuxters" :key="nuxter.github" :nuxter="nuxter" />
      </ul>
      <ul v-else role="list" class="grid grid-cols-6 gap-8">
        <CommunityNuxtersNuxterLarge v-for="nuxter in filteredNuxters" :key="nuxter.github" :nuxter="nuxter" />
      </ul>
    </div>
    <div v-else class="flex justify-center mt-32">
      <UIcon name="heroicons-outline:refresh" class="w-8 h-8 animate-spin" />
    </div>
  </Page>
</template>

<script setup>
import { breakpointsTailwind, useBreakpoints } from '@vueuse/core'

const { greater } = useBreakpoints(breakpointsTailwind)

const { pending, fetch: fetchNuxters, nuxters, q, selectedTime } = useCommunityNuxters()

const filteredNuxters = computed(() => {
  if (!nuxters.value?.length) {
    return []
  }
  return [...nuxters.value]
    .filter((nuxter) => {
      if (q.value && !['name', 'github', 'role'].map(field => nuxter[field]).filter(Boolean).some(value => value.search(new RegExp(q.value, 'i')) !== -1)) {
        return false
      }
      return true
    })
})

const nuxter1 = computed(() => filteredNuxters.value?.length && filteredNuxters.value[0])
const nuxter2 = computed(() => filteredNuxters.value?.length >= 2 && filteredNuxters.value[1])
const nuxter3 = computed(() => filteredNuxters.value?.length >= 3 && filteredNuxters.value[2])
const otherNuxters = computed(() => filteredNuxters.value?.length && filteredNuxters.value?.slice(3))

const lg = greater('md')
const md = greater('sm')

watch(selectedTime, (value, old) => fetchNuxters({ force: value !== old }))
</script>
