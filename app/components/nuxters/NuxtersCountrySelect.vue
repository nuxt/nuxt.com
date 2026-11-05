<script setup lang="ts">
import type { NuxtersCountry } from '#shared/types'
import { countryFlag, countryName } from '#shared/utils/nuxters-countries'

const props = defineProps<{
  countries: NuxtersCountry[]
}>()
const country = defineModel<string | null>({ default: null })

const { format } = new Intl.NumberFormat('en-US')
const items = computed(() => {
  // A country picked in another period keeps showing, with no Nuxters in this one.
  const countries = country.value && !props.countries.some(item => item.code === country.value)
    ? [{ code: country.value, count: 0 }, ...props.countries]
    : props.countries
  return countries.map(item => ({
    label: countryName(item.code),
    value: item.code,
    icon: countryFlag(item.code),
    count: format(item.count)
  }))
})
const selected = computed(() => items.value.find(item => item.value === country.value))
</script>

<template>
  <USelectMenu
    v-model="country"
    :items="items"
    value-key="value"
    :icon="selected?.icon ?? 'i-lucide-earth'"
    placeholder="All countries"
    aria-label="Filter by country"
    :search-input="{ placeholder: 'Search a country' }"
    :clear="{ 'aria-label': 'Show all countries' }"
    :ui="{ base: 'text-base/5 sm:text-sm/5' }"
    class="w-full sm:w-52"
  >
    <template #item-trailing="{ item }">
      <span class="text-xs text-muted tabular-nums">{{ item.count }}</span>
    </template>
    <template #empty>
      No Nuxters from there yet
    </template>
  </USelectMenu>
</template>
