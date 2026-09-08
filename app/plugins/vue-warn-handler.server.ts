export default defineNuxtPlugin((nuxtApp) => {
  if (import.meta.dev) {
    nuxtApp.vueApp.config.warnHandler = (msg, vm, trace) => {
      console.warn(`[Vue warn]: ${msg}${trace ? trace.split('\n').slice(0, 5).join('\n') : ''}`)
    }
    nuxtApp.vueApp.config.errorHandler = (msg, vm, trace) => {
      console.error(`[Vue error]: ${msg}${trace ? trace.split('\n').slice(0, 5).join('\n') : ''}`)
    }
  }
})
