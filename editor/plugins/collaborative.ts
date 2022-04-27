import type { Ref } from 'vue'
import { collaborative, y } from '@milkdown/plugin-collaborative'
import { Doc } from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import type { User } from '~/types'

interface Options {
  room: string
}

export default (options: Options) => {
  const user = useStrapiUser() as Ref<User>

  const doc = new Doc()
  const wsProvider = new WebsocketProvider('ws://localhost:1234', options.room, doc)

  wsProvider.awareness.setLocalStateField('user', { name: user.value.username })

  return collaborative.configure(y, {
    doc,
    awareness: wsProvider.awareness
  })
}
