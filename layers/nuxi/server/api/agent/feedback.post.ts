import { createError } from 'evlog'
import { z } from 'zod'
import { asc, eq } from 'drizzle-orm'

const LINEAR_API = 'https://api.linear.app/graphql'
const MAX_TRANSCRIPT_CHARS = 3000

const bodySchema = z.object({
  chatId: z.string().min(1),
  title: z.string().min(1).max(80),
  summary: z.string().min(1),
  userFeedback: z.string().max(2000).optional()
})

type MessagePart = { type: string, text?: string }
type StoredMessage = { id: string, role: string, parts: MessagePart[] }

function extractText(parts: MessagePart[]): string {
  return parts
    .filter(p => p.type === 'text' && p.text)
    .map(p => p.text!.trim())
    .join(' ')
}

function buildTranscript(messages: StoredMessage[]): string {
  const lines: string[] = []
  for (const msg of messages) {
    const role = msg.role === 'user' ? 'User' : 'Agent'
    const text = extractText(msg.parts)
    if (text) lines.push(`**${role}:** ${text}`)
  }
  const full = lines.join('\n\n')
  if (full.length <= MAX_TRANSCRIPT_CHARS) return full
  return full.slice(0, MAX_TRANSCRIPT_CHARS) + '\n\n_…conversation truncated_'
}

function buildIssueBody(params: {
  summary: string
  userFeedback?: string
  transcript: string
  chatId: string
  createdAt: Date
}): string {
  const sections: string[] = []

  if (params.userFeedback?.trim()) {
    sections.push(`## User feedback\n\n${params.userFeedback.trim()}`)
  }

  sections.push(`## Summary\n\n${params.summary}`)

  const meta = [
    `**Chat ID:** \`${params.chatId}\``,
    `**Date:** ${params.createdAt.toISOString()}`
  ].join('\n')

  sections.push(`## Metadata\n\n${meta}`)

  if (params.transcript) {
    sections.push(`## Conversation transcript\n\n${params.transcript}`)
  }

  return sections.join('\n\n---\n\n')
}

export default defineEventHandler(async (event) => {
  const { chatId, title, summary, userFeedback } = await readValidatedBody(event, bodySchema.parse)

  const { user } = await requireUserSession(event)
  const log = useLogger(event)

  const [chat] = await db
    .select({
      id: schema.chats.id,
      userId: schema.chats.userId,
      createdAt: schema.chats.createdAt
    })
    .from(schema.chats)
    .where(eq(schema.chats.id, chatId))
    .limit(1)

  if (!chat || chat.userId !== user.id) {
    throw createError({ message: 'Forbidden', status: 403, why: 'You do not own this chat.' })
  }

  log.set({
    user: { id: user.id, authenticated: true },
    feedback: { chatId, title, hasUserFeedback: !!userFeedback }
  })

  const { apiKey, teamId, projectId } = useRuntimeConfig(event).linear
  if (!apiKey || !teamId || !projectId) {
    throw createError({ message: 'Linear integration not configured', status: 503, why: 'The NUXT_LINEAR_API_KEY, NUXT_LINEAR_TEAM_ID, or NUXT_LINEAR_PROJECT_ID environment variables are missing.' })
  }

  const storedMessages = await db
    .select({
      id: schema.messages.id,
      role: schema.messages.role,
      parts: schema.messages.parts
    })
    .from(schema.messages)
    .where(eq(schema.messages.chatId, chat.id))
    .orderBy(asc(schema.messages.createdAt))

  const transcript = buildTranscript(storedMessages as StoredMessage[])
  const description = buildIssueBody({ summary, userFeedback, transcript, chatId, createdAt: chat.createdAt })

  const mutation = `
    mutation IssueCreate($input: IssueCreateInput!) {
      issueCreate(input: $input) {
        success
        issue { id url }
      }
    }
  `

  const response = await $fetch<{
    data: { issueCreate: { success: boolean, issue: { id: string, url: string } } }
  }>(LINEAR_API, {
    method: 'POST',
    headers: {
      'Authorization': apiKey,
      'Content-Type': 'application/json'
    },
    body: {
      query: mutation,
      variables: {
        input: {
          teamId,
          projectId,
          title: `[Agent] ${title}`,
          description
        }
      }
    }
  })

  const issue = response.data?.issueCreate?.issue
  if (!issue?.url) {
    throw createError({ message: 'Failed to create Linear issue', status: 500, why: 'The Linear API did not return an issue URL.' })
  }

  log.set({ linear: { issueUrl: issue.url } })

  return { url: issue.url }
})
