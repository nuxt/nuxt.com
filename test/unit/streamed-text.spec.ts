import { effectScope, nextTick, ref } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useStreamedText } from '../../layers/nuxi/app/composables/useStreamedText'

afterEach(() => vi.unstubAllGlobals())

function setup(initial: string) {
  const source = ref(initial)
  const frames = new Map<number, FrameRequestCallback>()
  let id = 0
  let time = 0
  vi.stubGlobal('usePreferredReducedMotion', () => ref('no-preference'))
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    frames.set(++id, callback)
    return id
  })
  vi.stubGlobal('cancelAnimationFrame', (key: number) => frames.delete(key))
  const scope = effectScope()
  const stream = scope.run(() => useStreamedText(source, () => true))!
  function drain() {
    for (let count = 0; frames.size && count < 200; count++) {
      const callbacks = [...frames.values()]
      frames.clear()
      time += 32
      callbacks.forEach(callback => callback(time))
    }
    expect(frames.size).toBe(0)
  }
  return { source, stream, drain, stop: () => scope.stop() }
}

describe('streamed text', () => {
  it.each([
    'Use items[0] to read the first entry.',
    'Read [draft\n\nUse items[0] here.',
    'Read [draft\n \t\nContinue in a new paragraph.',
    'Use `items[0]` to read the first entry.',
    'Use `items[0` while explaining incomplete code.',
    'A bracket can be escaped: \\[example.'
  ])('keeps revealing ordinary brackets while the turn is active: %s', (text) => {
    const replay = setup(text)
    try {
      replay.drain()
      expect(replay.stream.text.value).toBe(text)
    } finally {
      replay.stop()
    }
  })

  it.each([
    ['the guide', 'https://nuxt.com/docs'],
    ['the items[0] entry', 'https://nuxt.com/docs'],
    ['items[0]', '/docs/foo(bar)'],
    ['the guide', '/docs'],
    ['the guide', '</docs/foo(bar>'],
    ['the guide', '</docs/foo)bar>'],
    ['the guide', '/docs "Read ("'],
    ['the guide', '/docs "Read )"'],
    ['the guide', '/docs "Read (\nmore"'],
    ['the guide', '/docs \'Read (\''],
    ['the guide', '/docs/it\'s(here)']
  ])('waits for the full URL with label "%s" and destination "%s"', async (label, destination) => {
    const replay = setup(`Read [${label}](${destination}`)
    try {
      replay.drain()
      expect(replay.stream.text.value).toBe('Read ')
      replay.source.value += ').'
      await nextTick()
      replay.drain()
      expect(replay.stream.text.value).toBe(replay.source.value)
    } finally {
      replay.stop()
    }
  })

  it('releases a bracketed label once the following chunk rules out a link', async () => {
    const replay = setup('Use items[0]')
    try {
      replay.drain()
      replay.source.value += ' to read the first entry.'
      await nextTick()
      replay.drain()
      expect(replay.stream.text.value).toBe(replay.source.value)
    } finally {
      replay.stop()
    }
  })

  it.each(['\n\n', '\n \t\n'])('releases an unfinished destination at a paragraph boundary %j', async (boundary) => {
    const replay = setup('Read [guide](/docs')
    try {
      replay.drain()
      expect(replay.stream.text.value).toBe('Read ')
      replay.source.value += `${boundary}Next. `
      await nextTick()
      replay.drain()
      expect(replay.stream.text.value).toBe(replay.source.value)
      replay.source.value += 'Still streaming. '
      await nextTick()
      replay.drain()
      expect(replay.stream.text.value).toBe(replay.source.value)
    } finally {
      replay.stop()
    }
  })
  it.each(['\n', '\r\n', '\r'])('releases an angle destination invalidated by a line ending %j', (lineEnding) => {
    const text = `Read [guide](</docs)${lineEnding}Continue here. `
    const replay = setup(text)
    try {
      replay.drain()
      expect(replay.stream.text.value).toBe(text)
    } finally {
      replay.stop()
    }
  })
})
