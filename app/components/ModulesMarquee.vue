<script setup lang="ts">
import { moduleImage, moduleIcon } from '~/composables/useModules'
import type { Module } from '~/types'

const props = defineProps<{
  modules: Module[]
}>()

const shuffleArray = (array: Module[]) => {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

const marqueeModulesData = useState<Module[][]>('marqueeModules', () => [])

const getRandomDelay = (rowIndex: number, index: number) => {
  const baseDelay = (rowIndex * 0.3) + (index * 0.05)
  const randomOffset = ((rowIndex * 13) + index) % 10 * 0.1
  return baseDelay + randomOffset
}

const initMarqueeModules = () => {
  if (marqueeModulesData.value.length) return

  const allModules = props.modules
  const limitedModules = shuffleArray(allModules).slice(0, 50)

  const row1 = shuffleArray(limitedModules)
  const row2 = shuffleArray(limitedModules)
  const row3 = shuffleArray(limitedModules)

  marqueeModulesData.value = [row1, row2, row3]
}

watch(() => props.modules, (newVal) => {
  if (newVal?.length && !marqueeModulesData.value.length) {
    initMarqueeModules()
  }
}, { immediate: true })
</script>

<template>
  <div class="absolute inset-0 overflow-hidden">
    <div class="flex flex-col justify-between pt-4">
      <UPageMarquee
        v-for="(row, rowIndex) in marqueeModulesData"
        :key="rowIndex"
        :reverse="rowIndex % 2 === 1"
        :overlay="false"
        :ui="{
          root: `[--gap:--spacing(4)] [--duration:400s]`
        }"
        class="mb-(--gap)"
      >
        <Motion
          v-for="(module, index) in row"
          :key="`${rowIndex}-${index}`"
          :initial="{
            scale: 0.5,
            opacity: 0,
            filter: 'blur(10px)'
          }"
          :animate="{
            scale: 1,
            opacity: 1,
            filter: 'blur(0px)'
          }"
          :transition="{
            delay: getRandomDelay(rowIndex, index)
          }"
          class="flex items-center justify-center size-16 rounded-lg bg-(--ui-bg-muted) p-2 border border-(--ui-border) dark:shadow-lg"
        >
          <UAvatar
            :src="moduleImage(module.icon)"
            :icon="moduleIcon(module.category)"
            :alt="module.name"
            size="lg"
            class="rounded-none bg-transparent"
          />
        </Motion>
      </UPageMarquee>
    </div>

    <div class="absolute left-0 top-0 bottom-0 w-1/2 z-10 bg-linear-to-bl from-(--ui-bg)/30 to-(--ui-bg) to-40%" />
    <div class="absolute right-0 top-0 bottom-0 w-1/2 z-10 bg-linear-to-br from-(--ui-bg)/30 to-(--ui-bg) to-40%" />
    <div class="absolute top-0 left-0 right-0 size-full z-10 bg-linear-to-t from-(--ui-bg) to-(--ui-bg)/15" />
  </div>
</template>
