<script setup lang="ts">
defineOptions({ inheritAttrs: false })

const props = defineProps({
  to: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: false,
    default: ''
  }
})

const attrs = useAttrs()
const isTitleAttr = (name: string) => name.startsWith('data-l10n') || name === 'lang'
const calloutAttrs = computed(() => Object.fromEntries(Object.entries(attrs).filter(([name]) => !isTitleAttr(name))))
const titleAttrs = computed(() => Object.fromEntries(Object.entries(attrs).filter(([name]) => isTitleAttr(name))))

const computedTitle = computed<string>(() => props.title || createBreadcrumb(props.to))
</script>

<template>
  <ProseCallout icon="i-lucide-bookmark" :to="to" :aria-label="computedTitle" v-bind="calloutAttrs">
    <slot mdc-unwrap="p">
      Read more in <span class="font-bold" v-bind="titleAttrs" v-text="computedTitle" />.
    </slot>
  </ProseCallout>
</template>
