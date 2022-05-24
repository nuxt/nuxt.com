<template>
  <svg width="171" height="211" viewBox="0 0 171 211" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M170.854 73.2361C170.743 72.2675 170.529 71.3133 170.214 70.3893V69.4404C169.701 68.3563 169.017 67.3597 168.187 66.4881L104.171 3.22562C103.289 2.40549 102.281 1.72927 101.184 1.22231C100.866 1.17761 100.542 1.17761 100.224 1.22231C99.1399 0.608047 97.9429 0.213742 96.7029 0.0625H32.1538C23.6648 0.0625 15.5235 3.39507 9.52087 9.32708C3.51824 15.2591 0.145996 23.3046 0.145996 31.6938V179.306C0.145996 187.695 3.51824 195.741 9.52087 201.673C15.5235 207.605 23.6648 210.938 32.1538 210.938H138.847C147.336 210.938 155.477 207.605 161.479 201.673C167.482 195.741 170.854 187.695 170.854 179.306V73.8687C170.854 73.8687 170.854 73.8687 170.854 73.2361ZM106.839 36.0167L134.472 63.325H117.508C114.678 63.325 111.965 62.2141 109.964 60.2368C107.963 58.2595 106.839 55.5776 106.839 52.7812V36.0167ZM149.516 179.306C149.516 182.103 148.392 184.784 146.391 186.762C144.39 188.739 141.676 189.85 138.847 189.85H32.1538C29.3241 189.85 26.6104 188.739 24.6095 186.762C22.6086 184.784 21.4845 182.103 21.4845 179.306V31.6938C21.4845 28.8974 22.6086 26.2155 24.6095 24.2382C26.6104 22.2609 29.3241 21.15 32.1538 21.15H85.5002V52.7812C85.5002 61.1704 88.8724 69.2159 94.875 75.1479C100.878 81.0799 109.019 84.4125 117.508 84.4125H149.516V179.306Z" fill="#00DC82" />
    <line
      ref="line1"
      x1="53"
      y1="73"
      x2="64"
      y2="73"
      stroke="#00DC82"
      stroke-width="22"
      stroke-linecap="round"
      stroke-dasharray="100"
    />
    <line
      ref="line2"
      x1="53"
      y1="116"
      x2="116"
      y2="116"
      stroke="#00DC82"
      stroke-width="22"
      stroke-linecap="round"
      stroke-dasharray="100"
    />
    <line
      ref="line3"
      x1="53"
      y1="158"
      x2="116"
      y2="158"
      stroke="#00DC82"
      stroke-width="22"
      stroke-linecap="round"
      stroke-dasharray="100"
    />
  </svg>
</template>

<script setup lang="ts">
import { useMotion } from '@vueuse/motion'

const line1 = ref(null)
const line2 = ref(null)
const line3 = ref(null)
const linesInstance = ref([line1, line2, line3])
const linesMotion = []

onMounted(() => {
  linesInstance.value.forEach((line, index) => {
    linesMotion.push(
      useMotion(line, {
        initial: {
          strokeDashoffset: 100,
          opacity: 0
        },
        in: {
          strokeDashoffset: 0,
          opacity: 100,
          transition: {
            duration: 1000,
            delay: 1000 * index
          }
        }
      })
    )
  })

  setInterval(() => {
    linesMotion.forEach((line) => {
      line.apply('in')

      setTimeout(() => {
        line.apply('initial')
      }, 4000)
    })
  }, 4500)
})
</script>
