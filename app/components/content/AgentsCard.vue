<script setup lang="ts">
/**
 * `UPageCard` with the `/agents` page's look: a visual in the header slot, a title and an
 * optional link line at the bottom.
 */
const props = defineProps<{
  to?: string
  target?: string
  /** The label of the link line, e.g. "See the template". */
  link?: string
  /** Full-bleed header: the visual spans the card edge to edge, above a border. */
  bleed?: boolean
  /** A lucide icon before the title. */
  icon?: string
  /** Make the whole card a button that emits `select`, for actions that aren't links. */
  action?: boolean
}>()

const emit = defineEmits<{ select: [] }>()

const slots = defineSlots<{
  header?: () => unknown
  title?: () => unknown
  description?: () => unknown
  default?: () => unknown
}>()

const external = computed(() => !!props.to && /^https?:\/\//.test(props.to))

const hasFooter = computed(() => !!props.link || !!slots.default)
const interactive = computed(() => !!props.to || props.action)

const ui = computed(() => ({
  root: ['min-h-fit overflow-hidden rounded-2xl bg-elevated ring-default [--agents-code-bg:var(--ui-bg)]', interactive.value ? 'hover:ring-accented transition-[box-shadow]' : ''].join(' '),
  container: props.bleed ? 'min-w-0 p-0 sm:p-0 gap-0 h-full' : 'min-w-0 p-6 sm:p-6 gap-5 h-full',
  wrapper: 'h-full',
  header: props.bleed ? 'w-full mb-0 border-b border-default' : 'w-full mb-5',
  body: props.bleed ? ['w-full px-6 pt-6 flex-1', hasFooter.value ? '' : 'pb-6'].join(' ') : 'w-full flex-1',
  title: 'font-heading text-[22px]/[1.25] font-medium text-highlighted [&_p]:my-0',
  description: 'mt-3 text-[15px]/[1.6] text-muted *:my-0 [&>*+*]:mt-4!',
  footer: props.bleed ? 'w-full px-6 pb-6 pt-3 mt-auto' : 'w-full pt-5 mt-auto'
}))
</script>

<template>
  <UPageCard :to="to" :target="target" variant="outline" :ui="ui">
    <template v-if="slots.header" #header>
      <div aria-hidden="true">
        <slot name="header" />
      </div>
    </template>

    <template v-if="slots.title" #title>
      <span class="flex items-center justify-between gap-3">
        <span class="flex items-center gap-2.5">
          <UIcon v-if="icon" :name="icon" class="shrink-0 size-5" />
          <slot name="title" />
        </span>
      </span>
    </template>

    <template v-if="slots.description" #description>
      <slot name="description" />
    </template>

    <template v-if="link || slots.default" #footer>
      <div class="w-full flex flex-col gap-4 [&>*]:my-0">
        <slot />
        <button
          v-if="link && action"
          type="button"
          class="self-start inline-flex items-center gap-1.5 text-[15px] font-medium text-primary after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-primary"
          @click="emit('select')"
        >
          {{ link }}
          <UIcon name="i-lucide-arrow-right" class="size-4" />
        </button>
        <span v-else-if="link" class="inline-flex items-center gap-1.5 text-[15px] font-medium text-primary">
          {{ link }}
          <UIcon :name="external ? 'i-lucide-arrow-up-right' : 'i-lucide-arrow-right'" class="size-4" />
        </span>
      </div>
    </template>
  </UPageCard>
</template>
