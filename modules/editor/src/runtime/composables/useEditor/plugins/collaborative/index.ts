import { replaceAll } from '@milkdown/utils'
import { collaborative, collabServiceCtx } from '@milkdown/plugin-collaborative'
import { Doc } from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import { Ctx } from '@milkdown/ctx'
import type { Options } from '../../types'
import { setCursor } from './cursor'

let doc: Doc
let wsProvider: WebsocketProvider

export const joinRoom = (options: Options) => (ctx: Ctx) => {
  const wsUrl = useRuntimeConfig().public.ywsUrl
  const collabService = ctx.get(collabServiceCtx).bindCtx(ctx)
  const { key: room, markdown } = unref(options.content)

  // Disconnect
  collabService.disconnect()
  doc?.destroy()
  wsProvider?.destroy()

  // Connect
  doc = new Doc()
  wsProvider = new WebsocketProvider(wsUrl, room, doc)
  setCursor(wsProvider.awareness)
  collabService.bindDoc(doc).setAwareness(wsProvider.awareness)
  wsProvider.once('synced', (isSynced: boolean) => {
    if (isSynced) {
      collabService.applyTemplate(markdown).connect()
      replaceAll(markdown)(ctx)
    }
  })
}

export default collaborative
