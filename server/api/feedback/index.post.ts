import type { H3Event } from 'h3'

export async function generateHash(
  today: string,
  ip: string,
  domain: string,
  userAgent: string
): Promise<string> {
  const data = `${today}+${domain}+${ip}+${userAgent}`

  const buffer = await crypto.subtle.digest(
    'SHA-1',
    new TextEncoder().encode(data)
  )

  return [...new Uint8Array(buffer)]
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

async function getFingerprint(event: H3Event): Promise<string> {
  const ip = event.context.cf?.ip || 'unknown'
  const userAgent = getHeader(event, 'user-agent') || 'unknown'
  const domain = getHeader(event, 'host') || 'localhost'
  const today = new Date().toISOString().split('T')[0]

  return generateHash(today, ip, domain, userAgent)
}

export default defineEventHandler(async (event: H3Event) => {
  const data: FeedbackInput = await readValidatedBody(event, feedbackSchema.parse)

  const drizzle = useDrizzle()
  const country = event.context.cf?.country || 'unknown'
  const fingerprint = await getFingerprint(event)

  await drizzle.insert(tables.feedback).values({
    rating: data.rating,
    feedback: data.feedback || null,
    path: data.path,
    title: data.title,
    stem: data.stem,
    country,
    fingerprint,
    createdAt: new Date(),
    updatedAt: new Date()
  }).onConflictDoUpdate({
    target: [tables.feedback.path, tables.feedback.fingerprint],
    set: {
      rating: data.rating,
      feedback: data.feedback || null,
      country,
      updatedAt: new Date()
    }
  })
})
