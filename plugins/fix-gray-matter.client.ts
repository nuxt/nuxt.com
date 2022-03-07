import { Buffer } from 'buffer'
import { defineNuxtPlugin } from '#imports'

// TODO: remove this fix when https://github.com/jonschlinkert/gray-matter/pull/132 is merged
// `Buffer` is not globally available
export default defineNuxtPlugin(() => {
  Object.assign(window, { Buffer })
})
