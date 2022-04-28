import { prosePluginsCtx } from '@milkdown/core'
import type { Ctx } from '@milkdown/ctx'
import { collaborative, y } from '@milkdown/plugin-collaborative'
import { unref, Ref } from 'vue'
import { Doc } from 'yjs'
import { yCursorPlugin, yCursorPluginKey } from 'y-prosemirror'
import { WebsocketProvider } from 'y-websocket'
import type { User } from '~/types'

let doc: Doc
let wsProvider: WebsocketProvider

const useRoom = (room: string) => {
  doc = doc || new Doc()
  wsProvider && wsProvider.destroy()
  wsProvider = new WebsocketProvider('ws://localhost:1234', room, doc)
  wsProvider.awareness.setLocalStateField('user', {
    name: unref(useStrapiUser() as Ref<User>).username
  })
  return { doc, awareness: wsProvider.awareness }
}

export default (room: string) => {
  const { doc, awareness } = useRoom(room)
  return collaborative.configure(y, { doc, awareness })
}

export const setRoom = (room: string) => (ctx: Ctx) => {
  const plugins = ctx.get(prosePluginsCtx)
  const index = plugins.findIndex(plugin => (plugin as any).key === (yCursorPluginKey as any).key)
  const { awareness } = useRoom(room)
  plugins.splice(index, 1, yCursorPlugin(awareness))
}
