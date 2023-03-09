<template>
  <div :class="wrapperClass">
    <textarea
      :id="name"
      ref="textarea"
      class="app-textarea"
      :value="modelValue"
      :name="name"
      :rows="rows"
      :required="required"
      :disabled="disabled"
      :placeholder="placeholder"
      :autocomplete="autocomplete"
      @input="onInput(($event.target as any).value)"
      @focus="$emit('focus', $event)"
      @blur="$emit('blur', $event)"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, nextTick } from 'vue'

const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: ''
  },
  name: {
    type: String,
    required: true
  },
  placeholder: {
    type: String,
    default: null
  },
  required: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  },
  rows: {
    type: Number,
    default: 3
  },
  autoresize: {
    type: Boolean,
    default: false
  },
  autofocus: {
    type: Boolean,
    default: false
  },
  autocomplete: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['update:modelValue', 'focus', 'blur'])

const textarea = ref<HTMLTextAreaElement | null>(null)

const autoFocus = () => {
  if (props.autofocus) {
    textarea.value?.focus()
  }
}

const autoResize = () => {
  if (props.autoresize) {
    if (!textarea.value) {
      return
    }

    textarea.value.rows = props.rows

    const styles = window.getComputedStyle(textarea.value)
    const paddingTop = parseInt(styles.paddingTop)
    const paddingBottom = parseInt(styles.paddingBottom)
    const padding = paddingTop + paddingBottom
    const lineHeight = parseInt(styles.lineHeight)
    const { scrollHeight } = textarea.value
    const newRows = (scrollHeight - padding) / lineHeight

    if (newRows > props.rows) {
      textarea.value.rows = newRows
    }
  }
}

const onInput = (value: string) => {
  autoResize()

  emit('update:modelValue', value)
}

watch(() => props.modelValue, () => {
  nextTick(autoResize)
})

onMounted(() => {
  setTimeout(() => {
    autoFocus()
    autoResize()
  }, 100)
})
</script>

<style lang="ts" scoped>
css({
  '.app-textarea-wrapper': {
    position: 'relative'
  },
  '.app-textarea': {
    position: 'relative',
    display: 'block',
    width: '{size.full}',
    fontSize: '{fontSize.base}',
    px: '{size.24}',
    py: '{size.12}',
    borderWidth: '{size.1}',
    borderColor: '{color.gray.200}',
    borderRadius: '{radii.md}',
    boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    background: '{color.white}',
    flex: '1 1 0%',

    '@dark': {
      borderColor: '{color.gray.800}',
      backgroundColor: '{color.gray.900}'
    },

    '&:disabled': {
      cursor: 'not-allowed',
      opacity: '0.75'
    },

    '&:focus': {
      outline: 'none',
      ringOffsetColor: '{color.gray.900}',
      ringColor: '{color.gray.900}',
      borderColor: '{color.gray.900}',
      ring: '-2px',
      ringOffset: '1px',

      '@dark': {
        ringColor: '{color.gray.100}',
        borderColor: '{color.gray.100}',
        ringOffsetColor: '{color.black}'
      }
    },
  },
})
</style>
