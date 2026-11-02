import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import type { Segment, TranslationRecord } from '@diglot/core'
import { parseRecord } from '@diglot/core'
import { recordPath, serialiseRecord } from '@diglot/store'
import fs from 'comark-content/sources/fs'
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { dryRunGit, type TranslationsGit } from '../../server/utils/l10n/git'
import { createGitHubApp, githubTranslationsGit, isGitHubTeamMember } from '../../server/utils/l10n/github-app'
import { commitChanges, L10nChangeError, L10nConflictError, pageSegments, planChanges, readRecordsAt, suggestChanges, suggestionBranch } from '../../server/utils/l10n/write'
import { createBuildInstance } from '../../utils/factory'
import { createFakeGitHub, FAKE_BOT } from '../utils/fake-github'

const FIXTURES = fileURLToPath(new URL('../fixtures/l10n/', import.meta.url))
const records = (JSON.parse(readFileSync(`${FIXTURES}fr.json`, 'utf8')) as { records: Record<string, TranslationRecord> }).records

const PAGE = '/docs/4.x/getting-started/introduction'
/** `Nuxt is a free and {0}open-source framework{/0} with … {1}Vue.js{/1}.` */
const FIRST_PARAGRAPH = '839f9a4898b82644'
/** `If you want to play around with Nuxt in your browser, you can {0}try it out in one of our online sandboxes{/0}.` */
const TIP = 'baf35e0f2e2e1937'
/** `Automation and Conventions` */
const HEADING = 'b472c7e55313d66a'
const NOW = new Date('2026-11-03T10:00:00.000Z')
const translator = { login: 'danielroe', id: 28706372 }
const FIRST_TEXT = 'Nuxt est un framework libre et {0}open source{/0} pour créer des applications web avec {1}Vue.js{/1}.'

let segments: Map<string, Segment>

beforeAll(async () => {
  const content = createBuildInstance('docs:4.x', { source: fs(`${FIXTURES}docs`, { prefix: '/docs/4.x' }) })
  await content.init({ partial: false })
  segments = await pageSegments((await content.get(PAGE))!)
})

const current = (...hashes: string[]) => new Map(hashes.map(hash => [hash, records[hash]]))
const plan = (changes: Parameters<typeof planChanges>[0]['changes'], options: Partial<Parameters<typeof planChanges>[0]> = {}) =>
  planChanges({ locale: 'fr', segments, current: current(FIRST_PARAGRAPH, TIP, HEADING), changes, translator, now: NOW, ...options })

/** Files of the fixture repository: the records of the introduction. */
const repositoryFiles = () => Object.fromEntries([FIRST_PARAGRAPH, TIP, HEADING].map(hash => [recordPath('fr', hash), serialiseRecord(records[hash]!)]))

