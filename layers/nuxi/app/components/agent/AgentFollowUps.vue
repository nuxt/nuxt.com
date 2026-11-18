<script setup lang="ts">
defineOptions({ inheritAttrs: false })

const props = defineProps<{ first?: string, second?: string }>()
const followUp = inject<{ enabled: Ref<boolean>, ask: (question: string) => void }>('chat-follow-up')
const { rateLimitReached } = useNuxtAgent()
const selected = ref(false)
const questions = computed(() => [...new Set([props.first, props.second]
  .filter((value): value is string => typeof value === 'string')
  .map(value => value.trim())
  .filter(value => value.length > 0 && value.length <= 100))])

function ask(question: string) {
  selected.value = true
  followUp?.ask(question)
}
</script>

<template>
  <Transition
    enter-from-class="opacity-0 translate-y-1 motion-reduce:translate-y-0"
    enter-active-class="transition-[opacity,transform] duration-200 ease-out motion-reduce:transition-none"
  >
    <div
      v-if="followUp?.enabled.value && !rateLimitReached && !selected && questions.length"
      class="flex flex-wrap gap-2 pt-3 pb-1"
      role="group"
      aria-label="Suggested follow-up questions"
      data-follow-up-suggestions
    >
      <UButton
        v-for="question in questions"
        :key="question"
        :label="question"
        color="neutral"
        variant="outline"
        size="xs"
        class="max-w-full rounded-full bg-default px-3 py-1.5 text-left font-normal text-muted shadow-xs transition-[color,border-color,box-shadow] duration-150 hover:border-primary/40 hover:text-highlighted hover:shadow-sm motion-reduce:transition-none"
        :ui="{ label: 'whitespace-normal' }"
        @click="ask(question)"
      />
    </div>
  </Transition>
</template>
