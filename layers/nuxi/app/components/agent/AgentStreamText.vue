<script setup lang="ts">
import type { ComarkPlugin, Node } from 'comark'
import { streamWordSegmenter } from '../../composables/useStreamedText'

const props = defineProps<{
  value: string
  streaming: boolean
  animate?: boolean
}>()

const emit = defineEmits<{ pending: [value: boolean] }>()
const { text, pending } = useStreamedText(() => props.value, () => props.streaming, props.animate)
// Keep the same word nodes when the turn settles, including a one-word reply.
const animate = props.animate || props.streaming
function wrapWords(node: Node): Node[] {
  if (typeof node === 'string') {
    return Array.from(streamWordSegmenter.segment(node), ({ segment }) => /^\s+$/u.test(segment) ? segment : ['span', { class: 'nuxi-stream-word' }, segment])
  }
  if (!node[0] || ['pre', 'code', 'source-link'].includes(node[0]) || node[1].class === 'nuxi-stream-word') return [node]
  return [[node[0], node[1], ...node.slice(2).flatMap(child => wrapWords(child as Node))]]
}
const plugins: ComarkPlugin[] = [{
  name: 'nuxi-stream-words',
  post(state) {
    if (animate) state.tree.nodes = state.tree.nodes.flatMap(wrapWords)
  }
}]
watch(pending, value => emit('pending', value), { immediate: true, flush: 'post' })
onBeforeUnmount(() => emit('pending', false))
</script>

<template>
  <AgentComark
    :value="text"
    :streaming="pending"
    :plugins="plugins"
    class="nuxi-stream-text"
  />
</template>

<style>
.nuxi-stream-text .nuxi-stream-word {
  animation: nuxi-word-reveal 240ms ease-out both;
}

@keyframes nuxi-word-reveal {
  from {
    opacity: 0.35;
    color: color-mix(in srgb, var(--ui-primary) 25%, currentColor);
  }
  to {
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .nuxi-stream-text .nuxi-stream-word {
    animation: none;
  }
}
</style>
