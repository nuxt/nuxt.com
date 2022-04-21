<template>
  <div>
    <DocusEditor
      v-model="value"
      :components="components || []"
      :plugins="plugins"
      class="flex flex-col flex-1"
    />
  </div>
</template>

<script setup lang="ts">
const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  components: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue'])

const value = computed({
  get () {
    return props.modelValue
  },
  set (value) {
    emit('update:modelValue', value)
  }
})

const plugins = []
</script>
