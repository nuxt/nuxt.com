<script setup lang="ts">
import { L10N_STRINGS } from '#shared/utils/l10n'

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

const locale = useDocsLocale()
const label = computed(() => locale.value ? L10N_STRINGS[locale.value].readMore : { before: 'Read more in ', after: '.' })

const computedTitle = computed<string>(() => props.title || createBreadcrumb(props.to))
</script>

<template>
  <ProseCallout icon="i-lucide-bookmark" :to="to" :aria-label="computedTitle" v-bind="calloutAttrs">
    <slot mdc-unwrap="p">
      {{ label.before }}<span class="font-bold" v-bind="titleAttrs" v-text="computedTitle" />{{ label.after }}
    </slot>
  </ProseCallout>
</template>
