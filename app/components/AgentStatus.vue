<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue'
import { motion, AnimatePresence, useTime, useTransform, animate } from 'motion-v'

interface AgentCall {
  type: 'nuxt' | 'nuxt-ui' | 'thinking'
  state: 'calling' | 'done'
}

interface Props {
  agents: AgentCall[]
}

const props = defineProps<Props>()

const SPRING_CONFIG = {
  type: 'spring' as const,
  stiffness: 600,
  damping: 30
}

const statusMessage = computed(() => {
  if (props.agents.some(a => a.type === 'thinking')) {
    return 'Preparing...'
  }

  const calling = props.agents.filter(a => a.state === 'calling')
  const done = props.agents.filter(a => a.state === 'done')

  if (calling.length === 0 && done.length > 0) {
    return done.length === 1
      ? 'Agent consulted'
      : 'Agents consulted'
  }

  if (calling.length === 1) {
    return calling[0].type === 'nuxt'
      ? 'Consulting Nuxt agent...'
      : 'Consulting Nuxt UI agent...'
  }

  if (calling.length > 1) {
    return 'Consulting Nuxt agents...'
  }

  return 'Preparing...'
})

const tooltipText = computed(() => {
  const agentNames = props.agents.map(a =>
    a.type === 'nuxt' ? 'Nuxt Agent' : 'Nuxt UI Agent'
  )
  return agentNames.join(', ')
})

const isProcessing = computed(() =>
  props.agents.some(a => a.state === 'calling')
)

const badgeRef = ref(null)
const measureRef = ref<HTMLDivElement | null>(null)
const labelWidth = ref('auto')

const time = useTime()
const rotate = useTransform(time, [0, 1000], [0, 360], { clamp: false })

function updateWidth() {
  if (measureRef.value) {
    const { width } = measureRef.value.getBoundingClientRect()
    labelWidth.value = `${width}px`
  }
}

watch(() => statusMessage.value, () => {
  updateWidth()
}, { flush: 'post' })

onMounted(() => {
  updateWidth()
})

watch(() => isProcessing.value, (newVal) => {
  if (!badgeRef.value) return

  if (!newVal) {
    animate(badgeRef.value, {
      scale: [1, 1.05, 1]
    }, {
      duration: 0.3,
      ease: 'easeInOut',
      times: [0, 0.5, 1]
    })
  }
})
</script>

<template>
  <motion.div
    ref="badgeRef"
    class="flex items-center gap-1 text-xs text-muted py-1 cursor-default"
  >
    <motion.span
      class="relative flex items-center justify-center size-4 shrink-0"
      :animate="{ opacity: 1 }"
      :transition="SPRING_CONFIG"
    >
      <AnimatePresence>
        <motion.span
          :key="isProcessing ? 'processing' : 'done'"
          class="absolute left-0 top-0"
          :initial="{
            scale: 0.5,
            opacity: 0
          }"
          :animate="{
            scale: 1,
            opacity: 1
          }"
          :exit="{
            scale: 0.5,
            opacity: 0
          }"
          :transition="{
            duration: 0.2,
            ease: 'easeInOut'
          }"
        >
          <motion.div
            v-if="isProcessing"
            :style="{ rotate }"
            class="flex items-center justify-center size-4"
          >
            <UIcon name="i-lucide-loader-circle" class="size-4" />
          </motion.div>

          <UIcon
            v-else
            name="i-lucide-check"
            class="size-4 text-success"
          />
        </motion.span>
      </AnimatePresence>
    </motion.span>

    <div ref="measureRef" class="absolute invisible whitespace-nowrap">
      {{ statusMessage }}
    </div>

    <motion.span
      class="relative overflow-hidden"
      :animate="{ width: labelWidth }"
      :transition="SPRING_CONFIG"
    >
      <AnimatePresence mode="sync" :initial="false">
        <motion.div
          :key="statusMessage"
          class="whitespace-nowrap"
          :initial="{
            y: -10,
            opacity: 0,
            filter: 'blur(6px)',
            position: 'absolute'
          }"
          :animate="{
            y: 0,
            opacity: 1,
            filter: 'blur(0px)',
            position: 'relative'
          }"
          :exit="{
            y: 10,
            opacity: 0,
            filter: 'blur(6px)',
            position: 'absolute'
          }"
          :transition="{
            duration: 0.2,
            ease: 'easeInOut'
          }"
        >
          <TextShimmer
            v-if="isProcessing"
            :text="statusMessage"
            :duration="1.5"
          />
          <UTooltip v-else :text="tooltipText" arrow :content="{ side: 'top' }">
            <span>
              {{ statusMessage }}
            </span>
          </UTooltip>
        </motion.div>
      </AnimatePresence>
    </motion.span>
  </motion.div>
</template>
