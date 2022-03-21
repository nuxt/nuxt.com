import { createApp } from 'vue'

const container = ref(null)

export const useModal = () => {
  function open (component, props) {
    const modal = createApp(component, {
      ...props,
      onClose () {
        modal.unmount()
      }
    })
    modal.mount(container.value)
  }

  return {
    container,
    open
  }
}
