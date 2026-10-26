<script setup lang="ts">
type GridSponsor = Pick<Sponsor, 'sponsorName' | 'sponsorLogo' | 'sponsorUrl' | 'sponsorDescription' | 'since'>

const props = withDefaults(defineProps<{
  sponsors: GridSponsor[]
  /** Most sponsors per row; a short last row stretches instead of leaving empty cells. */
  columns?: number
  featured?: boolean
}>(), {
  columns: 3,
  featured: false
})

const rows = computed(() => {
  const count = Math.ceil(props.sponsors.length / props.columns)
  const perRow = Math.ceil(props.sponsors.length / count)
  return Array.from({ length: count }, (_, row) => props.sponsors.slice(row * perRow, (row + 1) * perRow))
})

const sinceFormat = new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' })
</script>

<template>
  <div class="divide-y divide-default">
    <div v-for="(row, rowIndex) in rows" :key="rowIndex" class="flex divide-x divide-default">
      <NuxtLink
        v-for="sponsor in row"
        :key="sponsor.sponsorUrl"
        :to="sponsor.sponsorUrl"
        target="_blank"
        class="flex-1 basis-0 min-w-0 flex items-center justify-center hover:bg-muted/50 transition-colors"
        :class="featured ? 'flex-col gap-3 px-6 py-10 text-center' : 'gap-2 px-4 h-[110px]'"
      >
        <div class="flex items-center min-w-0" :class="featured ? 'gap-3' : 'gap-2'">
          <NuxtImg
            :src="sponsor.sponsorLogo"
            :alt="`${sponsor.sponsorName} logo`"
            loading="lazy"
            class="object-contain rounded-lg shrink-0"
            :class="featured ? 'h-14 max-w-[200px]' : 'h-10 max-w-[140px]'"
            :height="featured ? 56 : 40"
            :width="featured ? 56 : 40"
          />
          <span class="font-semibold truncate" :class="featured ? 'text-2xl text-highlighted' : 'text-base hidden sm:block'">{{ sponsor.sponsorName }}</span>
        </div>
        <template v-if="featured">
          <p v-if="sponsor.sponsorDescription" class="hidden sm:block text-sm text-muted line-clamp-2 max-w-md">
            {{ sponsor.sponsorDescription }}
          </p>
          <p v-if="sponsor.since" class="text-xs text-dimmed">
            Sponsor since {{ sinceFormat.format(new Date(sponsor.since)) }}
          </p>
        </template>
      </NuxtLink>
    </div>
  </div>
</template>
