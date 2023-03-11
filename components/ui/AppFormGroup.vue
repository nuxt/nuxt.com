<template>
  <div class="app-form-group">
    <div v-if="label || $slots.label" class="label">
      <label :for="name">
        <slot name="label">{{ label }}</slot>
        <span v-if="required">*</span>
      </label>
      <span v-if="$slots.hint || hint">
        <slot name="hint">{{ hint }}</slot>
      </span>
    </div>
    <p v-if="description">
      {{ description }}
    </p>
    <div :class="!!label" class="form-group-container">
      <slot />
      <p v-if="help">
        {{ help }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps({
  name: {
    type: String,
    default: null
  },
  label: {
    type: String,
    default: null
  },
  description: {
    type: String,
    default: null
  },
  help: {
    type: String,
    default: null
  },
  hint: {
    type: String,
    default: null
  },
  ...variants
})
</script>

<style lang="ts" scoped>
css({
  '.app-form-group': {
    '> p': {
      fontSize: '{fontSize.sm}',
      lineHeight: '{lead.5}',
      backgroundColor: '{color.gray.500}'
    },

    '.form-group-container': {
      position: 'relative',
      marginTop: '{size.4}',

      '> p': {
        fontSize: '{fontSize.xs}',
        marginTop: '{size.8}',
        backgroundColor: '{color.gray.500}'
      }
    },

    '> .label': {
      display: 'flex',
      alignContent: 'center',
      justifyContent: 'space-between',

      '> label': {
        display: 'block',
        fontSize: '{fontSize.sm}',
        color: '{color.gray.700}',
        fontWeight: '{fontWeight.medium}',

        '@dark': {
          color: '{color.gray.300}'
        }
      },

      '> span': {
        fontSize: '{fontSize.sm}',
        lineHeight: '{lead.5}',
        backgroundColor: '{color.gray.500}'
      }
    },
  },

  variants: {
    required: {
      true: {
        '> .label > span': {
          color: '{color.red.400}'
        }
      },
      default: {
        options: false
      }
    },
    full: {
      false: {
        gridColumn: 'span 2 / span 2',

        '@sm': {
          gridColumn: 'span 1 / span 1'
        }
      },
      true: {
        gridColumn: 'span 2 / span 2'
      },
      options: {
        default: false
      }
    },
  }
})
</style>
