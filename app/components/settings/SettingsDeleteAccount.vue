<script setup lang="ts">
import { AnimatePresence, motion } from 'motion-v'

const props = defineProps<{
  chats: number
  messages: number
}>()

const open = defineModel<boolean>('open', { default: false })

type Step = 'review' | 'confirm' | 'deleting' | 'done'

const HOLD_DURATION = 1500
const ease = [0.22, 1, 0.36, 1] as const

const { user, fetch: refreshSession } = useUserSession()
const toast = useToast()

const step = ref<Step>('review')
const confirmation = ref('')
const progress = ref(0)
const holding = ref(false)
const input = useTemplateRef<{ inputRef: HTMLInputElement | null }>('input')

const username = computed(() => user.value?.username ?? '')
const busy = computed(() => step.value === 'deleting' || step.value === 'done')
const confirmed = computed(() => !!username.value && confirmation.value.trim().toLowerCase() === username.value.toLowerCase())

const losses = computed(() => [
  { icon: 'i-lucide-user-round', label: 'Profile and preferences', value: undefined },
  { icon: 'i-lucide-message-circle', label: 'Chats with Nuxi', value: props.chats },
  { icon: 'i-lucide-messages-square', label: 'Messages', value: props.messages }
])

// The modal eases to each step's height instead of jumping
const content = useTemplateRef<HTMLElement>('content')
const { height } = useElementSize(content)

watch(open, (value) => {
  if (!value || busy.value) return
  step.value = 'review'
  confirmation.value = ''
  holding.value = false
  progress.value = 0
})

// The confirm step mounts after the previous step's exit animation: focus its input once it exists
watch(() => input.value?.inputRef, el => el?.focus())

// Press and hold: fills while held, drains three times faster when released early
let frame: number | undefined
let last = 0

function tick(now: number) {
  const delta = now - last
  last = now
  progress.value = holding.value
    ? Math.min(1, progress.value + delta / HOLD_DURATION)
    : Math.max(0, progress.value - (delta / HOLD_DURATION) * 3)

  if (holding.value && progress.value >= 1) {
    frame = undefined
    holding.value = false
    deleteAccount()
    return
  }
  frame = progress.value > 0 || holding.value ? requestAnimationFrame(tick) : undefined
}

function startHold() {
  if (!confirmed.value || busy.value) return
  holding.value = true
  if (frame === undefined) {
    last = performance.now()
    frame = requestAnimationFrame(tick)
  }
}

function stopHold() {
  holding.value = false
}

function onHoldKeydown(event: KeyboardEvent) {
  if (event.repeat || (event.key !== ' ' && event.key !== 'Enter')) return
  event.preventDefault()
  startHold()
}

let redirect: ReturnType<typeof setTimeout> | undefined

onBeforeUnmount(() => {
  if (frame !== undefined) cancelAnimationFrame(frame)
  if (redirect) clearTimeout(redirect)
})

async function deleteAccount() {
  step.value = 'deleting'

  try {
    await Promise.all([
      $fetch('/api/account', { method: 'DELETE', body: { username: confirmation.value.trim() } }),
      // Long enough to read the state, even when the request is instant
      new Promise(resolve => setTimeout(resolve, 900))
    ])
  } catch {
    toast.add({
      description: 'Failed to delete account. Please try again.',
      icon: 'i-lucide-alert-circle',
      color: 'error'
    })
    progress.value = 0
    step.value = 'confirm'
    return
  }

  step.value = 'done'
  redirect = setTimeout(leave, 2400)
}

async function leave() {
  // Keep the confirmation on screen until the home page replaces it
  await navigateTo('/')
  open.value = false
  clearNuxtData(['chats', 'account'])
  await refreshSession()
}

// One gentle face for the whole flow, and a warm one once it's done
const mood = computed<NuxiMood>(() => step.value === 'done' ? 'happy' : 'wistful')

const headings: Record<Step, { title: string, description: string }> = {
  review: { title: 'Delete account', description: 'This permanently deletes your account and everything below.' },
  confirm: { title: 'Confirm deletion', description: 'Type your username, then press and hold the button.' },
  deleting: { title: 'Deleting account…', description: 'Removing your profile and chats.' },
  done: { title: 'Account deleted', description: 'Thanks for being part of Nuxt. Redirecting…' }
}

