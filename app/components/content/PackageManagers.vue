<template>
  <CodeGroup ref="codeGroupRef">
    <ContentSlot :use="$slots.default" />
  </CodeGroup>
</template>

<script setup lang="ts">
const codeGroupRef = ref(null)
const slots = useSlots()
const defaultPackageManager = useLocalStorage('defaultPackageManager', 'npm')

watch(
  () => codeGroupRef.value?.selectedIndex,
  newIndex => updateSelection(newIndex)
)

const getPackageManager = (index: number) => {
  return slots.default()[index].props.filename
}

const getIndex = (name: string): number => {
  for (const [index, slot] of slots.default().entries()) {
    if (slot.props.filename === name) return index
  }
  return 0
}

const updateSelection = (newIndex: number) => {
  if (!slots.default()) return
  defaultPackageManager.value = getPackageManager(newIndex)
  window.dispatchEvent(
    new CustomEvent('default-package-manager-changed', {
      detail: {
        value: defaultPackageManager.value
      }
    })
  )
}

onMounted(() => {
  codeGroupRef.value.selectedIndex = getIndex(defaultPackageManager.value)
  window.addEventListener('default-package-manager-changed', (event) => {
    if (codeGroupRef.value) {
      codeGroupRef.value.selectedIndex = getIndex(event.detail.value)
    }
  })
})
</script>