describe('planChanges', () => {
  it('should write an edit as a human edit that keeps the machine candidate', () => {
    const { files, issues, counts } = plan([{ hash: FIRST_PARAGRAPH, action: 'edit', text: ` ${FIRST_TEXT} ` }])
    expect(issues).toEqual([])
    expect(counts).toEqual({ edit: 1 })
    expect(files).toHaveLength(1)
    expect(files[0]!.path).toBe(`fr/segments/83/${FIRST_PARAGRAPH}.json`)
    const record = parseRecord(JSON.parse(files[0]!.content!))
    expect(record).toEqual({
      hash: FIRST_PARAGRAPH,
      source: records[FIRST_PARAGRAPH]!.source,
      text: FIRST_TEXT,
      origin: 'human',
      review: 'edited',
      derived: 'fresh',
      mt: records[FIRST_PARAGRAPH]!.mt,
      by: 'danielroe',
      updatedAt: NOW.toISOString()
    })
    expect(files[0]!.content).toBe(serialiseRecord(record))
  })

  it('should create a record for an untranslated segment', () => {
    const { files, issues } = plan([{ hash: HEADING, action: 'edit', text: 'Automatisation et conventions de Nuxt' }], { current: new Map() })
    expect(issues).toEqual([])
    expect(JSON.parse(files[0]!.content!)).toMatchObject({ origin: 'human', review: 'edited', derived: 'fresh', source: 'Automation and Conventions' })
  })

  it('should keep the text of a verified segment and record who verified it', () => {
    const { files, issues } = plan([{ hash: TIP, action: 'verify' }])
    expect(issues).toEqual([])
    expect(JSON.parse(files[0]!.content!)).toEqual({
      ...records[TIP],
      review: 'verified',
      verifiedBy: { by: 'danielroe', at: NOW.toISOString() },
      updatedAt: NOW.toISOString()
    })
  })

  it('should remove a rejected record', () => {
    const { files, records: next, counts } = plan([{ hash: TIP, action: 'reject' }])
    expect(files).toEqual([{ path: recordPath('fr', TIP), content: null }])
    expect(next.get(TIP)).toBeNull()
    expect(counts).toEqual({ reject: 1 })
  })

  it('should refuse edits that do not validate against the source', () => {
    const { files, issues } = plan([
      { hash: FIRST_PARAGRAPH, action: 'edit', text: 'Nuxt est un framework {0}open source{/0}.' },
      { hash: TIP, action: 'edit', text: 'Essayez [Nuxt](https://example.com) {0}en ligne{/0}.' }
    ])
    expect(files).toEqual([])
    expect(issues.map(({ hash, code }) => ({ hash, code }))).toEqual([
      { hash: FIRST_PARAGRAPH, code: 'invalid' },
      { hash: TIP, code: 'invalid' }
    ])
    expect(issues[0]!.errors?.map(error => error.code)).toContain('missing-placeholder')
  })

  it('should refuse changes to segments that are not on the page, or changed twice', () => {
    const { issues } = plan([
      { hash: '0'.repeat(16), action: 'verify' },
      { hash: TIP, action: 'verify' },
      { hash: TIP, action: 'reject' }
    ])
    expect(issues.map(issue => issue.code)).toEqual(['unknown-segment', 'duplicate'])
  })

  it('should refuse empty, unchanged and overlong edits', () => {
    const { issues } = plan([
      { hash: FIRST_PARAGRAPH, action: 'edit', text: '  ' },
      { hash: TIP, action: 'edit', text: records[TIP]!.text },
      { hash: HEADING, action: 'edit', text: 'Automatisation '.repeat(40) }
    ])
    expect(issues.map(issue => issue.code)).toEqual(['missing-text', 'unchanged', 'too-long'])
  })

  it('should refuse to verify or reject a segment without a record, or to verify one twice', () => {
    const verified = { ...records[TIP]!, review: 'verified' as const, verifiedBy: { by: 'someone', at: NOW.toISOString() } }
    const { issues } = plan([
      { hash: FIRST_PARAGRAPH, action: 'verify' },
      { hash: HEADING, action: 'reject' },
      { hash: TIP, action: 'verify' }
    ], { current: new Map([[TIP, verified]]) })
    expect(issues.map(issue => issue.code)).toEqual(['no-record', 'no-record', 'unchanged'])
  })

  it('should refuse to verify a record that no longer validates', () => {
    const broken = { ...records[TIP]!, text: 'Essayez Nuxt en ligne.' }
    expect(plan([{ hash: TIP, action: 'verify' }], { current: new Map([[TIP, broken]]) }).issues[0]?.code).toBe('invalid')
  })

  it('should only let suggestions edit', () => {
    const { issues, files } = plan([
      { hash: FIRST_PARAGRAPH, action: 'edit', text: FIRST_TEXT },
      { hash: TIP, action: 'verify' },
      { hash: HEADING, action: 'reject' }
    ], { suggestion: true })
    expect(files).toHaveLength(1)
    expect(issues.map(issue => [issue.hash, issue.code])).toEqual([[TIP, 'not-allowed'], [HEADING, 'not-allowed']])
  })
})

/** A repository holding the fixture records at commit `base`, on `main`. */
function fixtureRepository(): Pick<TranslationsGit, 'head' | 'read'> {
  const files = repositoryFiles()
  return {
    head: async branch => branch === 'main' ? 'base' : undefined,
    read: async (commit, path) => commit === 'base' ? files[path] : undefined
  }
}

