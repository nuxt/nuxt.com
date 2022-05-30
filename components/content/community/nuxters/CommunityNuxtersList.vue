<template>
  <Page id="smooth" class="pt-16 -mt-16">
    <div class="flex md:items-center md:justify-between">
      <h2 class="text-3xl font-semibold u-text-gray-900">
        Top 100 Nuxters
      </h2>
      <div class="flex gap-6">
        <CommunityNuxtersFilterTime />
        <CommunityNuxtersFilterSort />
      </div>
    </div>
    <div v-if="nuxters.length" class="mt-12">
      <ul role="list" class="grid grid-cols-6 gap-8">
        <CommunityNuxtersNuxterLarge :nuxter="nuxter1" />
        <CommunityNuxtersNuxterMedium :nuxter="nuxter2" />
        <CommunityNuxtersNuxterMedium :nuxter="nuxter3" />

        <CommunityNuxtersNuxterSmall v-for="nuxter in otherNuxters" :key="nuxter.github" :nuxter="nuxter" />
      </ul>
    </div>
  </Page>
</template>

<script setup>
const { nuxters } = useCommunityNuxters()

const nuxter1 = computed(() => nuxters.value?.length && nuxters.value[0])
const nuxter2 = computed(() => nuxters.value?.length >= 2 && nuxters.value[1])
const nuxter3 = computed(() => nuxters.value?.length >= 3 && nuxters.value[2])
const otherNuxters = computed(() => nuxters.value?.length && nuxters.value?.slice(3))
</script>
