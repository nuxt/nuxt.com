<script setup lang="ts">
/**
 * A section of the `/agents` page: `UPageSection` with a stacked head (label, title, description)
 * on one left edge.
 *
 * - `split`: the head and body on the left, the default slot (a visual) beside them.
 * - `stack`: the head on top, the default slot full width below it.
 *
 * The `below` slot spans the full width under both.
 */
const props = withDefaults(defineProps<{
  id: string
  layout?: 'split' | 'stack'
  /** The mono label above the title, e.g. "01 · Conventions". */
  label?: string
  /** A small badge after the label, e.g. "Experimental". */
  badge?: string
  /** In `split`, align the two columns at the top instead of the center. */
  top?: boolean
  /** In `split`, give the head and the visual equal columns. */
  wide?: boolean
  /** Space above the section: `lg` after a half header, `sm` after another section. */
  space?: 'sm' | 'lg'
  /** A full-width rule above the section. */
  divider?: boolean
}>(), {
  layout: 'split'
})

const slots = defineSlots<{
  title?: () => unknown
  description?: () => unknown
  body?: () => unknown
  default?: () => unknown
  below?: () => unknown
}>()

const ui = computed(() => ({
  root: [
    'scroll-mt-[calc(var(--ui-header-height)+52px)]',
    props.divider ? 'border-t border-default' : ''
  ].join(' '),
  container: [
    props.divider ? 'pt-[clamp(64px,8vw,128px)]!' : props.space === 'lg' ? 'pt-[clamp(64px,7vw,112px)]!' : props.space === 'sm' ? 'pt-[clamp(32px,3.5vw,56px)]!' : 'pt-0!',
    slots.below ? 'pb-0!' : 'pb-[clamp(96px,11vw,168px)]!',
    props.layout === 'stack'
      ? 'lg:flex gap-[clamp(32px,4vw,56px)] sm:gap-[clamp(32px,4vw,56px)] lg:gap-[clamp(32px,4vw,56px)]'
      : [
          'gap-10 sm:gap-10 lg:gap-y-10 lg:gap-x-[clamp(40px,5vw,80px)]',
          props.wide ? 'lg:grid-cols-2' : 'lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]',
          props.top ? 'lg:items-start' : 'lg:items-center'
        ].join(' ')
  ].join(' '),
  wrapper: 'min-w-0',
  headline: 'mb-4.5 flex flex-wrap items-center gap-2.5 justify-start font-mono text-[13px]/none font-medium tracking-[0.08em] uppercase text-muted',
  title: '-ms-[0.03em] max-w-[18ch] font-heading font-medium text-[clamp(36px,5vw,76px)]/none! tracking-[-0.04em] text-left text-balance text-highlighted [&_p]:my-0',
  description: 'mt-4.5 max-w-160 text-[clamp(17px,1.5vw,21px)]/[1.55]! text-muted text-left text-pretty [&_p]:my-0 [&_a:not([data-slot])]:underline [&_a:not([data-slot])]:underline-offset-3',
  body: 'mt-5 text-default leading-7 [&>p]:my-0 [&>*+*]:mt-3! [&_a:not([data-slot])]:underline [&_a:not([data-slot])]:underline-offset-3'
}))
</script>

<template>
  <UPageSection
    :id="id"
    :orientation="layout === 'stack' ? 'vertical' : 'horizontal'"
    :ui="ui"
  >
    <template v-if="label || badge" #headline>
      <span v-if="label">{{ label }}</span>
      <UBadge
        v-if="badge"
        :label="badge"
        color="neutral"
        variant="outline"
        class="rounded-full font-sans normal-case tracking-normal"
      />
    </template>
    <template v-if="slots.title" #title>
      <slot name="title" />
    </template>
    <template v-if="slots.description" #description>
      <slot name="description" />
    </template>
    <template v-if="slots.body" #body>
      <slot name="body" />
    </template>
    <template v-if="slots.default" #default>
      <div class="relative min-w-0 flex flex-col gap-4 *:my-0">
        <slot />
      </div>
    </template>
    <template v-if="slots.below" #bottom>
      <UContainer class="pt-[clamp(48px,6vw,96px)] pb-[clamp(96px,11vw,168px)] flex flex-col gap-6">
        <slot name="below" />
      </UContainer>
    </template>
  </UPageSection>
</template>
