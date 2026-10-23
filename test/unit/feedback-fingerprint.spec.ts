import type { H3Event } from 'h3'
import { describe, expect, it } from 'vitest'
import { feedbackFingerprint, fingerprintInput } from '../../server/utils/feedback'

const secret = 'a'.repeat(64)
const userAgent = 'Mozilla/5.0 (Macintosh) Chrome/140'

function event(headers: Record<string, string>): H3Event {
  return { context: {}, node: { req: { headers, socket: {} } } } as unknown as H3Event
}

async function fingerprintFor(headers: Record<string, string>): Promise<string | undefined> {
  const input = fingerprintInput(event(headers))
  return input && await feedbackFingerprint(secret, input)
}

describe('feedback fingerprint', () => {
  it('differs for two visitors with the same user agent on the same day', async () => {
    const a = await fingerprintFor({ 'x-forwarded-for': '203.0.113.7', 'user-agent': userAgent })
    const b = await fingerprintFor({ 'x-forwarded-for': '198.51.100.2', 'user-agent': userAgent })
    expect(a).toBeDefined()
    expect(a).not.toBe(b)
  })

  it('uses the first x-forwarded-for entry', async () => {
    const a = await fingerprintFor({ 'x-forwarded-for': '203.0.113.7, 10.0.0.1', 'user-agent': userAgent })
    const b = await fingerprintFor({ 'x-forwarded-for': '203.0.113.7', 'user-agent': userAgent })
    expect(a).toBe(b)
  })

  it('has no input without a client ip', () => {
    expect(fingerprintInput(event({ 'user-agent': userAgent }))).toBeUndefined()
  })

  it('is stable for the same visitor on the same day', async () => {
    const headers = { 'x-forwarded-for': '203.0.113.7', 'user-agent': userAgent }
    expect(await fingerprintFor(headers)).toBe(await fingerprintFor(headers))
  })

  it('rotates daily', async () => {
    const visitor = { day: '2026-01-15', ip: '203.0.113.7', userAgent }
    expect(await feedbackFingerprint(secret, visitor)).not.toBe(await feedbackFingerprint(secret, { ...visitor, day: '2026-01-16' }))
  })

  it('depends on the secret', async () => {
    const visitor = { day: '2026-01-15', ip: '203.0.113.7', userAgent }
    expect(await feedbackFingerprint(secret, visitor)).not.toBe(await feedbackFingerprint('b'.repeat(64), visitor))
  })
})
