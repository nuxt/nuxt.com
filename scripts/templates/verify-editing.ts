// node --env-file=.env --import tsx scripts/templates/verify-editing.ts minimal nuxt-ui-dashboard docus
// Uses temporary Vercel Sandboxes; optionally pass --module=@nuxt/image to exercise installation too.
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { Sandbox } from '@vercel/sandbox'
import { parseYAML } from 'confbox'
import { Window } from 'happy-dom'
import type { Template } from '../../shared/types/templates'
import { INSTALL_SCRIPT, TEMPLATE_WORKDIR } from '../../server/utils/templates/check-scripts'
import { DEV_PORT } from '../../server/utils/templates/dev-server'
import { addAppModule, checkAppPage, deleteAppFile, devLogSize, listAppFiles, readAppFile, waitForContent, waitForDevServer, waitForRestart, writeAppFile } from '../../server/utils/templates/edit'

const args = process.argv.slice(2)
const module = args.find(arg => arg.startsWith('--module='))?.slice(9)
const slugs = args.filter(arg => !arg.startsWith('--'))
assert(slugs.length, 'Pass template slugs, for example: minimal nuxt-ui-dashboard docus')
const window = new Window()

for (const slug of slugs) {
  assert(/^[\w-]+$/.test(slug), `Invalid template slug: ${slug}`)
  const yaml = await readFile(`content/templates/${slug}.yml`, 'utf8')
    .catch(() => readFile(`content/templates/starters/${slug}.yml`, 'utf8'))
  const template = parseYAML<Template>(yaml)
  assert(template.repo, `${slug} has no public repository`)
  const [, repo, ...directory] = (template.source?.replace(/^gh:/, '') ?? template.repo).split('/')
  const sandbox = await Sandbox.create({
    source: { type: 'git', url: `https://github.com/${template.repo}.git`, depth: 1, ...(template.branch && { revision: template.branch }) },
    ports: [DEV_PORT], timeout: 20 * 60_000, persistent: false,
    resources: { vcpus: 4 }, tags: { app: 'nuxt-com', purpose: 'verify-editing', template: slug }
  })
  const started = Date.now()
  try {
    console.log(`${slug}: installing ${template.repo}`)
    const install = await sandbox.runCommand({
      cmd: 'bash', args: ['-c', `mkdir -p ${TEMPLATE_WORKDIR} && cp -a /vercel/${repo}${directory.length ? `/${directory.join('/')}` : ''}/. ${TEMPLATE_WORKDIR}/ && cd ${TEMPLATE_WORKDIR} && ${INSTALL_SCRIPT}`],
      signal: AbortSignal.timeout(12 * 60_000)
    })
    assert.equal(install.exitCode, 0, (await install.output()).slice(-2500))
    console.log(`${slug}: starting development server`)
    await waitForDevServer(sandbox)
    const files = await listAppFiles(sandbox)
    const path = ['content/index.md', 'content/1.index.md', 'app/app.vue', 'app.vue'].find(path => files.includes(path))
    assert(path, `${slug}: no supported home-page source found`)
    const file = await readAppFile(sandbox, path)
    assert(file && !file.truncated, `${path} could not be read in full`)
    const before = `Editor check ${crypto.randomUUID()}`
    const after = `${before} updated`
    const content = path.endsWith('.md')
      ? `${file.content}\n\n${before}\n`
      : file.content.slice(0, file.content.lastIndexOf('</template>')) + `<p>${before}</p>` + file.content.slice(file.content.lastIndexOf('</template>'))
    assert(content.includes(before), `Could not add visible text to ${path}`)
    async function check(expected: string) {
      const page = await checkAppPage(sandbox, '/')
      assert.equal(page.status, 200)
      assert(!page.devServerErrors?.length, page.devServerErrors?.join('\n'))
      // The tool deliberately limits its text excerpt; check the full HTML without serialized payloads.
      const html = await sandbox.readFileToBuffer({ path: '/tmp/nuxt-com-page.html' })
      const document = new window.DOMParser().parseFromString(html!.toString(), 'text/html')
      document.querySelectorAll('script, style, template').forEach(element => element.remove())
      assert(document.body.textContent.includes(expected), 'Edited text is missing from the rendered page')
    }
    for (const expected of [before, after]) {
      const offset = await devLogSize(sandbox)
      await writeAppFile(sandbox, path, content.replace(before, expected))
      if (path.endsWith('.md')) await waitForContent(sandbox, offset)
      await check(expected)
    }
    await writeAppFile(sandbox, 'editor-check.txt', before)
    assert.equal((await readAppFile(sandbox, 'editor-check.txt'))?.content, before)
    await deleteAppFile(sandbox, 'editor-check.txt')
    assert.equal(await readAppFile(sandbox, 'editor-check.txt'), null)
    const config = files.find(path => /^nuxt\.config\.[cm]?[jt]s$/.test(path))
    assert(config, 'No Nuxt config found')
    const original = await readAppFile(sandbox, config)
    assert(original && !original.truncated)
    const offset = await devLogSize(sandbox)
    await writeAppFile(sandbox, config, `${original.content}\n// Editor restart check\n`)
    await waitForRestart(sandbox, offset)
    if (module) assert.equal((await addAppModule(sandbox, module)).exitCode, 0)
    await check(after)
    console.log(`PASS ${slug}: read, edit, delete, page, restart${module ? `, ${module}` : ''} (${Math.round((Date.now() - started) / 1000)}s)`)
  } catch (error) {
    console.error(`FAIL ${slug}:`, error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  } finally {
    await sandbox.stop()
  }
}

await window.happyDOM.close()
