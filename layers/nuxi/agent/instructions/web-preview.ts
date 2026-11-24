import { defineDynamic, defineInstructions } from 'eve/instructions'
import { resolveContext } from '../lib/identity/context.js'
import { APP_PREVIEW_INSTRUCTIONS } from '../tools/app-preview.js'

/** The live preview tools exist only in web chat (`tools/app-preview.ts`). */
export default defineDynamic(ctx =>
  resolveContext(ctx.session.auth.current).surface === 'web'
    ? defineInstructions({ content: APP_PREVIEW_INSTRUCTIONS })
    : null
)
