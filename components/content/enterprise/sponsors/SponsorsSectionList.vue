<script setup lang="ts">
import type { PropType } from 'vue'
import type { Sponsor, SponsorType } from 'types'

defineProps({
  sponsors: {
    type: Array as PropType<Array<Sponsor>>,
    default: () => []
  },
  sponsorType: {
    type: String as PropType<SponsorType>,
    required: true
  }
})

</script>
<template>
  <ul class="w-full" :class="['platinum', 'silver', 'gold'].includes(sponsorType) ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-12' : 'flex gap-5 flex-wrap'">
    <li v-for="{ sponsorId, sponsorUrl, sponsorLogo, sponsorName } in sponsors" :key="sponsorId">
      <a :href="sponsorUrl" :title="sponsorName" target="_blank" rel="noopener noreferrer">
        <AppCard v-if="['platinum', 'silver', 'gold'].includes(sponsorType)" header-content-position="center">
          <template #header>
            <div class="flex justify-center items-center">
              <AppAvatar :rounded="sponsorType === 'silver'" :size="sponsorType === 'silver' ? 'md' : sponsorType === 'gold' ? 'lg' : 'xl'" :src="sponsorLogo" alt="">
                <span class="sr-only">Sponsors</span>
              </AppAvatar>
            </div>
          </template>
          <div class="text-center truncate font-semibold text-xl sm:text-lg lg:text-xl w-full">
            {{ sponsorName }}
          </div>
        </AppCard>

        <AppAvatar v-else rounded :size="sponsorType === 'backers' ? 'sm' : 'md'" :src="sponsorLogo" alt="">
          <span class="sr-only">Sponsors</span>
        </AppAvatar>
      </a>
    </li>
  </ul>
</template>

<style lang="ts" scoped>
css({
  '.app-card': {
    transition: 'background-color 0.2s',

    '&:hover': {
      backgroundColor: '{color.gray.50}',
    },

    '@dark': {
      '&:hover': {
        backgroundColor: '{color.gray.800}'
      }
    }
  }
})
</style>
