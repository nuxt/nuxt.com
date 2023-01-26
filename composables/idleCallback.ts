export const requestIdleCallback =
  globalThis.requestIdleCallback ||
  function (cb: IdleRequestCallback) {
    const start = Date.now()
    const idleDeadline = {
      didTimeout: false,
      timeRemaining () {
        return Math.max(0, 50 - (Date.now() - start))
      }
    }
    return setTimeout(function () {
      cb(idleDeadline)
    }, 1)
  }
