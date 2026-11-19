import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { captureScreenshot, captureUrlError, hideElementsExpression, parseCookie, recordVideo, removeElementsExpression, stepCommand } from '../../layers/nuxi/agent/lib/media/capture'
import { mediaTypeFromPath, sniffMediaType } from '../../layers/nuxi/agent/lib/media/media-type'
import { publishMedia } from '../../layers/nuxi/agent/lib/media/publish'
import { commitAssets, MAX_COMMIT_BYTES, openPullRequestOf } from '../../layers/nuxi/agent/lib/github-files'

const ascii = (text: string) => [...text].map(char => char.charCodeAt(0))
const WEBP = new Uint8Array([...ascii('RIFF'), 0x24, 0, 0, 0, ...ascii('WEBPVP8 '), 1, 2, 3])
const PNG = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 1, 2, 3])
const MP4 = new Uint8Array([0, 0, 0, 0x20, ...ascii('ftypisom'), 1, 2, 3])
const AVIF = new Uint8Array([0, 0, 0, 0x20, ...ascii('ftypavif'), 1, 2, 3])
const TEXT = new Uint8Array(ascii('TOKEN=secret'))

/** A `fetch` that answers from `routes`, keyed by `METHOD url-without-query`, 404 for the rest, and records every request. */
function fakeGithub(routes: Record<string, unknown>) {
  const requests: Array<{ call: string, url: URL, headers: Headers, body: unknown }> = []
  const fetchImpl = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = new URL(String(input))
    const call = `${init?.method ?? 'GET'} ${url.origin}${url.pathname}`
    requests.push({ call, url, headers: new Headers(init?.headers), body: init?.body })
    return call in routes ? Response.json(routes[call]) : Response.json({ message: 'Not Found' }, { status: 404 })
  }) as typeof fetch
  return { fetchImpl, requests }
}

describe('captureUrlError', () => {
  it('accepts a public page', () => {
    expect(captureUrlError('https://triathlon.org/')).toBeNull()
    // Each one is the address just outside a reserved range.
    expect(captureUrlError('http://172.15.0.1/')).toBeNull()
    expect(captureUrlError('http://100.63.255.255/')).toBeNull()
    expect(captureUrlError('http://100.128.0.1/')).toBeNull()
    expect(captureUrlError('http://198.20.0.1/')).toBeNull()
    expect(captureUrlError('http://192.0.1.1/')).toBeNull()
    expect(captureUrlError('http://223.255.255.255/')).toBeNull()
    expect(captureUrlError('https://internal.example.com/')).toBeNull()
  })

  it.each([
    'triathlon.org',
    'about:blank',
    'file:///etc/passwd',
    'javascript:alert(1)',
    'https://user:pass@example.com/',
    'http://localhost:3000/',
    'http://localhost./',
    'http://app.localhost/',
    'http://db.internal/',
    'http://127.0.0.1/',
    // The URL parser normalises these to 127.0.0.1.
    'http://2130706433/',
    'http://0x7f.1/',
    'http://10.1.2.3/',
    'http://172.16.0.1/',
    'http://172.31.255.255/',
    'http://192.168.1.1/',
    'http://169.254.169.254/latest/meta-data/',
    'http://100.64.0.1/',
    'http://100.100.100.200/latest/meta-data/',
    'http://100.127.255.255/',
    'http://198.18.0.1/',
    'http://198.19.255.255/',
    'http://192.0.0.8/',
    'http://224.0.0.1/',
    'http://255.255.255.255/',
    'http://[::1]/'
  ])('rejects %s', (url) => {
    expect(captureUrlError(url)).toEqual(expect.any(String))
  })
})

describe('parseCookie', () => {
  it('reads cookies as `screenshotOptions.cookies` writes them', () => {
    expect(parseCookie('consent=1;')).toEqual({ name: 'consent', value: '1' })
    expect(parseCookie('cc_cookie={"categories":["a=b"]}; Path=/')).toEqual({ name: 'cc_cookie', value: '{"categories":["a=b"]}' })
  })

  it('rejects a string without a name', () => {
    expect(parseCookie('consent')).toBeNull()
    expect(parseCookie('=1')).toBeNull()
  })
})

