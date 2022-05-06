import { collaborative, y } from '@milkdown/plugin-collaborative'
import { unref, Ref } from 'vue'
import { Doc } from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import type { User } from '~/types'

const doc: Doc = new Doc()
let wsProvider: WebsocketProvider

export default (room: string) => {
  wsProvider = new WebsocketProvider(useRuntimeConfig().public.ywsUrl, room, doc)
  wsProvider.awareness.setLocalStateField('user', {
    name: unref(useStrapiUser() as Ref<User>).username
  })
  return collaborative.configure(y, { doc, awareness: wsProvider.awareness })
}

export const getProvider = () => wsProvider

export const leaveRoom = () => {
  wsProvider.disconnect()
  wsProvider.doc.off('update', wsProvider._updateHandler)
}

export const joinRoom = (room: string) => {
  wsProvider.url = `${useRuntimeConfig().public.ywsUrl}/${room}`
  wsProvider.doc.on('update', wsProvider._updateHandler)
  wsProvider.connect()
}
