<template>
  <div>
    <img
      v-if="!coverError && icon"
      :src="icon.match(/^http(s)?:\/\//) ? icon : 'https://api.nuxtjs.org/api/ipx/s_80,f_webp/gh/nuxt/modules/main/website/public/icons/' + icon"
      :alt="alt"
      :class="iconClass"
      @error="coverError = true"
    >
    <div v-else class="flex items-center w-12 h-12 p-2 rounded-lg u-bg-gray-100">
      <UIcon name="heroicons-outline:photograph" class="w-8 h-8 u-text-gray-400" />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps({
  icon: {
    type: String,
    default: null
  },
  alt: {
    type: String,
    default: 'module icon'
  },
  iconClass: {
    type: String,
    default: 'w-auto h-12'
  }
})

const coverError = ref(false)
</script>
