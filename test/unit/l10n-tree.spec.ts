import { mkdtemp, rm } from 'node:fs/promises'
import { readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { recordPath, writeManifest, writePolicy, writeRecord, type Manifest } from '@diglot/store'
import { defaultPolicy, policyFingerprint, snapshotPolicy, type TranslationRecord } from '@diglot/core'
import { gzipSync } from 'node:zlib'
import { createTar } from 'nanotar'
import { createStorage } from 'unstorage'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { createBundle } from '../../server/utils/l10n/bundle'
import { sourceCoverage } from '../../server/utils/l10n/coverage'
import { buildL10nSnapshot, readL10nSnapshot, writeL10nSnapshot } from '../../server/utils/l10n/snapshot'
import { parseTranslationsTarball, readTranslationsCheckout } from '../../server/utils/l10n/tree'

const fixture = (file: string) => JSON.parse(readFileSync(new URL(`../fixtures/l10n/${file}`, import.meta.url), 'utf8'))
const records = (fixture('fr.json') as { records: Record<string, TranslationRecord> }).records
const manifest = { ...fixture('manifest.json'), source: 'nuxt-4.x' } as Manifest
const SHA = 'c'.repeat(40)
const [first, second] = Object.keys(records) as [string, string]
const POLICY = { ...defaultPolicy, props: { ...defaultPolicy.props, 'read-more': ['to'] } }

/** A GitHub tarball of a translations repository holding the fixture records and manifest. */
function tarball(extra: Array<{ name: string, data: string }> = []) {
  const root = `translations-${SHA.slice(0, 7)}`
  const tar = createTar([
    { name: `${root}/` },
    { name: `${root}/README.md`, data: '# translations' },
    { name: `${root}/.diglot/manifest/nuxt-4.x.json`, data: JSON.stringify(manifest) },
    ...Object.values(records).map(record => ({ name: `${root}/${recordPath('fr', record.hash)}`, data: JSON.stringify(record) })),
    ...extra.map(({ name, data }) => ({ name: `${root}/${name}`, data }))
  ])
  // nanotar leaves out the end-of-archive blocks when the entries fill its last record
  return gzipSync(Buffer.concat([tar, new Uint8Array(1024)]))
}

describe('parseTranslationsTarball', () => {
  it('should read the records and manifests of a commit', async () => {
    const tree = await parseTranslationsTarball(await tarball(), SHA)
    expect(tree.sha).toBe(SHA)
    expect([...tree.records('fr').keys()].sort()).toEqual(Object.keys(records).sort())
    expect(tree.manifests.get('nuxt-4.x')?.files).toEqual(manifest.files)

    const bundle = createBundle(tree.records('fr'), 'fr', tree.sha)
    expect(bundle.record(first)?.text).toBe(records[first]!.text)
  })

  it('should skip records filed under the wrong shard or not valid JSON', async () => {
    const tree = await parseTranslationsTarball(await tarball([
      { name: `fr/segments/zz/${'0'.repeat(16)}.json`, data: JSON.stringify(records[first]) },
      { name: `fr/segments/11/${'1'.repeat(16)}.json`, data: '{' },
      { name: 'dist/fr.json', data: JSON.stringify({ version: 1, locale: 'fr', records }) }
    ]), SHA)
    expect(tree.records('fr').size).toBe(Object.keys(records).length)
    expect(tree.records('fr').get('1'.repeat(16))).toBeUndefined()
  })

  it('should merge the shared glossary with the locale glossary', async () => {
    const tree = await parseTranslationsTarball(await tarball([
      { name: 'glossary.yml', data: '- term: Nuxt\n  doNotTranslate: true\n- term: payload\n  doNotTranslate: true\n' },
      { name: 'fr/glossary.yml', data: 'terms:\n  - term: payload\n    decision: keep-gloss\n    gloss: charge utile\n' }
    ]), SHA)
    expect(tree.glossary('fr').terms).toEqual([
      { term: 'Nuxt', decision: 'keep' },
      { term: 'payload', decision: 'keep-gloss', gloss: 'charge utile' }
    ])
  })

  it('should read a repository without glossaries as having no terms', async () => {
    expect((await parseTranslationsTarball(await tarball(), SHA)).glossary('fr')).toEqual({ terms: [] })
  })

  it('should read the state of a locale', async () => {
    const tree = await parseTranslationsTarball(await tarball([{ name: 'fr/locale.yml', data: 'mt:\n  enabled: true\n' }]), SHA)
    expect(tree.localeState('fr')).toEqual({ mt: { enabled: true } })
    expect((await parseTranslationsTarball(await tarball(), SHA)).localeState('fr')).toEqual({})
  })

  it('should restore the policy the manifests were extracted under', async () => {
    expect((await parseTranslationsTarball(await tarball(), SHA)).policy).toBe(defaultPolicy)

    const tree = await parseTranslationsTarball(await tarball([{ name: '.diglot/policy.json', data: JSON.stringify(snapshotPolicy(POLICY)) }]), SHA)
    expect(tree.policy.props['read-more']).toEqual(['to'])
    expect(policyFingerprint(tree.policy)).toBe(policyFingerprint(POLICY))
  })

  it('should report manifests extracted under another policy', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    await parseTranslationsTarball(await tarball([{ name: '.diglot/manifest/nuxt-main.json', data: JSON.stringify({ ...manifest, source: 'nuxt-main', policy: policyFingerprint(POLICY) }) }]), SHA)
    expect(error).toHaveBeenCalledWith(expect.stringContaining('nuxt-main at'))
    error.mockRestore()
  })

  it('should read the records of a tarball as it arrives', async () => {
    const data = await tarball()
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        for (let index = 0; index < data.length; index += 512) controller.enqueue(data.subarray(index, index + 512))
        controller.close()
      }
    })
    const tree = await parseTranslationsTarball(stream, SHA)
    expect([...tree.records('fr').keys()].sort()).toEqual(Object.keys(records).sort())
  })
})

