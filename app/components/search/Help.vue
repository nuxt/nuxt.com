<script setup lang="ts">
const props = defineProps<{
  invocation: HelpToolInvocation
}>()

const input = ref('')

function handleSubmit() {
  console.log('Question submitted:', input.value)
  input.value = ''
}

const reason = computed(() => {
  if (props.invocation.state === 'output-available' && props.invocation.output) {
    return (props.invocation.output as { reason: string }).reason || ''
  }
  return ''
})

const socialLinks = [
  {
    label: 'Discord',
    href: 'https://discord.com/invite/nuxt',
    icon: 'i-simple-icons-discord'
  },
  {
    label: 'Twitter',
    href: 'https://twitter.com/nuxt_js',
    icon: 'i-simple-icons-x'
  },
  {
    label: 'GitHub',
    href: 'https://github.com/nuxt/nuxt/issues',
    icon: 'i-simple-icons-github'
  }
]
</script>

<template>
  <UCard v-if="invocation.state === 'output-available'" class="border-default">
    <div class="flex flex-col gap-4">
      <div class="flex flex-col gap-2">
        <p class="text-sm text-muted">
          I'm sorry, I don't know how to answer your question. {{ reason }}
        </p>
        <h3 class="text-sm font-semibold text-highlighted">
          Need more help?
        </h3>
        <p class="text-sm text-muted">
          Ask your question to the Nuxt community or check our support channels.
        </p>
      </div>

      <form class="flex flex-col gap-3" @submit.prevent="handleSubmit">
        <UInput
          v-model="input"
          placeholder="Ask a question to the team..."
          :ui="{ base: 'w-full' }"
        />
        <UButton
          type="submit"
          :disabled="!input.trim()"
          label="Submit Question"
          class="w-fit self-end"
        />
      </form>

      <div class="flex flex-col gap-2 pt-2 border-t border-default">
        <p class="text-xs text-dimmed font-medium">
          Or reach out on:
        </p>
        <div class="flex flex-wrap gap-2">
          <UButton
            v-for="link in socialLinks"
            :key="link.label"
            :to="link.href"
            target="_blank"
            external
            variant="outline"
            size="sm"
            :leading-icon="link.icon"
            color="neutral"
          >
            {{ link.label }}
          </UButton>
        </div>
      </div>
    </div>
  </UCard>

  <div v-else class="flex items-center justify-center py-8">
    <div class="text-center">
      <UIcon
        name="i-lucide-loader-circle"
        class="size-8 mx-auto mb-2 animate-spin"
      />
      <div class="text-sm text-muted">
        Loading help interface...
      </div>
    </div>
  </div>
</template>
