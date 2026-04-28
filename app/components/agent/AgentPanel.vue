<script setup lang="ts">
const {
  isOpen,
  faqQuestions,
  expandToFullScreen,
  isAgentDockedBreakpoint,
  usage,
  rateLimitReached,
  currentPage,
  pageContextDismissed,
  pageContextEnabled
} = useNuxtAgent()

const { chat, input, votes, vote, canClear, onSubmit, askQuestion, clearMessages } = useAgentChat({
  source: 'prompt',
  withPageContext: 'when-enabled'
})

const panelUi = {
  footer: 'p-0',
  actions: 'gap-0.5'
} as const

/* Slideover theme defaults add sm:px-6 / sm:p-6; override so layout matches USidebar (full width inside panel) */
const slideoverUi = {
  footer: 'p-0 px-0 sm:px-0',
  header:
    'min-h-(--ui-header-height) flex items-center gap-1.5 overflow-hidden border-b border-default px-4 sm:px-4',
  wrapper: 'min-w-0 flex-1',
  title: 'text-highlighted font-semibold truncate',
  actions: 'flex items-center gap-1.5 shrink-0 gap-0.5',
  close: '',
  body: 'flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4 sm:p-4'
}

defineShortcuts({
  meta_i: {
    handler: () => {
      isOpen.value = !isOpen.value
    },
    usingInput: true
  },
  tab: {
    handler: () => {
      if (!isOpen.value || !currentPage.value) return
      pageContextDismissed.value = !pageContextDismissed.value
    },
    usingInput: true
  }
})
</script>

<template>
  <USidebar
    v-if="isAgentDockedBreakpoint"
    v-model:open="isOpen"
    side="right"
    rail
    :style="{ '--sidebar-width': '24rem' }"
    :ui="panelUi"
  >
    <template #title>
      <span class="inline-flex items-center gap-2 min-w-0">
        <span class="truncate">Agent</span>
        <UBadge variant="subtle" size="sm" class="shrink-0">
          Beta
        </UBadge>
      </span>
    </template>
    <template #actions>
      <UTooltip v-if="canClear" text="Clear chat">
        <UButton
          icon="i-lucide-list-x"
          color="neutral"
          variant="ghost"
          @click="clearMessages"
        />
      </UTooltip>
      <UTooltip text="Open full screen">
        <UButton
          icon="i-lucide-maximize-2"
          color="neutral"
          variant="ghost"
          @click="expandToFullScreen"
        />
      </UTooltip>
    </template>

    <template #close>
      <UTooltip text="Close" :kbds="['meta', 'i']">
        <UButton
          icon="i-lucide-panel-right-close"
          color="neutral"
          variant="ghost"
          aria-label="Close"
          @click="isOpen = false"
        />
      </UTooltip>
    </template>

    <AgentPanelMain
      v-model:votes="votes"
      :chat="chat"
      :faq-questions="faqQuestions"
      @ask-question="askQuestion"
      @vote="vote"
    />

    <template #footer>
      <AgentPanelFooter
        v-model="input"
        :chat="chat"
        :current-page="currentPage"
        :page-context-enabled="pageContextEnabled"
        :rate-limit-reached="rateLimitReached"
        :usage="usage"
        @submit="onSubmit"
        @dismiss-page-context="pageContextDismissed = true"
        @add-page-context="pageContextDismissed = false"
      />
    </template>
  </USidebar>

  <USlideover
    v-else
    v-model:open="isOpen"
    side="right"
    :style="{ '--sidebar-width': '24rem' }"
    :ui="{
      ...slideoverUi,
      /* Full width on small screens; cap at sidebar width from sm up (slideover only below xl) */
      content: 'w-full max-w-none sm:max-w-96 max-h-svh p-0 flex flex-col'
    }"
  >
    <template #title>
      <span class="inline-flex items-center gap-2 min-w-0">
        <span class="truncate">Agent</span>
        <UBadge variant="subtle" size="sm" class="shrink-0">
          Beta
        </UBadge>
      </span>
    </template>
    <template #actions>
      <UTooltip v-if="canClear" text="Clear chat">
        <UButton
          icon="i-lucide-list-x"
          color="neutral"
          variant="ghost"
          @click="clearMessages"
        />
      </UTooltip>
      <UTooltip text="Open full screen">
        <UButton
          icon="i-lucide-maximize-2"
          color="neutral"
          variant="ghost"
          @click="expandToFullScreen"
        />
      </UTooltip>
    </template>

    <template #close>
      <UTooltip text="Close" :kbds="['meta', 'i']">
        <UButton
          icon="i-lucide-panel-right-close"
          color="neutral"
          variant="ghost"
          aria-label="Close"
          @click="isOpen = false"
        />
      </UTooltip>
    </template>

    <template #body>
      <AgentPanelMain
        v-model:votes="votes"
        :chat="chat"
        :faq-questions="faqQuestions"
        class="min-h-0 flex-1 flex flex-col overflow-hidden"
        @ask-question="askQuestion"
        @vote="vote"
      />
    </template>

    <template #footer>
      <AgentPanelFooter
        v-model="input"
        :chat="chat"
        :current-page="currentPage"
        :page-context-enabled="pageContextEnabled"
        :rate-limit-reached="rateLimitReached"
        :usage="usage"
        @submit="onSubmit"
        @dismiss-page-context="pageContextDismissed = true"
        @add-page-context="pageContextDismissed = false"
      />
    </template>
  </USlideover>
</template>
