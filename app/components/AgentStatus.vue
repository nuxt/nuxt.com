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

const MIN_DISPLAY_TIME = 1000

const rawStatusMessage = computed(() => {
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

const displayedMessage = ref(rawStatusMessage.value)
const lastUpdateTime = ref(Date.now())
const pendingMessage = ref<string | null>(null)
let updateTimer: ReturnType<typeof setTimeout> | null = null

function updateDisplayedMessage(newMessage: string) {
  const now = Date.now()
  const timeSinceLastUpdate = now - lastUpdateTime.value

  if (timeSinceLastUpdate >= MIN_DISPLAY_TIME) {
    displayedMessage.value = newMessage
    lastUpdateTime.value = now
    pendingMessage.value = null

    if (updateTimer) {
      clearTimeout(updateTimer)
      updateTimer = null
    }
  } else {
    pendingMessage.value = newMessage

    if (!updateTimer) {
      const remainingTime = MIN_DISPLAY_TIME - timeSinceLastUpdate
      updateTimer = setTimeout(() => {
        if (pendingMessage.value) {
          displayedMessage.value = pendingMessage.value
          lastUpdateTime.value = Date.now()
          pendingMessage.value = null
        }
        updateTimer = null
      }, remainingTime)
    }
  }
}

watch(rawStatusMessage, (newMessage) => {
  const done = props.agents.filter(a => a.state === 'done')
  if (done.length > 0 && props.agents.every(a => a.state === 'done')) {
    displayedMessage.value = newMessage
    lastUpdateTime.value = Date.now()
    pendingMessage.value = null
    if (updateTimer) {
      clearTimeout(updateTimer)
      updateTimer = null
    }
  } else {
    updateDisplayedMessage(newMessage)
  }
}, { immediate: true })

onUnmounted(() => {
  if (updateTimer) {
    clearTimeout(updateTimer)
    updateTimer = null
  }
})

const statusMessage = computed(() => displayedMessage.value)

const agentInfo: Record<string, { label: string, icon: string }> = {
  'nuxt': { label: 'Nuxt Agent', icon: 'i-simple-icons-nuxtdotjs' },
  'nuxt-ui': { label: 'Nuxt UI Agent', icon: 'i-simple-icons-nuxtdotjs' }
}

const toolsByAgent = computed(() => {
  if (!hasToolCalls.value || currentToolsList.value.length === 0) return []

  const byAgent: Record<string, string[]> = {}
  currentToolsList.value.forEach((tool) => {
    if (!byAgent[tool.agent]) {
      byAgent[tool.agent] = []
    }
    byAgent[tool.agent].push(tool.name)
  })

  return Object.entries(byAgent).map(([agent, tools]) => ({
    agent,
    label: agentInfo[agent]?.label || agent,
    icon: agentInfo[agent]?.icon,
    tools
  }))
})

const hasTools = computed(() => toolsByAgent.value.length > 0)

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
      tools.push({ name: call.toolName, agent })
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
          <span v-else>{{ statusMessage }}</span>
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        <motion.div
          v-if="hasTools"
          class="flex flex-col gap-2 mt-2"
          :initial="{ opacity: 0, height: 0 }"
          :animate="{ opacity: 1, height: 'auto' }"
          :exit="{ opacity: 0, height: 0 }"
          :transition="{ duration: 0.2 }"
        >
          <div
            v-for="{ agent, label, icon, tools } in toolsByAgent"
            :key="agent"
            class="flex flex-col gap-1"
          >
            <div class="flex items-center gap-1 text-2xs text-dimmed">
              <UIcon v-if="icon" :name="icon" class="size-3" />
              <span class="font-medium text-[10px]">{{ label }}</span>
            </div>

            <div class="flex flex-wrap gap-1 pl-4">
              <AnimatePresence>
                <motion.span
                  v-for="(tool, toolIndex) in tools"
                  :key="`${agent}-${tool}`"
                  :initial="{ opacity: 0, scale: 0.8 }"
                  :animate="{ opacity: 1, scale: 1 }"
                  :exit="{ opacity: 0, scale: 0.8 }"
                  :transition="{
                    duration: 0.2,
                    delay: toolIndex * 0.05
                  }"
                >
                  <UBadge
                    :label="tool"
                    size="xs"
                    color="neutral"
                    variant="soft"
                  />
                </motion.span>
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  </motion.div>
</template>
