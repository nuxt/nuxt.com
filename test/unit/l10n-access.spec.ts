import { describe, expect, it } from 'vitest'
import { consumeL10nSave, translatorsTeam } from '../../server/utils/l10n/access'

function memoryStore() {
  const values = new Map<string, unknown>()
  return {
    values,
    get: async (key: string) => values.get(key),
    set: async (key: string, value: number) => values.set(key, value)
  }
}

describe('consumeL10nSave', () => {
  it('should refuse saves past the hourly allowance, per user', async () => {
    const store = memoryStore()
    const now = Date.parse('2026-11-03T10:15:00Z')
    for (let index = 0; index < 60; index++) await consumeL10nSave(store, 'a', 1, now)
    await expect(consumeL10nSave(store, 'a', 1, now)).rejects.toMatchObject({ statusCode: 429 })
    await expect(consumeL10nSave(store, 'b', 1, now)).resolves.toBeUndefined()
    await expect(consumeL10nSave(store, 'a', 1, now + 3_600_000)).resolves.toBeUndefined()
  })

  it('should refuse saves past the hourly allowance of changed segments', async () => {
    const store = memoryStore()
    const now = Date.parse('2026-11-03T10:15:00Z')
    await consumeL10nSave(store, 'a', 500, now)
    await consumeL10nSave(store, 'a', 499, now)
    await expect(consumeL10nSave(store, 'a', 2, now)).rejects.toMatchObject({ statusCode: 429 })
    await expect(consumeL10nSave(store, 'a', 1, now)).resolves.toBeUndefined()
  })
})

describe('translatorsTeam', () => {
  it('should name the team of a locale', () => {
    expect(translatorsTeam('fr')).toBe('translators-fr')
  })
})
