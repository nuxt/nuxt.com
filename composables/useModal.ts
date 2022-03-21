import { createApp } from 'vue'

const container = ref(null)

function open (component, props) {
  const modal = createApp(component, {
    ...props,
    onClose () {
      modal.unmount()
    }
  })
  modal.mount(container.value)
}

export const useModal = () => {
  return {
    container,
    open
  }
}