describe('hideElementsExpression and removeElementsExpression', () => {
  /** Runs the expression against a fake document and returns the stylesheets it appended. */
  function stylesFrom(expression: string) {
    const appended: Array<{ textContent: string }> = []
    const document = {
      createElement: () => ({ textContent: '' }),
      head: { append: (style: { textContent: string }) => appended.push(style) }
    }
    expect(new Function('document', `return ${expression}`)(document)).toBe(true)
    return appended.map(style => style.textContent)
  }

  it('hides every selector, whatever quotes it contains', () => {
    expect(stylesFrom(hideElementsExpression(['#cookie-banner', '[aria-label="It\'s a \\"banner\\""]'])))
      .toEqual(['#cookie-banner, [aria-label="It\'s a \\"banner\\""] { visibility: hidden !important }'])
  })

  it('keeps characters that could end a script or a line out of the expression', () => {
    const selectors = ['nav > a', '[data-x="</script><script>alert(1)//"]', '[title="a\u2028b\u2029c"]']
    const expression = hideElementsExpression(selectors)

    expect(expression).not.toMatch(/<\/script|\u2028|\u2029/)
    expect(stylesFrom(expression)).toEqual([`${selectors.join(', ')} { visibility: hidden !important }`])
  })

  it('removes elements from the layout instead of hiding them', () => {
    expect(stylesFrom(removeElementsExpression(['.uwy', 'us-button']))).toEqual(['.uwy, us-button { display: none !important }'])
  })
})

describe('stepCommand', () => {
  it('maps each step to its agent-browser command', () => {
    expect(stepCommand({ action: 'wait', ms: 800 })).toEqual(['wait', '800'])
    expect(stepCommand({ action: 'scroll', direction: 'down', px: 600 })).toEqual(['scroll', 'down', '600'])
    expect(stepCommand({ action: 'scroll_to', selector: '#pricing' })).toEqual(['scrollintoview', '#pricing'])
    expect(stepCommand({ action: 'hover', selector: 'nav a' })).toEqual(['hover', 'nav a'])
    expect(stepCommand({ action: 'click', selector: '@e12' })).toEqual(['click', '@e12'])
    expect(stepCommand({ action: 'press', key: 'Escape' })).toEqual(['press', 'Escape'])
    expect(stepCommand({ action: 'type', selector: 'input', text: 'use fetch' })).toEqual(['type', 'input', 'use fetch'])
  })
})

describe('captureScreenshot', () => {
  it('encodes the frame at the quality asked for, 80 by default', async () => {
    const commands: string[] = []
    const sandbox = {
      run: async ({ command }: { command: string }) => {
        commands.push(command)
        if (command.startsWith('stat ')) return { exitCode: 0, stdout: '204388\n' }
        return { exitCode: 0, stdout: JSON.stringify({ success: true, data: command.includes(' get url') ? { url: 'https://triathlon.org/' } : {} }) }
      },
      readBinaryFile: async () => WEBP
    }
    const encodes = () => commands.filter(command => command.endsWith('/workspace/captures/home.webp') && command.startsWith('ffmpeg'))

    await captureScreenshot(sandbox, { name: 'home', delay: 0 })
    expect(encodes().at(-1)).toContain('-quality 80 ')

    const shot = await captureScreenshot(sandbox, { name: 'home', delay: 0, quality: 40 })
    expect(encodes().at(-1)).toContain('-quality 40 ')
    expect(shot).toMatchObject({ path: '/workspace/captures/home.webp', bytes: 204388, width: 2560, height: 1440 })
  })
})

