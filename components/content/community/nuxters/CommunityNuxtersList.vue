<template>
  <Page id="smooth" class="pt-16 -mt-16">
    <div class="flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
      <h2 class="text-3xl font-semibold u-text-gray-900">
        Top 100 Nuxters
      </h2>
      <div class="flex justify-end gap-6">
        <CommunityNuxtersFilterTime />
        <CommunityNuxtersFilterSort />
      </div>
    </div>
    <div v-if="filteredNuxters.length" class="mt-12">
      <ul v-if="!q" role="list" class="grid grid-cols-6 gap-8">
        <CommunityNuxtersNuxterLarge v-if="nuxter1" :nuxter="nuxter1" />
        <CommunityNuxtersNuxterMedium v-if="nuxter2" :nuxter="nuxter2" />
        <CommunityNuxtersNuxterMedium v-if="nuxter3" :nuxter="nuxter3" />

        <CommunityNuxtersNuxterSmall v-for="nuxter in otherNuxters" :key="nuxter.github" :nuxter="nuxter" />
      </ul>
      <ul v-else role="list" class="grid grid-cols-6 gap-8">
        <CommunityNuxtersNuxterLarge v-for="nuxter in filteredNuxters" :key="nuxter.github" :nuxter="nuxter" />
      </ul>
    </div>
  </Page>
</template>

<script setup>
const { nuxters, q } = useCommunityNuxters()

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
</script>
