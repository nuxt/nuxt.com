import { computed, onScopeDispose, ref, watch, type MaybeRefOrGetter, toValue } from 'vue'

export const streamWordSegmenter = new Intl.Segmenter(undefined, { granularity: 'word' })

/** Reveal whole words, and wait for content before showing Markdown block markers. */
function nextTextBoundary(text: string, position: number, budget: number, complete: boolean): number {
  const target = Math.min(text.length, position + budget)
  let end = position
  for (const word of streamWordSegmenter.segment(text.slice(position))) {
    const boundary = position + word.index + word.segment.length
    if (boundary === text.length && word.isWordLike && !complete) break
    end = boundary
    if (end >= target) break
  }

  const citationStart = text.indexOf(':source-link{', position)
  if (citationStart >= 0 && citationStart < end) {
    const citationEnd = text.indexOf('}', citationStart)
    if (citationEnd >= 0) return citationEnd + 1
    if (!complete) return Math.max(position, citationStart)
  }

  const candidate = text.slice(0, end)
  const lineStart = candidate.lastIndexOf('\n') + 1
  if (/^\s*(?:#{1,6}|[-+*>]|\d+[.)]|`{1,3}|~{1,3})\s*$/u.test(candidate.slice(lineStart)) && !complete) {
    end = lineStart
  }

  // A link's label must not appear as plain text then jump when its URL arrives.
  let codeDelimiter = ''
  let linkStart = -1
  let labelEnd = -1
  let bracketDepth = 0
  for (const match of text.matchAll(/\\[\s\S]|`+|\[|\]|\n[ \t]*\n/g)) {
    if (match.index >= end && bracketDepth === 0) break
    if (match[0].startsWith('`')) {
      if (!codeDelimiter) codeDelimiter = match[0]
      else if (codeDelimiter === match[0]) codeDelimiter = ''
    } else if (!codeDelimiter && match[0].startsWith('\n')) {
      bracketDepth = 0
      linkStart = labelEnd = -1
    } else if (!codeDelimiter && match[0] === '[') {
      if (bracketDepth++ === 0) {
        linkStart = match.index
        labelEnd = -1
      }
    } else if (!codeDelimiter && match[0] === ']' && bracketDepth > 0 && --bracketDepth === 0) {
      labelEnd = match.index
    }
  }
  const couldBeLink = labelEnd < 0 || labelEnd + 1 === text.length || text[labelEnd + 1] === '('
  if (linkStart >= 0 && couldBeLink) {
    let linkEnd = -1
    let parenthesisDepth = 0
    let delimiter = ''
    let ruledOut = false
    if (labelEnd >= 0 && text[labelEnd + 1] === '(') {
      for (const match of text.slice(labelEnd + 1).matchAll(/\\[^\r\n]|[()<>"']|\r?\n[ \t]*\r?\n|[\r\n]/g)) {
        const token = match[0]
        // Blank lines end any link; angle destinations also forbid single line endings.
        if ((token.startsWith('\n') || token.startsWith('\r')) && (delimiter === '>' || token.length > 1)) {
          ruledOut = true
          break
        }
        if (token.startsWith('\\')) continue
        if (delimiter) {
          if (token === delimiter) delimiter = ''
          continue
        }
        if (token === '<' && !text.slice(labelEnd + 2, labelEnd + 1 + match.index).trim()) delimiter = '>'
        else if ((token === '"' || token === '\'') && parenthesisDepth === 1 && /\s/u.test(text[labelEnd + match.index] ?? '')) delimiter = token
        else if (token === '(') parenthesisDepth++
        else if (token === ')' && --parenthesisDepth === 0) {
          linkEnd = labelEnd + 1 + match.index
          break
        }
      }
    }
    if (linkEnd >= 0) end = Math.max(end, linkEnd + 1)
    else if (!complete && !ruledOut) end = Math.min(end, linkStart > 0 && candidate[linkStart - 1] === '!' ? linkStart - 1 : linkStart)
  }
  const emptyFence = /(?:^|\n)[ \t]*(?:`{3}|~{3})[^\n]*(?:\n[ \t]*)?$/u.exec(candidate)
  if (!complete && emptyFence) end = Math.min(end, emptyFence.index)
  return Math.max(position, end)
}

export function useStreamedText(value: MaybeRefOrGetter<string>, streaming: MaybeRefOrGetter<boolean>, animate = false) {
  const reducedMotion = usePreferredReducedMotion()
  const text = ref((toValue(streaming) || animate) && reducedMotion.value !== 'reduce' ? '' : toValue(value))
  const pending = computed(() => toValue(streaming) || text.value !== toValue(value))
  let frame = 0
  let lastTime = 0
  let charactersPerSecond = 90

  function tick(time: number) {
    frame = 0
    const source = toValue(value)
    const elapsed = Math.min(time - lastTime || 32, 64)
    if (elapsed < 32) {
      frame = requestAnimationFrame(tick)
      return
    }
    lastTime = time
    // Catch up to bursts within ~240ms, including short replies that finish in one chunk.
    const budget = Math.max(1, Math.ceil(charactersPerSecond * elapsed / 1000))
    const previousLength = text.value.length
    const end = nextTextBoundary(source, previousLength, budget, !toValue(streaming))
    text.value = source.slice(0, end)
    if (text.value !== source && end > previousLength) frame = requestAnimationFrame(tick)
  }

  watch([() => toValue(value), () => toValue(streaming), reducedMotion], ([source, active, motion], previous) => {
    if (typeof requestAnimationFrame === 'undefined' || motion === 'reduce') {
      if (frame) cancelAnimationFrame(frame)
      frame = 0
      text.value = source
      return
    }
    // Rewrites and loaded history should replace immediately; only appended live text is paced.
    if (!source.startsWith(text.value) || (!active && !previous?.[1] && !frame && (previous?.length || !animate))) {
      text.value = source
    }
    if (text.value !== source && !frame) {
      lastTime = 0
      frame = requestAnimationFrame(tick)
    }
    charactersPerSecond = Math.max(90, (source.length - text.value.length) / (active ? 0.24 : 0.18))
  }, { immediate: true })

  onScopeDispose(() => {
    if (frame) cancelAnimationFrame(frame)
  })
  return { text, pending }
}
