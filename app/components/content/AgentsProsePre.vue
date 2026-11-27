<script setup lang="ts">
import { ProsePre } from '#components'

/**
 * `ProsePre` for the `/agents` page, driven by flags in the fence meta:
 *
 * - `line-numbers`: a number in the gutter of each line.
 * - `diff`: highlighted lines (`{3}`) show `+` in the gutter, as added lines.
 *
 * Wide code scrolls inside its block instead of wrapping. Blocks sit on `bg-elevated`;
 * a parent card sets `--agents-code-bg` to put them on the page background instead.
 */
const props = defineProps<{
  icon?: string
  code?: string
  language?: string
  filename?: string
  highlights?: number[]
  hideHeader?: boolean
  meta?: string
  class?: any
}>()

const flags = computed(() => new Set((props.meta ?? '').split(/\s+/).filter(Boolean)))

// One box like the design: a 44px header with the file name, a ghost copy button and the code below.
const ui = computed(() => ({
  root: 'my-0',
  header: 'min-h-11 py-0 ps-4 pe-12 rounded-t-xl border-default bg-(--agents-code-bg,var(--ui-bg-elevated))',
  filename: 'font-mono text-[13px] font-medium text-toned',
  icon: 'size-3.5',
  copy: [
    'end-1 size-9 justify-center ring-0 bg-transparent text-muted hover:bg-transparent hover:text-highlighted lg:opacity-100',
    props.filename ? 'top-1' : 'top-2.5'
  ].join(' '),
  base: 'px-[18px] py-4 pe-12 rounded-xl border-default bg-(--agents-code-bg,var(--ui-bg-elevated)) font-mono text-[13.5px]/[1.75] whitespace-pre wrap-normal **:[.line.highlight]:bg-primary/10!'
}))
</script>

<template>
  <ProsePre
    v-bind="props"
    :class="[
      props.class,
      'agents-pre',
      { 'agents-pre-lines': flags.has('line-numbers'), 'agents-pre-diff': flags.has('diff') }
    ]"
    :ui="ui"
  >
    <slot />
  </ProsePre>
</template>

<style>
.agents-pre .line.highlight {
  display: inline-block !important;
  width: calc(100% + 18px + 3rem);
  margin-inline: -18px -3rem;
  padding-inline: 15px 3rem;
  border-left: 3px solid var(--ui-primary);
}

.agents-pre-lines {
  counter-reset: agents-line;
}

.agents-pre-lines .line::before {
  counter-increment: agents-line;
  content: counter(agents-line);
  display: inline-block;
  width: 2ch;
  margin-right: 18px;
  text-align: right;
  color: var(--ui-text-dimmed);
  user-select: none;
}

.agents-pre-lines .line.highlight::before {
  color: var(--ui-primary);
}

.agents-pre-diff .line.highlight::before {
  content: '+';
}
</style>
