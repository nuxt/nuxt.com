<template>
  <svg width="241" height="241" viewBox="0 0 241 241" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path ref="block1" d="M205.938 95C214.256 95 221 101.744 221 110.063V135.938C221 144.256 214.256 151 205.938 151L30.0625 151C21.7437 151 15 144.256 15 135.938L15 110.063C15 101.744 21.7437 95 30.0625 95L205.938 95Z" fill="#00DC82" />
    <path ref="block2" d="M176 25C181.523 25 186 29.4772 186 35V55C186 60.5228 181.523 65 176 65L61 65C55.4771 65 51 60.5228 51 55L51 35C51 29.4772 55.4772 25 61 25L176 25Z" fill="#00DC82" />
    <path ref="block3" d="M175.958 181C181.504 181 186 185.496 186 191.042V210.958C186 216.504 181.504 221 175.958 221L60.0417 221C54.4958 221 50 216.504 50 210.958L50 191.042C50 185.496 54.4958 181 60.0417 181L175.958 181Z" fill="#00DC82" />
  </svg>
</template>

<script setup lang="ts">
import { useMotion } from '@vueuse/motion'

const block1 = ref(null)
const block2 = ref(null)
const block3 = ref(null)
const blocks = ref([block1, block2, block3])

const blockMotion = []

onMounted(() => {
  blocks.value.forEach((block, index) => {
    blockMotion.push(
      useMotion(block, {
        initial: {
          translateY: 0
        },
        enter: {
          translateY: index * 40
        }
      })
    )
  })

  blockMotion.forEach((block) => {
    block.apply('enter')
  })
})

</script>
