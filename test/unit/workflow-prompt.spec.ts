import { readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  skillFirehoseWorkflowMessage,
  skillWorkflowMessage,
  workflowSkillId
} from '../../layers/nuxi/agent/lib/workflows'

const SKILLS_DIR = fileURLToPath(new URL('../../layers/nuxi/agent/skills', import.meta.url))

const skillIds = readdirSync(SKILLS_DIR, { withFileTypes: true })
  .filter(entry => entry.isDirectory())
  .map(entry => entry.name)

describe('workflowSkillId', () => {
  it('reads back every skill a schedule can dispatch', () => {
    expect(skillIds.length).toBeGreaterThan(0)

    for (const skillId of skillIds) {
      expect(workflowSkillId(skillWorkflowMessage(skillId, 7))).toBe(skillId)
      expect(workflowSkillId(skillFirehoseWorkflowMessage(skillId, 24, 'nuxt-firehose'))).toBe(skillId)
    }
  })

  it('survives the prompt being serialised as message parts', () => {
    const content = JSON.stringify([{ type: 'text', text: skillWorkflowMessage('weekly-digest', 7) }])
    expect(workflowSkillId(content)).toBe('weekly-digest')
  })

  it('ignores prompts that dispatch no skill', () => {
    expect(workflowSkillId('How do I configure Nuxt runtime config?')).toBeUndefined()
  })
})
