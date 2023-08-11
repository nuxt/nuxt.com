<template>
  <div>
    <img
      v-if="!coverError && icon"
      :src="icon.match(/^http(s)?:\/\//) ? icon : `https://ipx.nuxt.com/s_80,f_webp/gh/nuxt/modules/main/icons/${icon}`"
      :alt="alt"
      :class="iconClass"
      loading="lazy"
      height="48"
      width="48"
      @error="coverError = true"
    >
    <div v-else class="flex items-center w-12 h-12 p-2 rounded-lg u-bg-gray-100">
      <Icon name="uil:picture" class="w-8 h-8 u-text-gray-400" />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps({
  icon: {
    type: String,
    default: null
  },
  iconClass: {
    type: String,
    default: 'w-auto h-12'
  },
  alt: {
    type: String,
    default: 'module icon'
  }
})

const coverError = ref(false)
</script>
