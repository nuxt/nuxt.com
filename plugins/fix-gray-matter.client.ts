import { Buffer } from 'buffer'

// TODO: remove this fix when https://github.com/jonschlinkert/gray-matter/pull/132 is merged
// `Buffer` is not globally available
export default defineNuxtPlugin(() => {
  Object.assign(window, { Buffer })
})
