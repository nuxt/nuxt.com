<script setup lang="ts">
/**
 * The hero diagram: your coding agent builds the app (development), the agents your users
 * bring use it (production). The outer nodes link to their half. Side by side from `md`,
 * stacked below.
 *
 * With motion it plays one 9s loop: the agent types a prompt and writes two files, a signal
 * reaches the app and its Add button comes alive, a signal reaches the user's agent and lights
 * each channel, then a signal comes back and presses Add. Without motion (and before mount)
 * it shows that last frame.
 */
const motion = useAgentsMotion()

const label = 'Your coding agent builds your Nuxt app in development; the agents your users bring use it in production.'
const prompt = 'add a cart button'
const files = ['app/composables/useCart.ts', 'app/pages/index.vue']
const channels = [
  { name: 'WebMCP', hint: '@tool' },
  { name: 'MCP server', hint: '/mcp' },
  { name: 'Markdown', hint: 'text/markdown' }
]

const node = 'flex flex-col gap-3.5 p-4.5 rounded-2xl border border-default bg-elevated md:flex-[0_1_300px] min-w-0'
const nodeLink = 'transition-colors hover:border-accented focus-visible:outline-2 focus-visible:outline-primary'
const nodeLabel = 'flex items-center justify-between gap-3 font-mono text-xs/none font-medium tracking-[0.08em] uppercase text-muted'
</script>

<template>
  <figure :aria-label="label" class="agents-hero not-prose m-0 flex flex-col md:flex-row md:items-stretch" :class="{ 'is-playing': motion }">
    <a href="#development" :class="[node, nodeLink]">
      <span :class="nodeLabel">
        Your coding agent
        <UIcon name="i-lucide-square-terminal" class="size-3.5" />
      </span>
      <span aria-hidden="true" class="flex-1 flex flex-col justify-center gap-2 p-3.5 rounded-[10px] border border-default bg-default font-mono text-xs/none whitespace-nowrap overflow-hidden">
        <span class="flex items-center gap-2 text-highlighted">
          <span class="text-primary">›</span>
          <span class="agents-hero-type overflow-hidden" :style="{ '--chars': prompt.length }">{{ prompt }}</span>
          <span class="agents-hero-caret w-1.75 h-3 -ms-1 bg-inverted" />
        </span>
        <span v-for="(file, index) in files" :key="file" class="flex items-center gap-2 ps-4 text-muted truncate" :class="`agents-hero-file-${index}`">
          <UIcon name="i-lucide-check" class="shrink-0 size-3 text-primary" />
          {{ file }}
        </span>
      </span>
      <span class="mt-auto text-[13px]/snug text-toned">Claude Code · Cursor · Codex · Copilot</span>
    </a>

    <div aria-hidden="true" class="agents-connector">
      <span class="agents-connector-line" />
      <span v-if="motion" class="agents-connector-dot agents-hero-dot-dev" />
      <span class="agents-connector-label">Development</span>
      <span class="agents-connector-caption">builds it</span>
    </div>

    <div aria-hidden="true" class="agents-hero-app relative flex flex-col md:flex-[0_1_340px] min-w-0 rounded-[18px] border border-primary/45 bg-elevated overflow-hidden">
      <span class="flex items-center gap-2.5 h-9.5 px-3.5 border-b border-default">
        <span class="flex gap-1.25">
          <span v-for="dot in 3" :key="dot" class="size-1.75 rounded-full bg-accented" />
        </span>
        <span class="flex-1 max-w-45 h-4 rounded-full border border-default bg-default" />
        <span class="agents-hero-cart ms-auto inline-flex items-center gap-1 font-mono text-[11px]/none text-highlighted">
          <UIcon name="i-lucide-shopping-cart" class="size-3.5 text-muted" />
          1
        </span>
      </span>
      <span class="flex-1 flex flex-col gap-3.5 px-4.5 pt-4 pb-4.5">
        <span class="font-mono text-xs/none font-medium tracking-[0.08em] uppercase text-highlighted">Your Nuxt app</span>
        <span class="grid grid-cols-2 gap-2.5">
          <span class="flex flex-col gap-2 p-2.5 rounded-[10px] border border-default bg-default">
            <span class="h-8.5 rounded-md bg-elevated" />
            <span class="w-[70%] h-1.5 rounded-full bg-accented" />
            <span class="agents-hero-add self-start px-2.5 py-1.25 rounded-md text-[11px]/none font-semibold">Add</span>
          </span>
          <span class="flex flex-col gap-2 p-2.5 rounded-[10px] border border-default bg-default">
            <span class="h-8.5 rounded-md bg-elevated" />
            <span class="w-[52%] h-1.5 rounded-full bg-accented" />
            <span class="self-start px-2.5 py-1.25 rounded-md bg-elevated text-[11px]/none font-semibold text-dimmed">Add</span>
          </span>
        </span>
      </span>
    </div>

    <div aria-hidden="true" class="agents-connector">
      <span class="agents-connector-line" />
      <span v-if="motion" class="agents-connector-dot agents-hero-dot-prod" />
      <span v-if="motion" class="agents-connector-dot agents-hero-dot-back" />
      <span class="agents-connector-label">Production</span>
      <span class="agents-connector-caption">uses it</span>
    </div>

    <a href="#production" :class="[node, nodeLink, 'gap-3']">
      <span :class="nodeLabel">
        Agents your users bring
        <UIcon name="i-lucide-app-window" class="size-3.5" />
      </span>
      <span class="flex flex-col gap-1.5">
        <span
          v-for="(channel, index) in channels"
          :key="channel.name"
          class="flex items-center gap-2.5 h-9 px-3 rounded-lg border border-default bg-default text-[13px] font-semibold text-highlighted"
        >
          <span aria-hidden="true" class="relative shrink-0 size-1.5 rounded-full bg-accented">
            <span class="absolute inset-0 rounded-full bg-primary" :class="`agents-hero-channel-${index}`" />
          </span>
          {{ channel.name }}
          <span class="ms-auto font-mono text-xs font-normal text-muted">{{ channel.hint }}</span>
        </span>
      </span>
      <span class="mt-auto text-[13px]/snug text-toned">In the browser, over MCP, as Markdown</span>
    </a>
  </figure>
