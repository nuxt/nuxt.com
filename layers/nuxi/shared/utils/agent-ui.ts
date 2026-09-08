export const AGENT_CHAT_THEME = {
  prose: {
    p: { base: 'my-2 text-sm/6' },
    li: { base: 'my-0.5 text-sm/6' },
    ul: { base: 'my-2' },
    ol: { base: 'my-2' },
    h1: { base: 'text-xl mb-4' },
    h2: { base: 'text-lg mt-6 mb-3' },
    h3: { base: 'text-base mt-4 mb-2' },
    h4: { base: 'text-sm mt-3 mb-1.5' },
    code: { base: 'text-xs' },
    pre: { root: 'my-2 max-w-full overflow-x-auto', base: 'text-xs/5' },
    table: { root: 'my-2' },
    hr: { base: 'my-4' }
  }
} as const

export const AGENT_USER_MESSAGE_UI = {
  content: 'px-3 py-1.5 min-h-fit min-w-0 w-fit max-w-full',
  container: 'pb-3'
} as const

export const AGENT_USER_MESSAGE_UI_COMPACT = {
  content: 'min-w-0 w-fit max-w-full'
} as const