describe('recordVideo', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('keeps nothing of a recording whose step leaves the public page', async () => {
    const urls = ['https://nuxt.com/', 'http://127.0.0.1:3000/admin']
    const commands: string[] = []
    const sandbox = {
      // What the agent-browser CLI prints with `--json`.
      run: async ({ command }: { command: string }) => {
        commands.push(command)
        return { exitCode: 0, stdout: JSON.stringify({ success: true, data: command.includes(' get url') ? { url: urls.shift() } : {} }) }
      },
      readBinaryFile: async () => null
    }

    await expect(recordVideo(sandbox, { name: 'menu', steps: [{ action: 'click', selector: '#admin' }] })).rejects.toThrow('"127.0.0.1" is a local or private address')
    expect(commands.some(command => command.includes('record stop'))).toBe(true)
    expect(commands.at(-1)).toContain('rm -f /workspace/captures/menu.webm')
    expect(commands.some(command => command.includes('ffmpeg'))).toBe(false)
  })

  it('stops the recorder when the turn is cancelled while it starts', async () => {
    const commands: string[] = []
    const sandbox = {
      run: async ({ command }: { command: string }) => {
        commands.push(command)
        if (command.includes('record start')) throw new Error('This operation was aborted')
        return { exitCode: 0, stdout: JSON.stringify({ success: true, data: command.includes(' get url') ? { url: 'https://nuxt.com/' } : {} }) }
      },
      readBinaryFile: async () => null
    }

    await expect(recordVideo(sandbox, { name: 'menu', steps: [{ action: 'hover', selector: 'nav a' }] })).rejects.toThrow('This operation was aborted')
    expect(commands.some(command => command.includes('record stop'))).toBe(true)
  })

  it('keeps the step\'s error when stopping the recorder hangs', async () => {
    const shortly = AbortSignal.timeout.bind(AbortSignal)
    vi.spyOn(AbortSignal, 'timeout').mockImplementation(() => shortly(10))
    const commands: string[] = []
    const sandbox = {
      run: async ({ command, signal }: { command: string, signal?: AbortSignal }) => {
        commands.push(command)
        if (command.includes(' click ')) throw new Error('Element not found: #menu')
        // A stop that never answers: only its own signal ends it.
        if (command.includes('record stop')) await new Promise((_, reject) => signal?.addEventListener('abort', () => reject(signal.reason)))
        return { exitCode: 0, stdout: JSON.stringify({ success: true, data: command.includes(' get url') ? { url: 'https://nuxt.com/' } : {} }) }
      },
      readBinaryFile: async () => null
    }

    await expect(recordVideo(sandbox, { name: 'menu', steps: [{ action: 'click', selector: '#menu' }] })).rejects.toThrow('Element not found: #menu')
    expect(commands.at(-1)).toContain('rm -f /workspace/captures/menu.webm')
  }, 2000)

  it('runs two recordings asked for together one after the other', async () => {
    let recording = false
    const sandbox = {
      // Like agent-browser, one recorder per browser.
      run: async ({ command }: { command: string }) => {
        await new Promise(resolve => setTimeout(resolve, 1))
        if (command.includes('record start')) {
          if (recording) throw new Error('Recording already active')
          recording = true
        }
        if (command.includes('record stop')) recording = false
        return { exitCode: 0, stdout: JSON.stringify({ success: true, data: command.includes(' get url') ? { url: 'https://nuxt.com/' } : {} }) }
      },
      readBinaryFile: async () => new Uint8Array([1])
    }
    const steps = [{ action: 'wait' as const, ms: 100 }]

    const clips = await Promise.all([recordVideo(sandbox, { name: 'first', steps }), recordVideo(sandbox, { name: 'second', steps })])
    expect(clips.map(clip => clip.path)).toEqual(['/workspace/captures/first.mp4', '/workspace/captures/second.mp4'])
  })
})

describe('media types', () => {
  it('reads the type from the extension', () => {
    expect(mediaTypeFromPath('/workspace/captures/World.Triathlon.WEBP')).toBe('image/webp')
    expect(mediaTypeFromPath('clip.mp4')).toBe('video/mp4')
    expect(mediaTypeFromPath('clip.webm')).toBeNull()
    expect(mediaTypeFromPath('/workspace/captures/logo.svg')).toBeNull()
    expect(mediaTypeFromPath('/workspace/captures.webp/notes')).toBeNull()
    expect(mediaTypeFromPath('/workspace/.webp')).toBeNull()
    expect(mediaTypeFromPath('logo.constructor')).toBeNull()
  })

  it('reads the type from the first bytes', () => {
    expect(sniffMediaType(WEBP)).toBe('image/webp')
    expect(sniffMediaType(PNG)).toBe('image/png')
    expect(sniffMediaType(MP4)).toBe('video/mp4')
    // An AVIF image starts with the same box as an MP4 video.
    expect(sniffMediaType(AVIF)).toBeNull()
    // A WAV file is RIFF too.
    expect(sniffMediaType(new Uint8Array([...ascii('RIFF'), 0x24, 0, 0, 0, ...ascii('WAVEfmt ')]))).toBeNull()
    expect(sniffMediaType(new Uint8Array(ascii('<svg xmlns="http://www.w3.org/2000/svg"/>')))).toBeNull()
    expect(sniffMediaType(new Uint8Array())).toBeNull()
  })
})

