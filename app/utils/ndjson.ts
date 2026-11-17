/** Reads an NDJSON stream of events, or throws the error a failed request answered with. */
export async function readEvents<T>(response: Response, onEvent: (event: T) => void, fallbackMessage: string) {
  if (!response.ok || !response.body) {
    const body = await response.json().catch(() => null)
    throw new Error(body?.message || fallbackMessage)
  }
  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader()
  let buffer = ''
  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    buffer += value
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''
    for (const line of lines) if (line.trim()) onEvent(JSON.parse(line))
  }
}
