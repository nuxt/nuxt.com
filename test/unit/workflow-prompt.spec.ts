import { readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  parseSinceDays,
  parseSinceHours,
  skillFirehoseWorkflowMessage,
  skillWorkflowMessage,
  workflowSkillId
} from '../../layers/nuxi/agent/lib/workflow/shared'

const SKILLS_DIR = fileURLToPath(new URL('../../layers/nuxi/agent/skills', import.meta.url))

const skillIds = readdirSync(SKILLS_DIR, { withFileTypes: true })
  .filter(entry => entry.isDirectory())
  .map(entry => entry.name)

describe.each([
  { name: 'days', parse: parseSinceDays, cap: 365 },
  { name: 'hours', parse: parseSinceHours, cap: 168 }
])('workflow $name window validation', ({ parse, cap }) => {
  it.each(['7.5', '7days', '1e2', '0x10', 'Infinity', '-1', '0', '9007199254740993'])('rejects the complete invalid input %s', (value) => {
    expect(parse(value).ok).toBe(false)
  })

  it('preserves omitted windows, integer inputs, whitespace and the existing cap', () => {
    for (const value of [null, undefined, '', '  ']) expect(parse(value)).toEqual({ ok: true, value: undefined })
    expect(parse(' 7 ')).toEqual({ ok: true, value: 7 })
    expect(parse('1000')).toEqual({ ok: true, value: cap })
  })
})

describe('workflowSkillId', () => {
  it('reads back every skill a schedule can dispatch', () => {
    expect(skillIds.length).toBeGreaterThan(0)

    for (const skillId of skillIds) {
      expect(workflowSkillId(skillWorkflowMessage(skillId, 7))).toBe(skillId)
      expect(workflowSkillId(skillWorkflowMessage(skillId))).toBe(skillId)
      expect(workflowSkillId(skillFirehoseWorkflowMessage(skillId, 24, 'nuxt-firehose'))).toBe(skillId)
    }
  })

  it('only mentions a time window when one is given', () => {
    expect(skillWorkflowMessage('weekly-digest', 7)).toMatch(/^Load the `weekly-digest` skill and follow it for the last 7 days\.\n/)
    expect(skillWorkflowMessage('showcase-check')).toMatch(/^Load the `showcase-check` skill and follow it\.\n/)
  })

  it('survives the prompt being serialised as message parts', () => {
    const content = JSON.stringify([{ type: 'text', text: skillWorkflowMessage('weekly-digest', 7) }])
    expect(workflowSkillId(content)).toBe('weekly-digest')
  })

  it('ignores prompts that dispatch no skill', () => {
    expect(workflowSkillId('How do I configure Nuxt runtime config?')).toBeUndefined()
  })
})
