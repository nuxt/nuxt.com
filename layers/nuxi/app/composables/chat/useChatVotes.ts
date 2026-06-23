import type { UIMessage } from 'ai'

export function useChatVotes(chatId: MaybeRefOrGetter<string>, immediate = false) {
  const toast = useToast()
  const chatIdValue = computed(() => toValue(chatId))

  const { data: voteRows } = useLazyFetch<ChatVoteRow[]>(
    () => `/api/chats/${chatIdValue.value}/votes`,
    {
      immediate,
      default: () => [] as ChatVoteRow[]
    }
  )

  const votes = ref(new Map<string, boolean>())

  watch(voteRows, (rows) => {
    const map = new Map<string, boolean>()
    for (const row of (rows ?? []) as ChatVoteRow[]) {
      map.set(row.messageId, row.isUpvoted)
    }
    votes.value = map
  }, { immediate: true })

  function getRows(): ChatVoteRow[] {
    return (voteRows.value ?? []) as ChatVoteRow[]
  }

  function getVote(messageId: string): boolean | null {
    const vote = votes.value.get(messageId)
    return vote === undefined ? null : vote
  }

  function vote(message: UIMessage, isUpvoted: boolean) {
    const current = votes.value.get(message.id)
    const next = current === isUpvoted ? undefined : isUpvoted
    const snapshot = new Map(votes.value)

    if (next === undefined) votes.value.delete(message.id)
    else votes.value.set(message.id, next)
    votes.value = new Map(votes.value)

    voteRows.value = next === undefined
      ? getRows().filter(row => row.messageId !== message.id)
      : [
          ...getRows().filter(row => row.messageId !== message.id),
          { chatId: chatIdValue.value, messageId: message.id, isUpvoted: next }
        ]

    $fetch(`/api/chats/${chatIdValue.value}/votes`, {
      method: 'POST',
      body: next === undefined
        ? { messageId: message.id }
        : { messageId: message.id, isUpvoted: next }
    }).catch(() => {
      votes.value = snapshot
      voteRows.value = [...snapshot.entries()].map(([messageId, isUpvoted]) => ({
        chatId: chatIdValue.value,
        messageId,
        isUpvoted
      }))
      toast.add({ description: 'Failed to save vote', icon: 'i-lucide-alert-circle', color: 'error' })
    })
  }

  return { votes, getVote, vote }
}
