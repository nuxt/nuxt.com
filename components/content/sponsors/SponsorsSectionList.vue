<script setup lang="ts">
import type { PropType } from 'vue'
import type { Sponsor } from '../../../types/sponsors'

defineProps({
  sponsors: {
    type: Array as PropType<Array<Sponsor>>,
    default: () => {}
  },
  sponsorType: {
    type: String as PropType<'platinum' | 'silver' | 'gold' | 'sponsor' | 'backers'>,
    required: true
  }
})
</script>
<template>
  <ul :class="['platinum', 'silver', 'gold'].includes(sponsorType) ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-12' : 'flex gap-5 flex-wrap px-40'">
    <li v-for="{ sponsorEntity } in sponsors" :key="sponsorEntity.login">
      <a :href="`https://github.com/${sponsorEntity.login}`" :title="sponsorEntity.name" target="_blank" rel="noopener noreferrer">
        <UCard v-if="['platinum', 'silver', 'gold'].includes(sponsorType)" class="w-72 sm:w-56 lg:w-72" background-class="hover:u-bg-gray-50 transition-colors duration-200">
          <template #header>
            <div class="flex justify-center items-center">
              <UAvatar :rounded="sponsorType === 'silver'" :size="sponsorType === 'silver' ? 'md' : sponsorType === 'gold' ? 'lg' : 'xl'" :src="sponsorEntity.avatarUrl" />
            </div>
          </template>
          <div class="text-center truncate font-semibold text-xl sm:text-lg lg:text-xl">
            {{ sponsorEntity.name }}
          </div>
        </UCard>

        <UAvatar v-else rounded :size="sponsorType === 'backers' ? 'sm' : 'md'" :src="sponsorEntity.avatarUrl" />
      </a>
    </li>
  </ul>
</template>
