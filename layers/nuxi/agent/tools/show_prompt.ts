import { defineTool } from 'eve/tools'
import { z } from 'zod'
import { buildIdeDeeplinks, MAX_PROMPT_LENGTH, normalizeRepo, truncatePrompt } from '../../shared/utils/ide-deeplinks.js'

const repoSchema = z.string().regex(/^[a-zA-Z0-9-]+\/[a-zA-Z0-9-_.]+$/, 'Must be owner/name (e.g. nuxt/nuxt)').optional()

export default defineTool({
  description: 'Display an actionable prompt card with deeplinks to open the prompt in Cursor or Claude Code. Proactively offer this when a ready IDE prompt would help the user add, modify, remove, or configure something in their codebase — the user does not need to ask for a prompt explicitly. Good after explaining how to do something, diagnosing errors, migrations, refactors, or module setup. Do NOT use for pure doc answers or nuxt.com navigation. The prompt must be self-contained (context, likely files, concrete steps). Pass repo when the target GitHub repository is known (e.g. nuxt/nuxt, or a module repo from show_module).',
  inputSchema: z.object({
    description: z.string().max(120).describe('Short label shown on the card (max 120 chars)'),
    prompt: z.string().min(1).max(MAX_PROMPT_LENGTH).describe('Full self-contained prompt for the IDE agent'),
    repo: repoSchema.describe('GitHub owner/name for Claude Code repo resolution (optional)'),
    icon: z.string().optional().describe('Optional icon (e.g. i-lucide-wrench)')
  }),
  async execute({ description, prompt, repo, icon }) {
    const normalizedPrompt = truncatePrompt(prompt)
    const normalizedRepo = normalizeRepo(repo)

    return {
      description: description.trim(),
      prompt: normalizedPrompt,
      ...(normalizedRepo ? { repo: normalizedRepo } : {}),
      ...(icon?.trim() ? { icon: icon.trim() } : {}),
      deeplinks: buildIdeDeeplinks(normalizedPrompt, normalizedRepo)
    }
  }
})