describe('publishMedia', () => {
  const REPOSITORY = 'GET https://api.github.com/repos/nuxt/ui'
  const UPLOAD = 'POST https://uploads.github.com/user-attachments/assets'
  const url = 'https://github.com/user-attachments/assets/1b2c'
  const clip = { repository: 'nuxt/ui', name: 'header-menu.mp4', bytes: MP4 }

  beforeEach(() => {
    vi.stubEnv('NUXI_GITHUB_ATTACHMENTS_PAT', 'attachments-pat')
  })
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('attaches the file to the repository with the personal access token and returns the URL GitHub serves', async () => {
    const { fetchImpl, requests } = fakeGithub({ [REPOSITORY]: { id: 42 }, [UPLOAD]: { url }, [`GET ${url}`]: {} })

    expect(await publishMedia({ ...clip, fetchImpl })).toEqual({ url, mediaType: 'video/mp4', bytes: MP4.byteLength })
    expect(requests.map(request => request.call)).toEqual([REPOSITORY, UPLOAD, `GET ${url}`])

    const upload = requests[1]!
    expect(Object.fromEntries(upload.url.searchParams)).toEqual({ name: 'header-menu.mp4', content_type: 'video/mp4', repository_id: '42' })
    expect(upload.headers.get('content-type')).toBe('application/octet-stream')
    expect(upload.body).toEqual(Buffer.from(MP4))
    // Nothing references the attachment yet, so it is read back with the token too.
    expect(requests.map(request => request.headers.get('authorization'))).toEqual(Array(3).fill('Bearer attachments-pat'))
  })

  it('sends nothing to GitHub without the token', async () => {
    vi.stubEnv('NUXI_GITHUB_ATTACHMENTS_PAT', '')
    const { fetchImpl, requests } = fakeGithub({})

    await expect(publishMedia({ ...clip, fetchImpl })).rejects.toThrow('NUXI_GITHUB_ATTACHMENTS_PAT is not set')
    expect(requests).toEqual([])
  })

  it.each([
    ['a file that is not media', '.env', TEXT],
    ['text renamed to an image', 'world-triathlon.webp', TEXT],
    ['an image with another image\'s extension', 'world-triathlon.webp', PNG],
    ['an image renamed to a clip', 'header-menu.mp4', AVIF]
  ])('sends nothing to GitHub for %s', async (_, name, bytes) => {
    const { fetchImpl, requests } = fakeGithub({})

    await expect(publishMedia({ ...clip, name, bytes, fetchImpl })).rejects.toThrow()
    expect(requests).toEqual([])
  })

  it('names the variable and what its token needs when GitHub refuses the upload', async () => {
    const { fetchImpl } = fakeGithub({ [REPOSITORY]: { id: 42 } })

    await expect(publishMedia({ ...clip, fetchImpl })).rejects.toThrow('NUXI_GITHUB_ATTACHMENTS_PAT must be a personal access token whose account can write to nuxt/ui')
  })

  it('reports a URL that does not load instead of returning it', async () => {
    const { fetchImpl } = fakeGithub({ [REPOSITORY]: { id: 42 }, [UPLOAD]: { url } })

    await expect(publishMedia({ ...clip, fetchImpl })).rejects.toThrow(`${url} answers HTTP 404`)
  })
})

describe('openPullRequestOf', () => {
  const PULLS = 'GET https://api.github.com/repos/nuxt/ui/pulls'
  const input = { repository: 'nuxt/ui', token: 'token', branch: 'nuxi/showcase-world-triathlon' }

  it('finds the open pull request of a branch of the repository itself', async () => {
    const { fetchImpl, requests } = fakeGithub({ [PULLS]: [{ number: 2679 }] })

    expect(await openPullRequestOf({ ...input, fetchImpl })).toBe(2679)
    expect(Object.fromEntries(requests[0]!.url.searchParams)).toMatchObject({ state: 'open', head: 'nuxt:nuxi/showcase-world-triathlon' })
  })

  it('finds none on a branch nobody opened a pull request from', async () => {
    const { fetchImpl } = fakeGithub({ [PULLS]: [] })

    expect(await openPullRequestOf({ ...input, fetchImpl })).toBeUndefined()
  })
})

