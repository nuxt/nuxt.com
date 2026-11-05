/** Raycast returns credentials to its one-shot listener on the user's machine. */
export function raycastReturnTo(value: unknown): string | undefined {
  if (typeof value !== 'string' || value.length > 2048 || !/^http:\/\/(?:127\.0\.0\.1|localhost):\d{1,5}\/external-agents\/sign-in\/[\w.~-]+$/.test(value)) return
  try {
    const url = new URL(value)
    if (url.port === '0') return
    return value
  } catch {
    return
  }
}