describe('commitChanges (dry run)', () => {
  it('should capture one commit per save, authored by the translator', async () => {
    const git = dryRunGit(fixtureRepository())
    const result = await commitChanges(git, {
      locale: 'fr',
      page: PAGE,
      segments,
      translator,
      changes: [
        { hash: FIRST_PARAGRAPH, action: 'edit', text: FIRST_TEXT },
        { hash: TIP, action: 'verify' },
        { hash: HEADING, action: 'reject' }
      ]
    })

    expect(git.log.commits).toHaveLength(1)
    const [commit] = git.log.commits
    expect(commit).toMatchObject({
      sha: result.sha,
      parent: 'base',
      message: `chore(fr): edit 1, verify 1, reject 1 on ${PAGE}\n\nReviewed on nuxt.com by @danielroe.`,
      author: { name: 'danielroe', email: '28706372+danielroe@users.noreply.github.com' }
    })
    expect(commit!.files.map(file => [file.path, file.content === null])).toEqual([
      [recordPath('fr', FIRST_PARAGRAPH), false],
      [recordPath('fr', TIP), false],
      [recordPath('fr', HEADING), true]
    ])
    expect(git.log.updates).toEqual([{ branch: 'main', sha: result.sha, force: false }])
    expect(await git.head('main')).toBe(result.sha)
    expect((await readRecordsAt(git, result.sha, 'fr', [TIP])).get(TIP)?.review).toBe('verified')
  })

  it('should commit nothing when any change is refused', async () => {
    const git = dryRunGit(fixtureRepository())
    const save = commitChanges(git, {
      locale: 'fr',
      page: PAGE,
      segments,
      translator,
      changes: [{ hash: TIP, action: 'verify' }, { hash: FIRST_PARAGRAPH, action: 'edit', text: 'Nuxt.' }]
    })
    await expect(save).rejects.toBeInstanceOf(L10nChangeError)
    await expect(save).rejects.toMatchObject({ issues: [{ hash: FIRST_PARAGRAPH, code: 'invalid' }] })
    expect(git.log.commits).toEqual([])
  })
})

describe('suggestChanges (dry run)', () => {
  it('should open one pull request per user and locale, and add later suggestions to it', async () => {
    const git = dryRunGit(fixtureRepository())
    const input = { locale: 'fr' as const, page: PAGE, segments, translator: { login: 'contributor', id: 1 } }

    const first = await suggestChanges(git, { ...input, changes: [{ hash: FIRST_PARAGRAPH, action: 'edit', text: FIRST_TEXT }] })
    expect(first.branch).toBe('suggest/contributor/fr')
    expect(first.pull).toEqual({ number: 1, url: 'dry-run://pull/1' })
    expect(git.log.commits[0]!.parent).toBe('base')
    expect(git.log.commits[0]!.message).toBe(`chore(fr): edit 1 on ${PAGE}\n\nSuggested on nuxt.com by @contributor.`)
    expect(git.log.pulls).toMatchObject([{ branch: 'suggest/contributor/fr', title: 'chore(fr): suggestions from @contributor' }])

    const second = await suggestChanges(git, { ...input, changes: [{ hash: TIP, action: 'edit', text: 'Essayez Nuxt {0}en ligne{/0}.' }] })
    expect(second.pull).toEqual(first.pull)
    expect(git.log.commits[1]!.parent).toBe(first.sha)
    expect(git.log.pulls).toHaveLength(1)
    expect(await git.head('main')).toBe('base')
  })

  it('should refuse to verify or reject as a suggestion', async () => {
    const git = dryRunGit(fixtureRepository())
    await expect(suggestChanges(git, { locale: 'fr', page: PAGE, segments, translator, changes: [{ hash: TIP, action: 'verify' }] }))
      .rejects.toMatchObject({ issues: [{ code: 'not-allowed' }] })
  })
})