describe('commitAssets', () => {
  const API = 'https://api.github.com'
  const REFS = `${API}/repos/nuxt/ui/git`
  const file = { path: 'public/assets/websites/world-triathlon.webp', bytes: WEBP }
  const commit = { oid: 'c0ffee', url: 'https://github.com/nuxt/ui/commit/c0ffee' }
  const committed = { [`POST ${API}/graphql`]: { data: { createCommitOnBranch: { commit } } } }
  const input = { repository: 'nuxt/ui', token: 'token', branch: 'nuxi/showcase', message: 'feat: add screenshot', files: [file] }

  it('commits onto the head of an existing branch', async () => {
    const { fetchImpl, requests } = fakeGithub({ ...committed, [`GET ${REFS}/ref/heads/nuxi/showcase`]: { object: { sha: 'branch-sha' } } })
    const message = 'feat(showcase): add World Triathlon screenshot\n\nCaptured from https://triathlon.org.'

    expect(await commitAssets({ ...input, message, fetchImpl })).toEqual({
      repository: 'nuxt/ui',
      branch: 'nuxi/showcase',
      createdBranch: false,
      commitSha: 'c0ffee',
      commitUrl: commit.url,
      paths: [file.path]
    })
    expect(requests.map(request => request.call)).toEqual([`GET ${REFS}/ref/heads/nuxi/showcase`, `POST ${API}/graphql`])
    expect(JSON.parse(String(requests[1]!.body)).variables.input).toEqual({
      branch: { repositoryNameWithOwner: 'nuxt/ui', branchName: 'nuxi/showcase' },
      expectedHeadOid: 'branch-sha',
      message: { headline: 'feat(showcase): add World Triathlon screenshot', body: 'Captured from https://triathlon.org.' },
      fileChanges: { additions: [{ path: file.path, contents: Buffer.from(WEBP).toString('base64') }] }
    })
  })

  it('creates a missing branch from the default branch first', async () => {
    const { fetchImpl, requests } = fakeGithub({
      ...committed,
      [`GET ${API}/repos/nuxt/ui`]: { default_branch: 'v4' },
      [`GET ${REFS}/ref/heads/v4`]: { object: { sha: 'v4-sha' } },
      [`POST ${REFS}/refs`]: {}
    })

    expect(await commitAssets({ ...input, fetchImpl })).toMatchObject({ createdBranch: true })
    expect(JSON.parse(String(requests[3]!.body))).toEqual({ ref: 'refs/heads/nuxi/showcase', sha: 'v4-sha' })
    expect(JSON.parse(String(requests[4]!.body)).variables.input).toMatchObject({ expectedHeadOid: 'v4-sha', message: { headline: 'feat: add screenshot' } })
  })

  it('reports why GitHub refused the commit', async () => {
    const { fetchImpl } = fakeGithub({
      [`GET ${REFS}/ref/heads/nuxi/showcase`]: { object: { sha: 'branch-sha' } },
      [`POST ${API}/graphql`]: { data: { createCommitOnBranch: null }, errors: [{ message: 'Expected branch to point to "x"' }] }
    })

    await expect(commitAssets({ ...input, fetchImpl })).rejects.toThrow('Expected branch to point to "x"')
  })

  it.each([
    ['the default branch', { branch: 'main' }],
    ['a branch that only contains nuxi/', { branch: 'feat/nuxi/x' }],
    ['a branch that climbs out of nuxi/', { branch: 'nuxi/../main' }],
    ['a path that climbs out of the repository', { files: [{ path: 'public/../../x.webp', bytes: WEBP }] }],
    ['a text file', { files: [{ path: '.github/workflows/ci.yml', bytes: TEXT }] }],
    ['text renamed to an image', { files: [{ path: 'public/x.webp', bytes: TEXT }] }],
    ['a video', { files: [{ path: 'public/demo.mp4', bytes: MP4 }] }],
    ['an image over the size limit', { files: [{ path: 'public/x.webp', bytes: new Uint8Array([...WEBP, ...new Uint8Array(MAX_COMMIT_BYTES)]) }] }]
  ])('sends nothing to GitHub for %s', async (_, override) => {
    const { fetchImpl, requests } = fakeGithub({})

    await expect(commitAssets({ ...input, ...override, fetchImpl })).rejects.toThrow()
    expect(requests).toEqual([])
  })
})
