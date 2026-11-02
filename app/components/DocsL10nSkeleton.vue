<script setup lang="ts">
import type { Placeholder } from '@diglot/core'

const props = defineProps<{
  /** A source or translated skeleton: text with `{n}` and `{n}…{/n}` placeholders. */
  skeleton: string
  placeholders: Placeholder[]
}>()

type Part = { type: 'text', value: string, linked: boolean } | { type: 'chip', label: string, title: string, icon: string }

const ICONS: Record<Placeholder['type'], string> = {
  code: 'i-lucide-code',
  link: 'i-lucide-link',
  component: 'i-lucide-component',
  html: 'i-lucide-code-xml',
  image: 'i-lucide-image',
  break: 'i-lucide-corner-down-left',
  binding: 'i-lucide-braces',
  other: 'i-lucide-puzzle'
}

function label(placeholder: Placeholder | undefined, id: number): string {
  if (!placeholder) return `{${id}}`
  if (placeholder.type === 'code') return placeholder.source.replace(/^`+\s?|\s?`+$/g, '')
  if (placeholder.type === 'break') return ''
  if (placeholder.name) return placeholder.name
  return placeholder.source.length > 32 ? `${placeholder.source.slice(0, 31)}…` : placeholder.source
}

const parts = computed<Part[]>(() => {
  const byId = new Map(props.placeholders.map(placeholder => [placeholder.id, placeholder]))
  const open = new Set<number>()
  const result: Part[] = []
  const text = (value: string) => {
    if (!value) return
    const last = result.at(-1)
    const linked = open.size > 0
    if (last?.type === 'text' && last.linked === linked) last.value += value
    else result.push({ type: 'text', value, linked })
  }

  let index = 0
  for (const match of props.skeleton.matchAll(/\\([\s\S])|\{(\/?)(\d+)\}/g)) {
    text(props.skeleton.slice(index, match.index))
    index = match.index + match[0].length
    if (match[1] !== undefined) {
      text(match[1])
      continue
    }
    const id = Number(match[3])
    const placeholder = byId.get(id)
    if (match[2]) {
      open.delete(id)
    } else if (placeholder?.close !== undefined) {
      open.add(id)
      result.push({ type: 'chip', label: '', title: `${placeholder.source}…${placeholder.close}`, icon: ICONS.link })
    } else {
      result.push({ type: 'chip', label: label(placeholder, id), title: placeholder?.source ?? match[0], icon: ICONS[placeholder?.type ?? 'other'] })
    }
  }
  text(props.skeleton.slice(index))

  return result
})
</script>

<template>
  <span class="whitespace-pre-wrap">
    <template v-for="(part, index) in parts" :key="index">
      <span v-if="part.type === 'text'" :class="part.linked ? 'underline decoration-dotted underline-offset-2' : undefined">{{ part.value }}</span>
      <UBadge
        v-else
        :title="part.title"
        :icon="part.icon"
        :label="part.label || undefined"
        color="neutral"
        variant="subtle"
        size="sm"
        class="font-mono align-baseline mx-0.5"
      />
    </template>
  </span>
</template>