describe('GitHub App', () => {
  let github: Awaited<ReturnType<typeof createFakeGitHub>>
  let git: TranslationsGit

  beforeEach(async () => {
    github = await createFakeGitHub({ files: repositoryFiles(), teams: { 'translators-fr': ['danielroe'] } })
    const app = createGitHubApp({ appId: '123', privateKey: github.privateKey.replace(/\n/g, '\\n') }, { repo: 'nuxt/translations', baseURL: github.baseURL })
    git = githubTranslationsGit(app, 'nuxt/translations')
  })

  afterEach(() => github.close())

  const save = (target: TranslationsGit = git) => commitChanges(target, {
    locale: 'fr',
    page: PAGE,
    segments,
    translator,
    changes: [{ hash: FIRST_PARAGRAPH, action: 'edit', text: FIRST_TEXT }, { hash: HEADING, action: 'reject' }]
  })

  it('should commit on main as the translator, with the App as committer', async () => {
    const before = github.git(['rev-parse', 'main'])
    const { sha } = await save()

    expect(github.git(['rev-parse', 'main'])).toBe(sha)
    expect(github.git(['rev-parse', `${sha}^`])).toBe(before)
    expect(github.git(['log', '-1', '--format=%an <%ae>|%cn <%ce>|%s', sha])).toBe(
      `danielroe <28706372+danielroe@users.noreply.github.com>|${FAKE_BOT.slug}[bot] <${FAKE_BOT.id}+${FAKE_BOT.slug}[bot]@users.noreply.github.com>|chore(fr): edit 1, reject 1 on ${PAGE}`
    )
    expect(github.git(['diff', '--name-status', before, sha]).split('\n')).toEqual([
      `M\t${recordPath('fr', FIRST_PARAGRAPH)}`,
      `D\t${recordPath('fr', HEADING)}`
    ])
    expect(JSON.parse(github.git(['show', `${sha}:${recordPath('fr', FIRST_PARAGRAPH)}`])).text).toBe(FIRST_TEXT)
  })

  it('should mint one installation token for every request', async () => {
    await save()
    const minted = github.requests.filter(request => request.path.endsWith('/access_tokens'))
    expect(minted).toHaveLength(1)
  })

  it('should retry once on top of a commit that landed in between', async () => {
    let pushed: string | undefined
    const racing: TranslationsGit = {
      ...git,
      async commit(input) {
        pushed ??= github.push('main', 'fr/glossary.yml', 'terms: []\n')
        return git.commit(input)
      }
    }
    const { sha } = await save(racing)
    expect(github.git(['rev-parse', `${sha}^`])).toBe(pushed)
    expect(github.git(['rev-list', '--count', 'main'])).toBe('3')
  })

  it('should give up when main keeps moving', async () => {
    const racing: TranslationsGit = {
      ...git,
      async commit(input) {
        github.push('main', 'fr/glossary.yml', `terms: [] # ${Math.random()}\n`)
        return git.commit(input)
      }
    }
    await expect(save(racing)).rejects.toBeInstanceOf(L10nConflictError)
  })

  it('should open a suggestion pull request from a new branch, and reset the branch once it is closed', async () => {
    const input = { locale: 'fr' as const, page: PAGE, segments, translator: { login: 'contributor', id: 1 } }
    const branch = suggestionBranch('contributor', 'fr')

    const first = await suggestChanges(git, { ...input, changes: [{ hash: FIRST_PARAGRAPH, action: 'edit', text: FIRST_TEXT }] })
    expect(github.git(['rev-parse', branch])).toBe(first.sha)
    expect(github.pulls).toMatchObject([{ number: 1, head: branch, base: 'main', state: 'open' }])
    expect(first.pull?.url).toBe('https://github.com/nuxt/translations/pull/1')

    const second = await suggestChanges(git, { ...input, changes: [{ hash: TIP, action: 'edit', text: 'Essayez Nuxt {0}en ligne{/0}.' }] })
    expect(github.git(['rev-parse', `${second.sha}^`])).toBe(first.sha)
    expect(github.pulls).toHaveLength(1)

    github.pulls[0]!.state = 'closed'
    const third = await suggestChanges(git, { ...input, changes: [{ hash: TIP, action: 'edit', text: 'Testez Nuxt {0}en ligne{/0}.' }] })
    expect(github.git(['rev-parse', `${third.sha}^`])).toBe(github.git(['rev-parse', 'main']))
    expect(github.pulls.map(pull => pull.number)).toEqual([1, 2])
  })

  it('should check team membership through the App', async () => {
    const app = createGitHubApp({ appId: '123', privateKey: github.privateKey, installationId: '1' }, { repo: 'nuxt/translations', baseURL: github.baseURL })
    expect(await isGitHubTeamMember(app, 'nuxt', 'translators-fr', 'danielroe')).toBe(true)
    expect(await isGitHubTeamMember(app, 'nuxt', 'translators-fr', 'contributor')).toBe(false)
    expect(await isGitHubTeamMember(app, 'nuxt', 'translators-de', 'danielroe')).toBe(false)
  })
})