</template>

<style>
/* Resting state: the end of the story. */
.agents-hero-type {
  display: inline-block;
  width: calc(var(--chars) * 1ch);
}

.agents-hero-caret {
  opacity: 0;
}

.agents-hero-app {
  box-shadow:
    0 0 0 6px color-mix(in oklab, var(--ui-primary) 6%, transparent),
    0 30px 80px -30px color-mix(in oklab, var(--ui-primary) 45%, transparent);
}

.agents-hero-add {
  background: var(--ui-primary);
  color: var(--ui-bg);
  box-shadow: 0 0 0 3px color-mix(in oklab, var(--ui-primary) 25%, transparent);
}

/* Connectors: a line with its label above and caption below, vertical on phones. */
.agents-connector {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  height: 72px;
  padding-left: 44px;
}

.agents-connector-line {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 24px;
  border-left: 1px dashed var(--ui-border-accented);
}

.agents-connector-label {
  position: relative;
  font: 500 11px/1 var(--font-mono);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--ui-text-highlighted);
}

.agents-connector-caption {
  position: relative;
  font-size: 12px;
  color: var(--ui-text-muted);
}

.agents-connector-dot {
  position: absolute;
  left: 21px;
  top: 0;
  width: 6px;
  height: 6px;
  border-radius: 3px;
  background: var(--ui-primary);
  box-shadow: 0 0 12px var(--ui-primary);
  opacity: 0;
}

@media (min-width: 768px) {
  .agents-connector {
    flex: 1 1 80px;
    min-width: 64px;
    align-self: center;
    flex-direction: column;
    justify-content: space-between;
    gap: 0;
    padding-left: 0;
  }

  .agents-connector-line {
    top: 50%;
    bottom: auto;
    left: 0;
    right: 0;
    border-left: 0;
    border-top: 1px dashed var(--ui-border-accented);
  }

  .agents-connector-dot {
    top: calc(50% - 3px);
    left: 0;
  }
}

/* The loop. Every part runs on the same 9s clock, so the percentages are one timeline:
   type 0–13, files 15–22, signal to the app 23–32, Add comes alive 32–34, signal to the
   user's agent 40–49, channels 49–57, signal back 61–70, press and cart 70–74, reset 92–96. */
.agents-hero.is-playing .agents-hero-type { animation: agents-hero-type 9s steps(17, end) infinite }
.agents-hero.is-playing .agents-hero-caret { animation: agents-hero-caret 9s step-end infinite }
.agents-hero.is-playing .agents-hero-file-0 { animation: agents-hero-in-15 9s ease-out infinite }
.agents-hero.is-playing .agents-hero-file-1 { animation: agents-hero-in-19 9s ease-out infinite }
.agents-hero.is-playing .agents-hero-app { animation: agents-hero-app 9s ease-out infinite }
.agents-hero.is-playing .agents-hero-add { animation: agents-hero-add 9s ease-out infinite }
.agents-hero.is-playing .agents-hero-channel-0 { animation: agents-hero-in-49 9s ease-out infinite }
.agents-hero.is-playing .agents-hero-channel-1 { animation: agents-hero-in-52 9s ease-out infinite }
.agents-hero.is-playing .agents-hero-channel-2 { animation: agents-hero-in-55 9s ease-out infinite }
.agents-hero.is-playing .agents-hero-cart { animation: agents-hero-in-72 9s ease-out infinite }
.agents-hero-dot-dev { animation: agents-hero-dev-y 9s linear infinite }
.agents-hero-dot-prod { animation: agents-hero-prod-y 9s linear infinite }
.agents-hero-dot-back { animation: agents-hero-back-y 9s linear infinite }

