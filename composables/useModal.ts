import type { Component, Ref } from 'vue'
import { createApp } from 'vue'

const container: Ref<HTMLElement | null> = ref(null)

function open (component: Component, props = {}) {
  const modal = createApp(component, {
    ...props,
    onClose () {
      modal.unmount()
    }
  })
  modal.mount(container.value as HTMLElement)
}

export const useModal = () => {
  return {
    container,
    open
  }
}