// Outgoing and incoming steps crossfade at the same time while the modal springs to the new height
const swap = {
  initial: { opacity: 0, y: 4, filter: 'blur(2px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  // The old step leaves faster than the new one arrives, so the two never read on top of each other
  exit: { opacity: 0, y: -4, filter: 'blur(2px)', transition: { duration: 0.08 } },
  transition: { duration: 0.16, delay: 0.04, ease }
}
const resize = { type: 'spring', bounce: 0, duration: 0.3 } as const
</script>

<template>
  <UModal
    v-model:open="open"
    :dismissible="!busy"
    :close="false"
    :ui="{ content: 'sm:max-w-[26rem] overflow-hidden' }"
  >
    <template #content>
      <motion.div
        :animate="{ height: height || 'auto' }"
        :transition="resize"
        class="overflow-hidden"
      >
        <div ref="content">
          <!-- Stays in place across steps: only Nuxi's face and the text change -->
          <div class="flex items-start gap-3 px-5 pt-5">
            <div class="size-10 shrink-0 rounded-lg ring ring-default bg-elevated/60 flex items-center justify-center">
              <AgentNuxiIcon :mood="mood" :interactive="false" class="h-5 w-auto" />
            </div>
            <div class="relative flex-1 min-w-0" aria-live="polite">
              <AnimatePresence mode="popLayout" :initial="false">
                <motion.div :key="step" v-bind="swap">
                  <h2 class="text-base font-semibold text-highlighted">
                    {{ headings[step].title }}
                  </h2>
                  <p class="text-sm text-muted mt-0.5">
                    {{ headings[step].description }}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          <div class="relative">
            <AnimatePresence mode="popLayout" :initial="false">
              <motion.div v-if="step === 'review'" key="review" v-bind="swap">
                <div class="p-5 flex flex-col gap-4">
                  <ul class="rounded-md ring ring-default divide-y divide-default text-sm">
                    <li v-for="loss in losses" :key="loss.label" class="flex items-center gap-2.5 px-3 py-2.5">
                      <UIcon :name="loss.icon" class="size-4 text-dimmed shrink-0" />
                      <span class="flex-1 text-default">{{ loss.label }}</span>
                      <span v-if="loss.value !== undefined" class="tabular-nums text-muted">{{ loss.value }}</span>
                    </li>
                  </ul>
                  <p class="text-xs text-muted">
                    Your GitHub account and public Nuxter stats are not affected.
                  </p>
                </div>

                <div class="flex justify-end gap-2 px-5 py-3 border-t border-default bg-elevated/40">
                  <UButton
                    label="Cancel"
                    color="neutral"
                    variant="outline"
                    size="sm"
                    autofocus
                    @click="open = false"
                  />
                  <UButton
                    label="Continue"
                    color="error"
                    variant="soft"
                    size="sm"
                    @click="step = 'confirm'"
                  />
                </div>
              </motion.div>

              <motion.div v-else-if="step === 'confirm'" key="confirm" v-bind="swap">
                <div class="p-5">
                  <UFormField name="confirmation">
                    <template #label>
                      <span class="font-normal text-muted">Enter <span class="font-mono text-highlighted">{{ username }}</span> to continue</span>
                    </template>
                    <UInput
                      ref="input"
                      v-model="confirmation"
                      autocomplete="off"
                      autocapitalize="off"
                      spellcheck="false"
                      class="w-full"
                      :ui="{ base: 'font-mono' }"
                      @keydown.enter.prevent="startHold"
                      @keyup.enter="stopHold"
                    >
                      <template #trailing>
                        <AnimatePresence>
                          <motion.span
                            v-if="confirmed"
                            :initial="{ scale: 0.5, opacity: 0 }"
                            :animate="{ scale: 1, opacity: 1 }"
                            :exit="{ scale: 0.5, opacity: 0 }"
                            :transition="{ duration: 0.12 }"
                            class="flex"
                          >
                            <UIcon name="i-lucide-check" class="size-4 text-highlighted" />
                          </motion.span>
                        </AnimatePresence>
                      </template>
                    </UInput>
                  </UFormField>
                </div>

                <div class="flex items-center justify-between gap-2 px-5 py-3 border-t border-default bg-elevated/40">
                  <UButton
                    label="Back"
                    color="neutral"
                    variant="ghost"
                    size="sm"
                    @click="step = 'review'"
                  />
                  <button
                    type="button"
                    :disabled="!confirmed"
                    :aria-label="`Press and hold to delete @${username}`"
                    class="relative h-8 px-3 overflow-hidden rounded-md text-sm font-medium select-none touch-none ring ring-error/40 text-error bg-default transition-[opacity,transform] duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-error disabled:opacity-40 disabled:cursor-not-allowed enabled:active:scale-[0.98]"
                    @pointerdown="startHold"
                    @pointerup="stopHold"
                    @pointerleave="stopHold"
                    @pointercancel="stopHold"
                    @keydown="onHoldKeydown"
                    @keyup="stopHold"
                    @blur="stopHold"
                    @contextmenu.prevent
                  >
                    <span class="absolute inset-0 origin-left bg-error" :style="{ transform: `scaleX(${progress})` }" />
                    <span
                      v-for="layer in ['base', 'fill']"
                      :key="layer"
                      class="flex items-center gap-1.5"
                      :class="layer === 'fill' ? 'absolute inset-0 justify-center text-inverted' : 'relative'"
                      :style="layer === 'fill' ? { clipPath: `inset(0 ${100 - progress * 100}% 0 0)` } : undefined"
                      :aria-hidden="layer === 'fill' || undefined"
                    >
                      <UIcon name="i-lucide-trash-2" class="size-3.5" />
                      Hold to delete
                    </span>
                  </button>
                </div>
              </motion.div>

              <motion.div v-else key="final" v-bind="swap" class="px-5 pt-4 pb-5">
                <!-- Indeterminate while deleting, then counts down to the redirect -->
                <div class="h-1 rounded-full bg-accented overflow-hidden">
                  <motion.div
                    v-if="step === 'deleting'"
                    key="indeterminate"
                    class="h-full w-1/3 rounded-full bg-error"
                    :animate="{ x: ['-100%', '300%'] }"
                    :transition="{ duration: 0.9, repeat: Infinity, ease: 'easeInOut' }"
                  />
                  <motion.div
                    v-else
                    key="redirect"
                    class="h-full rounded-full bg-primary origin-left"
                    :initial="{ scaleX: 0 }"
                    :animate="{ scaleX: 1 }"
                    :transition="{ duration: 2.4, ease: 'linear' }"
                  />
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </template>
  </UModal>
</template>
