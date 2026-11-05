/**
 * The size of the Nuxter card of /nuxters in every state (signed out, loading, signed in), from the width
 * of its container: the signed-in card wraps below 520px. Measured on the signed-in card with badges and
 * all actions; the hero stays still while the session and the stats load. Needs an `@container` parent.
 */
export const NUXTERS_ME_CARD_CLASS = 'w-full min-h-[29rem] @min-[400px]:min-h-[25.75rem] @min-[460px]:min-h-[24.25rem] @min-[520px]:min-h-[22rem]'
