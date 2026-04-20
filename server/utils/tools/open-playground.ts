import { tool } from 'ai'
import { z } from 'zod'

export const openPlaygroundTool = tool({
  description: 'Generate a StackBlitz playground link for a Nuxt example or GitHub repository. Use when the user wants to try code live, see a working example, or experiment with a Nuxt feature in the browser.',
  inputSchema: z.object({
    repo: z.string().regex(/^[\w.-]+\/[\w.-]+$/).describe('GitHub repository in "owner/repo" format (e.g., "nuxt/starter", "nuxt-ui-templates/dashboard")'),
    branch: z.string().default('main').describe('Branch name'),
    dir: z.string().default('').describe('Subdirectory path within the repo'),
    file: z.string().default('app.vue').describe('Default file to open'),
    title: z.string().optional().describe('Display title for the playground')
  }),
  execute: async ({ repo, branch, dir, file, title }) => {
    const [owner, name] = repo.split('/') as [string, string]
    const encodedBranch = encodeURIComponent(branch)
    const encodedDir = dir
      ? dir.split('/').filter(Boolean).map(encodeURIComponent).join('/')
      : ''
    const dirPath = encodedDir ? `/tree/${encodedBranch}/${encodedDir}` : `/tree/${encodedBranch}`
    const url = `https://stackblitz.com/github/${encodeURIComponent(owner)}/${encodeURIComponent(name)}${dirPath}?file=${encodeURIComponent(file)}`

    return {
      url,
      repo,
      branch,
      dir,
      file,
      title: title || name || repo
    }
  }
})
