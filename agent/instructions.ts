import { defineDynamic, defineInstructions } from 'eve/instructions'
import { buildInstructionsWithDate } from './lib/base-instructions.js'

export default defineDynamic({
  events: {
    'session.started': async () => {
      return defineInstructions({
        markdown: buildInstructionsWithDate()
      })
    }
  }
})
