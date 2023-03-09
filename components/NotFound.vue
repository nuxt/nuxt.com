<script setup lang="ts">
import type { PropType } from 'vue'
import type { Button } from 'types'

defineProps({
  text: {
    type: String,
    default: ''
  },
  icon: {
    type: String,
    default: ''
  },
  buttons: {
    type: Array as PropType<Button[]>,
    default: () => []
  },
  resetFilter: {
    type: Boolean,
    default: false
  }
})

const router = useRouter()

const resetQuery = () => {
  router.replace({ query: {} })
}
</script>

<template>
  <div class="relative flex flex-col items-center gap-6 mt-16 lg:mt-24">
    <Icon :name="icon" class="w-16 h-16 u-text-gray-600" />
    <div class="text-xl font-medium text-center u-text-gray-700">
      <slot />
    </div>

    <div class="flex flex-col sm:flex-row items-center justify-center gap-3">
      <AppButton
        v-for="button of buttons"
        :key="button.label"
        :variant="button.variant || 'transparent'"
        :icon="button.icon || undefined"
        :label="button.label || ''"
        :to="button.to || undefined"
        :trailing="button.trailing"
        :size="'lg' || button.size"
        class="focus-visible:ring-2"
        :download="false"
        :target="button.target || '_self'"
        truncate
        @click="resetFilter ? resetQuery() : () => {}"
      />
    </div>
  </div>
</template>