@media (min-width: 768px) {
  .agents-hero-dot-dev { animation-name: agents-hero-dev-x }
  .agents-hero-dot-prod { animation-name: agents-hero-prod-x }
  .agents-hero-dot-back { animation-name: agents-hero-back-x }
}

@keyframes agents-hero-type {
  0% { width: 0 }
  13%, 92% { width: calc(var(--chars) * 1ch) }
  96%, 100% { width: 0 }
}

@keyframes agents-hero-caret {
  0%, 4%, 8%, 12% { opacity: 1 }
  2%, 6%, 10%, 14%, 100% { opacity: 0 }
}

@keyframes agents-hero-in-15 { 0%, 15% { opacity: 0 } 18%, 92% { opacity: 1 } 96%, 100% { opacity: 0 } }
@keyframes agents-hero-in-19 { 0%, 19% { opacity: 0 } 22%, 92% { opacity: 1 } 96%, 100% { opacity: 0 } }
@keyframes agents-hero-in-49 { 0%, 49% { opacity: 0 } 51%, 92% { opacity: 1 } 96%, 100% { opacity: 0 } }
@keyframes agents-hero-in-52 { 0%, 52% { opacity: 0 } 54%, 92% { opacity: 1 } 96%, 100% { opacity: 0 } }
@keyframes agents-hero-in-55 { 0%, 55% { opacity: 0 } 57%, 92% { opacity: 1 } 96%, 100% { opacity: 0 } }
@keyframes agents-hero-in-72 { 0%, 72% { opacity: 0 } 74%, 92% { opacity: 1 } 96%, 100% { opacity: 0 } }

@keyframes agents-hero-app {
  0%, 31%, 46%, 100% {
    box-shadow:
      0 0 0 6px color-mix(in oklab, var(--ui-primary) 6%, transparent),
      0 30px 80px -30px color-mix(in oklab, var(--ui-primary) 45%, transparent);
  }
  34% {
    box-shadow:
      0 0 0 8px color-mix(in oklab, var(--ui-primary) 14%, transparent),
      0 30px 90px -24px color-mix(in oklab, var(--ui-primary) 70%, transparent);
  }
}

@keyframes agents-hero-add {
  0%, 32%, 96%, 100% { background: var(--ui-bg-elevated); color: var(--ui-text-dimmed); box-shadow: none; transform: none }
  34%, 69%, 73%, 92% { background: var(--ui-primary); color: var(--ui-bg); box-shadow: 0 0 0 3px color-mix(in oklab, var(--ui-primary) 25%, transparent); transform: none }
  71% { background: var(--ui-primary); color: var(--ui-bg); box-shadow: 0 0 0 6px color-mix(in oklab, var(--ui-primary) 35%, transparent); transform: scale(0.9) }
}

@keyframes agents-hero-dev-x { 0%, 23% { left: 0; opacity: 0 } 24% { opacity: 1 } 31% { opacity: 1 } 32% { left: calc(100% - 6px); opacity: 0 } 100% { left: calc(100% - 6px); opacity: 0 } }
@keyframes agents-hero-prod-x { 0%, 40% { left: 0; opacity: 0 } 41% { opacity: 1 } 48% { opacity: 1 } 49% { left: calc(100% - 6px); opacity: 0 } 100% { left: calc(100% - 6px); opacity: 0 } }
@keyframes agents-hero-back-x { 0%, 61% { left: calc(100% - 6px); opacity: 0 } 62% { opacity: 1 } 69% { opacity: 1 } 70% { left: 0; opacity: 0 } 100% { left: 0; opacity: 0 } }
@keyframes agents-hero-dev-y { 0%, 23% { top: 0; opacity: 0 } 24% { opacity: 1 } 31% { opacity: 1 } 32% { top: calc(100% - 6px); opacity: 0 } 100% { top: calc(100% - 6px); opacity: 0 } }
@keyframes agents-hero-prod-y { 0%, 40% { top: 0; opacity: 0 } 41% { opacity: 1 } 48% { opacity: 1 } 49% { top: calc(100% - 6px); opacity: 0 } 100% { top: calc(100% - 6px); opacity: 0 } }
@keyframes agents-hero-back-y { 0%, 61% { top: calc(100% - 6px); opacity: 0 } 62% { opacity: 1 } 69% { opacity: 1 } 70% { top: 0; opacity: 0 } 100% { top: 0; opacity: 0 } }
</style>
