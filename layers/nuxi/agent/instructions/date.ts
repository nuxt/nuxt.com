import { defineDynamic, defineInstructions } from 'eve/instructions'

/**
 * After the static `instructions.md`, so the date never breaks the cached prefix. Memoized per
 * turn: eve runs this before every model call, and the date only moves for a session open across
 * UTC midnight.
 */
export default defineDynamic(async (ctx) => {
  const today = await ctx.memo(ctx.turn?.id ?? null, async () =>
    new Date().toLocaleDateString('en-US', { timeZone: 'UTC' })
  )
  return defineInstructions({
    content: `**Today's date:** ${today} (UTC). Use it for recency — do not assume an older year when formulating web searches or answers.`
  })
})
