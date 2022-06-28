<template>
  <Page id="smooth" class="pt-16 -mt-16">
    <PageList>
      <template #title>
        Top 100 Nuxters

        <UIcon v-if="pending" name="heroicons-outline:refresh" class="w-4 h-4 lg:w-5 lg:h-5 ml-1.5 lg:ml-3 animate-spin" />
      </template>

      <template #filters>
        <CommunityNuxtersFilterSearch size="sm" class="md:hidden" />
        <CommunityNuxtersFilterTime />
        <!-- <CommunityNuxtersFilterSort /> -->
      </template>

      <div v-if="filteredNuxters.length" class="mt-8">
        <ul v-if="!q" role="list" class="grid grid-cols-6 gap-8">
          <Component :is="nuxter1Component" v-if="nuxter1" :nuxter="nuxter1" />
          <Component :is="nuxter2Component" v-if="nuxter2" :nuxter="nuxter2" />
          <Component :is="nuxter2Component" v-if="nuxter3" :nuxter="nuxter3" />

          <CommunityNuxtersNuxterSmall v-for="nuxter in otherNuxters" :key="nuxter.github" :nuxter="nuxter" />
        </ul>
        <ul v-else role="list" class="grid grid-cols-6 gap-8">
          <CommunityNuxtersNuxterLarge v-for="nuxter in filteredNuxters" :key="nuxter.github" :nuxter="nuxter" />
        </ul>
      </div>
      <div v-else class="relative flex flex-col items-center gap-6 mt-16 lg:mt-24">
        <UIcon name="fa-brands:github" class="w-16 h-16 u-text-gray-600" />
        <span class="text-xl font-medium text-center u-text-gray-700">
          There is no Nuxters for <b>{{ q }}</b> yet.
        </span>
      </div>
    </PageList>
  </Page>
</template>

<script setup lang="ts">
import { breakpointsTailwind, useBreakpoints } from '@vueuse/core'
import { searchTextRegExp } from '~/utils'

const { smaller } = useBreakpoints(breakpointsTailwind)

const { pending, fetch: fetchNuxters, nuxters, q, selectedTime } = useCommunityNuxters()

const filteredNuxters = computed(() => {
  if (!nuxters.value?.length) {
    return []
  }
  const queryRegExp = searchTextRegExp(q.value as string)
  return [...nuxters.value]
    .filter((nuxter) => {
      if (q.value && !['name', 'github', 'role'].map(field => nuxter[field]).filter(Boolean).some(value => value.search(queryRegExp) !== -1)) {
        return false
      }
      return true
    })
})

const nuxter1 = computed(() => filteredNuxters.value?.length && filteredNuxters.value[0])
const nuxter2 = computed(() => filteredNuxters.value?.length >= 2 && filteredNuxters.value[1])
const nuxter3 = computed(() => filteredNuxters.value?.length >= 3 && filteredNuxters.value[2])
const otherNuxters = computed(() => filteredNuxters.value?.length && filteredNuxters.value.slice(3))

const lg = smaller('xl')
const md = smaller('lg')

const nuxter1Component = computed(() => {
  if (md.value) {
    return 'CommunityNuxtersNuxterSmall'
  } else if (lg.value) {
    return 'CommunityNuxtersNuxterMedium'
  } else {
    return 'CommunityNuxtersNuxterLarge'
  }
})
const nuxter2Component = computed(() => {
  if (md.value) {
    return 'CommunityNuxtersNuxterSmall'
  } else {
    return 'CommunityNuxtersNuxterMedium'
  }
})

watch(selectedTime, (value, old) => fetchNuxters({ force: value !== old }))
</script>
