import type { Component, Ref } from 'vue'
import { createApp } from 'vue'

const container: Ref<HTMLElement | null> = ref(null)

let modal

function open (component: Component, props = {}) {
  // unmount previous modal
  if (modal) {
    modal.unmount()
  }

  modal = createApp(component, {
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
