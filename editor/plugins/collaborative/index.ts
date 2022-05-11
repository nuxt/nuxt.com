import { collaborative, y } from '@milkdown/plugin-collaborative'
import { Doc } from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import { setCursor } from './cursor'

const doc: Doc = new Doc()
let wsProvider: WebsocketProvider

export default (room: string) => {
  wsProvider = new WebsocketProvider(useRuntimeConfig().public.ywsUrl, room, doc)
  setCursor(wsProvider.awareness)
  return collaborative.configure(y, { doc, awareness: wsProvider.awareness })
}

export const switchRoom = async (room: string) => {
  if (!wsProvider) { return }

  // Disconnect current room
  wsProvider.disconnect()

  // Set new room url for new connection
  const roomUrl = `${useRuntimeConfig().public.ywsUrl}/${room}`
  wsProvider.bcChannel = roomUrl
  wsProvider.url = roomUrl

  // Connect to the new room and await for synced status
  await new Promise<void>((resolve) => {
    const onSync = (synced: boolean) => {
      if (!synced) { return }
      wsProvider.off('sync', onSync)
      resolve()
    }

    wsProvider.on('sync', onSync)
    wsProvider.connect()
  })
}
