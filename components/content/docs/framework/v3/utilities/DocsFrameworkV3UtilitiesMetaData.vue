<template>
  <svg width="231" height="231" viewBox="0 0 231 231" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path ref="search" fill-rule="evenodd" clip-rule="evenodd" d="M49.3071 16.6717C31.2831 16.6717 16.6717 31.2831 16.6717 49.3071C16.6717 67.3312 31.2831 81.9426 49.3071 81.9426C67.3312 81.9426 81.9426 67.3312 81.9426 49.3071C81.9426 31.2831 67.3312 16.6717 49.3071 16.6717ZM0.354004 49.3071C0.354004 22.2711 22.2711 0.354004 49.3071 0.354004C76.3432 0.354004 98.2603 22.2711 98.2603 49.3071C98.2603 59.8796 94.9087 69.6693 89.21 77.6717L128.506 116.968C131.692 120.154 131.692 125.32 128.506 128.506C125.32 131.692 120.154 131.692 116.968 128.506L77.6717 89.21C69.6693 94.9087 59.8796 98.2603 49.3071 98.2603C22.2711 98.2603 0.354004 76.3432 0.354004 49.3071Z" fill="#00DC82" />
  </svg>
</template>

<script setup lang="ts">
import { useMotion } from '@vueuse/motion'

const search = ref(null)

const searchMotion = useMotion(search, {
  initial: {
    translateX: 0,
    translateY: 0,
    transition: {
      duration: 1000,
      onComplete: () => {
        searchMotion.apply('top')
      }
    }
  },
  top: {
    translateX: 100,
    translateY: 100,
    transition: {
      duration: 1000,
      onComplete: () => {
        searchMotion.apply('right')
      }
    }
  },
  right: {
    translateX: 125,
    translateY: 0,
    transition: {
      duration: 1000,
      onComplete: () => {
        searchMotion.apply('initial')
      }
    }
  }
})

searchMotion.apply('initial')
</script>
