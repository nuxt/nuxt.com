<script setup lang="ts">
import { motion, AnimatePresence, animate } from 'motion-v'

interface AgentCall {
  type: 'nuxt' | 'nuxt-ui' | 'thinking'
  state: 'calling' | 'done'
}

interface ToolCall {
  toolName: string
  args?: any
}

interface Props {
  agents: AgentCall[]
  toolCalls?: Record<string, ToolCall[]> // { 'nuxt': [...], 'nuxt-ui': [...] }
}

const props = defineProps<Props>()

const statusMessage = computed(() => {
  if (props.agents.some(a => a.type === 'thinking')) {
    return 'Preparing...'
  }

  const calling = props.agents.filter(a => a.state === 'calling')
  const done = props.agents.filter(a => a.state === 'done')

  if (calling.length === 0 && done.length > 0) {
    return done.length === 1 ? 'Agent consulted' : 'Agents consulted'
  }

  if (calling.length === 1) {
    return calling[0].type === 'nuxt'
      ? 'Consulting Nuxt agent...'
      : 'Consulting Nuxt UI agent...'
  }

  if (calling.length > 1) {
    return `Consulting ${calling.length} Nuxt agents...`
  }

  return 'Preparing...'
})

const toolsText = computed(() => {
  if (!hasToolCalls.value || currentToolsList.value.length === 0) return ''

  const byAgent: Record<string, string[]> = {}
  currentToolsList.value.forEach((tool) => {
    if (!byAgent[tool.agent]) {
      byAgent[tool.agent] = []
    }
    byAgent[tool.agent].push(tool.name)
  })

  return Object.entries(byAgent)
    .map(([agent, tools]) => `${agent} (${tools.join(', ')})`)
    .join(', ')
})

const isProcessing = computed(() =>
  props.agents.some(a => a.state === 'calling')
)

const badgeRef = ref(null)

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

const hasToolCalls = computed(() => {
  return props.toolCalls && Object.keys(props.toolCalls).length > 0
})

const currentToolsList = computed(() => {
  if (!hasToolCalls.value) return []

  const tools: Array<{ name: string, agent: string }> = []
  for (const [agent, calls] of Object.entries(props.toolCalls || {})) {
    calls.forEach((call) => {
      tools.push({ name: call.toolName.replace(/_/g, ' '), agent })
    })
  }
  return tools
})
</script>

<template>
  <motion.div
    ref="badgeRef"
    class="flex items-start gap-1 text-xs text-muted py-1 cursor-default"
  >
    <div class="flex flex-col gap-0.5 min-w-0">
      <AnimatePresence mode="sync">
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
          <span>{{ statusMessage }}</span>
        </motion.div>
      </AnimatePresence>

      <div v-if="toolsText" class="text-dimmed text-2xs">
        using tools: {{ toolsText }}
      </div>
    </div>
  </motion.div>
</template>