describe('readTranslationsCheckout', () => {
  let root: string

  beforeAll(async () => {
    root = await mkdtemp(join(tmpdir(), 'l10n-tree-'))
    await writeRecord(root, 'fr', records[first]!)
    await writeRecord(root, 'fr', records[second]!)
    await writeManifest(join(root, '.diglot'), manifest)
  })

  afterAll(() => rm(root, { recursive: true, force: true }))

  it('should read the records and manifests of a local clone', async () => {
    const tree = await readTranslationsCheckout(root, 'main', ['fr'])
    expect([...tree.records('fr').keys()].sort()).toEqual([first, second].sort())
    expect(tree.manifests.get('nuxt-4.x')?.files).toEqual(manifest.files)
    expect(tree.policy).toBe(defaultPolicy)
  })

  it('should restore the policy of a local clone', async () => {
    await writePolicy(join(root, '.diglot'), POLICY)
    expect((await readTranslationsCheckout(root, 'main', ['fr'])).policy.props['read-more']).toEqual(['to'])
  })
})

describe('l10n snapshot', () => {
  const INTRODUCTION = 'docs/1.getting-started/01.introduction.md'

  it('should build the coverage of every file of the translated sources', async () => {
    const tree = await parseTranslationsTarball(await tarball(), SHA)
    const snapshot = buildL10nSnapshot(tree, 'fr')
    expect(Object.keys(snapshot.coverage)).toEqual(['nuxt-4.x'])
    expect(snapshot.coverage['nuxt-4.x']).toEqual(sourceCoverage(manifest, snapshot.bundle))
    expect(snapshot.coverage['nuxt-4.x']![INTRODUCTION]!.words).toBeGreaterThan(0)
    expect(snapshot.bundle.record(first)?.text).toBe(records[first]!.text)
  })

  it('should store a snapshot in shards and read it back', async () => {
    const tree = await parseTranslationsTarball(await tarball([{ name: 'glossary.yml', data: '- term: Nuxt\n  doNotTranslate: true\n' }]), SHA)
    const storage = createStorage()
    await writeL10nSnapshot(storage, buildL10nSnapshot(tree, 'fr'), tree.records('fr'), { shardLength: 4000 })
    expect((await storage.getKeys()).length).toBeGreaterThan(2)

    const stored = await readL10nSnapshot(storage, SHA, 'fr')
    expect(stored?.bundle.sha).toBe(SHA)
    expect([...stored!.bundle.hashes()].sort()).toEqual(Object.keys(records).sort())
    expect(stored?.bundle.record(second)).toEqual(records[second])
    expect(stored?.coverage).toEqual(buildL10nSnapshot(tree, 'fr').coverage)
    expect(stored?.glossary).toEqual({ terms: [{ term: 'Nuxt', decision: 'keep' }] })
  })

  it('should keep the policy of a snapshot', async () => {
    const tree = await parseTranslationsTarball(await tarball([{ name: '.diglot/policy.json', data: JSON.stringify(snapshotPolicy(POLICY)) }]), SHA)
    const storage = createStorage()
    await writeL10nSnapshot(storage, buildL10nSnapshot(tree, 'fr'), tree.records('fr'))
    const stored = await readL10nSnapshot(storage, SHA, 'fr')
    expect(policyFingerprint(stored!.bundle.policy)).toBe(policyFingerprint(POLICY))
  })

  it('should keep whether a snapshot has reviewed records without reading them back', async () => {
    const tree = await parseTranslationsTarball(await tarball(), SHA)
    const storage = createStorage()
    const snapshot = buildL10nSnapshot(tree, 'fr')
    await writeL10nSnapshot(storage, { ...snapshot, bundle: { ...snapshot.bundle, reviewed: !snapshot.bundle.reviewed } }, tree.records('fr'))
    expect((await readL10nSnapshot(storage, SHA, 'fr'))?.bundle.reviewed).toBe(!snapshot.bundle.reviewed)
  })

  it('should read a missing or incomplete snapshot as missing', async () => {
    const tree = await parseTranslationsTarball(await tarball(), SHA)
    const storage = createStorage()
    expect(await readL10nSnapshot(storage, SHA, 'fr')).toBeUndefined()

    await writeL10nSnapshot(storage, buildL10nSnapshot(tree, 'fr'), tree.records('fr'), { shardLength: 4000 })
    await storage.removeItem((await storage.getKeys()).find(key => key.endsWith(':1'))!)
    expect(await readL10nSnapshot(storage, SHA, 'fr')).toBeUndefined()
  })
})
