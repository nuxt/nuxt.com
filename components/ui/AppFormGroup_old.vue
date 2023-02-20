<template>
  <div>
    <div v-if="label || $slots.label" :class="labelWrapperClass">
      <label :for="name" :class="labelClass">
        <slot name="label">{{ label }}</slot>
        <span v-if="required" :class="requiredClass">*</span>
      </label>
      <span v-if="$slots.hint || hint" :class="hintClass">
        <slot name="hint">{{ hint }}</slot>
      </span>
    </div>
    <p v-if="description" :class="descriptionClass">
      {{ description }}
    </p>
    <div :class="!!label && containerClass">
      <slot />
      <p v-if="help" :class="helpClass">
        {{ help }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { uiPreset } from '../../ui/preset'

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
  required: {
    type: Boolean,
    default: false
  },
  help: {
    type: String,
    default: null
  },
  hint: {
    type: String,
    default: null
  },
  containerClass: {
    type: String,
    default: () => uiPreset.formGroup.container
  },
  labelClass: {
    type: String,
    default: () => uiPreset.formGroup.label
  },
  labelWrapperClass: {
    type: String,
    default: () => uiPreset.formGroup.labelWrapper
  },
  descriptionClass: {
    type: String,
    default: () => uiPreset.formGroup.description
  },
  requiredClass: {
    type: String,
    default: () => uiPreset.formGroup.required
  },
  hintClass: {
    type: String,
    default: () => uiPreset.formGroup.hint
  },
  helpClass: {
    type: String,
    default: () => uiPreset.formGroup.help
  }
})
</script>
