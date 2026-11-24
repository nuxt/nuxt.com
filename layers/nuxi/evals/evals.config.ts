import { defineEvalConfig } from 'eve/evals'

// These evals call Nuxi's real model, so results vary between runs. Use
// `pnpm eval:nuxi --repeat 3` before trusting a prompt change.
export default defineEvalConfig({
  // A decision model; eve's default judge isn't enabled on the nuxt.com AI Gateway team.
  judge: { model: 'openai/gpt-6-luna-decisions' },
  maxConcurrency: 4,
  timeoutMs: 180_000
})
