import { io } from 'socket.io-client'

class SocketIO {
  socket = null

  connect () {
    const config = useRuntimeConfig().public
    const token = useStrapiToken()

    if (!token.value) {
      return
    }

    if (this.socket && this.socket.connected) {
      return
    }

    this.socket = io(config.strapi.url, {
      auth: {
        token: `Bearer ${token.value}`
      },
      transports: ['websocket', 'polling']
    })
  }

  disconnect () {
    if (this.socket) {
      this.socket.disconnect()
    }
  }

  emit (event, data) {
    if (!this.socket) {
      return
    }

    return this.socket.emit(event, data)
  }

  on (event, fn) {
    if (!this.socket) {
      return
    }

    return this.socket.on(event, fn)
  }

  off (event, fn) {
    if (!this.socket) {
      return
    }

    return this.socket.off(event, fn)
  }
}

export default defineNuxtPlugin(() => {
  const user = useStrapiUser()
  const socket = new SocketIO()

  watch(user, () => {
    if (!user.value) {
      return socket.disconnect()
    }

    socket.connect()
  }, { immediate: true })

  return {
    provide: {
      socket: new SocketIO()
    }
  }
})
