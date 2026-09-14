/**
 * Named phase timings for one revalidate webhook run.
 */
export interface Timings {
  /** Time a sync or async `fn` under `label`; records its duration and returns its result. */
  time<T>(label: string, fn: () => T | Promise<T>): Promise<T>
  /** `label=123ms label2=45ms`, in recorded order — for one log line. */
  format(): string
  /** ms since this recorder was created — spans the sync response and the background `waitUntil` phase. */
  since(): number
}

export function createTimings(): Timings {
  const start = performance.now()
  const entries: { label: string, ms: number }[] = []

  async function time<T>(label: string, fn: () => T | Promise<T>): Promise<T> {
    const phaseStart = performance.now()
    try {
      return await fn()
    } finally {
      entries.push({ label, ms: Math.round(performance.now() - phaseStart) })
    }
  }

  function format(): string {
    return entries.map(({ label, ms }) => `${label}=${ms}ms`).join(' ')
  }

  return { time, format, since: () => Math.round(performance.now() - start) }
}
