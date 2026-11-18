import { describe, expect, it } from 'vitest'
import { parseMarkdown } from 'comark'
import { stripFollowUpSuggestions } from '../../layers/nuxi/app/utils/ai'
import { surfaceInstructions } from '../../layers/nuxi/agent/lib/identity/surface-instructions'

describe('follow-up suggestions', () => {
  const suggestions = ':follow-ups{first="How can I debug hydration?" second="Can you show an example?"}'

  it('uses native Comark props for the suggested questions', async () => {
    const parsed = await parseMarkdown(`An answer.\n\n${suggestions}`)
    expect(parsed.nodes.at(-1)).toEqual(['follow-ups', {
      first: 'How can I debug hydration?', second: 'Can you show an example?'
    }])
  })

  it('copies the answer without the suggestion component', () => {
    expect(stripFollowUpSuggestions(`An answer.\n\n${suggestions}`)).toBe('An answer.')
    expect(stripFollowUpSuggestions('An answer.\n\n:follow-ups{first="Explain {{ name }}?"}')).toBe('An answer.')
  })

  it('preserves component syntax shown in a code sample', () => {
    const sample = `For example:\n\n\`\`\`md\n${suggestions}\n\`\`\``
    expect(stripFollowUpSuggestions(sample)).toBe(sample)
  })

  it('requests suggestions only for the web chat', () => {
    expect(surfaceInstructions('web')).toContain(':follow-ups{')
    for (const surface of ['slack', 'discord', 'schedule', 'cli'] as const) {
      expect(surfaceInstructions(surface) ?? '').not.toContain(':follow-ups{')
    }
  })
})
