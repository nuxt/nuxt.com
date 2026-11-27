import { getToken } from '@vercel/connect'
import type { ApprovalPolicy } from 'eve/tools/approval'
import { z } from 'zod'
import { openPullRequestOf } from './github-files.js'
import { isAdminMode } from './identity/admin-mode.js'
import { resolveContext, type AuthContext, type Surface } from './identity/context.js'

/** The `nuxi-code` GitHub App on the nuxt org, connected to every environment of the project. */
export const GITHUB_CONNECTOR = 'github/nuxi-code'

/**
 * The repositories the coder may write to. An entry is `owner/name`, or `owner/*` for every
 * repository of that account: the syntax of the GitHub tools' `repositories` guardrail, which reads
 * this list too. The first entry names one repository, the default of every tool.
 *
 * This list is the only thing that holds Nuxi to these repositories. Nothing else in the coder
 * names one: its tools take the repository as an input, and every write runs with the GitHub token
 * of the person who asked. GitHub accepts that token only where the `nuxi-code` App is installed
 * and the person has access, with the role the person has there. So a wider list, such as
 * `nuxt/*`, gives nobody more than GitHub already gives them. Whatever the repository, a commit
 * goes to a `nuxi/*` branch or to the branch of an open pull request, never to the default branch.
 */
export const GITHUB_REPOSITORIES: readonly [string, ...string[]] = ['nuxt/nuxt.com']
export const DEFAULT_REPOSITORY = GITHUB_REPOSITORIES[0]

const REPOSITORY_PART = /^[\w.-]+$/

/**
 * The repository of `allowed` that `repository` names, with its owner written as the list writes
 * it, if any. GitHub ignores the case of owners and repository names, and so does the
 * `repositories` guardrail of the GitHub tools.
 */
export function allowedRepository(repository: unknown, allowed: readonly string[] = GITHUB_REPOSITORIES): string | undefined {
  if (typeof repository !== 'string') return undefined
  const [owner = '', name = '', ...rest] = repository.split('/')
  if (rest.length || !REPOSITORY_PART.test(owner) || !REPOSITORY_PART.test(name) || name === '.' || name === '..') return undefined
  for (const entry of allowed) {
    const [entryOwner = '', entryName = ''] = entry.split('/')
    if (entryOwner.toLowerCase() !== owner.toLowerCase()) continue
    if (entryName === '*') return `${entryOwner}/${name}`
    if (entryName.toLowerCase() === name.toLowerCase()) return entry
  }
  return undefined
}

/** A tool input that names a repository to write to: one the list allows, and the default when omitted. */
export function repositoryInput(description: string) {
  return z.string().max(140)
    .refine(repository => allowedRepository(repository) !== undefined, { error: `Not a repository Nuxi works on: ${GITHUB_REPOSITORIES.join(', ')}.` })
    .default(DEFAULT_REPOSITORY)
    .describe(description)
}

const GITHUB_SURFACES = new Set<Surface>(['slack', 'discord', 'cli'])

/**
 * A human on Slack, someone in a `discord.channels.admin` channel, or `pnpm nuxi` with
 * `NUXI_CLI_ADMIN=1` to try it locally. `isAdminMode` decides within each surface.
 */
export async function canUseGithubTools(auth: AuthContext | null | undefined): Promise<boolean> {
  return GITHUB_SURFACES.has(resolveContext(auth).surface) && isAdminMode(auth)
}

/** For the `execute` of the coder's own tools: a session can continue with a different caller than the one it started with. */
export async function assertCanUseGithubTools(auth: AuthContext | null | undefined): Promise<void> {
  if (!(await canUseGithubTools(auth))) {
    throw new Error('This tool is only available to the Nuxt team on Slack and in admin Discord channels.')
  }
}

/** A token of the App itself for `repository`, for a call no person's token is at hand for. */
export function appToken(repository: string): Promise<string> {
  const [org = '', name = ''] = repository.split('/')
  return getToken(GITHUB_CONNECTOR, {
    subject: { type: 'app' },
    authorizationDetails: [{ type: 'github_app_installation', org, repositories: [name] }]
  })
}

/**
 * Whether `branch` has an open pull request: work someone may be reviewing, which the coder may
 * not have opened. Not knowing counts as yes.
 */
async function hasOpenPullRequest(repository: string, branch: string): Promise<boolean> {
  try {
    return await openPullRequestOf({ repository, branch, token: await appToken(repository) }) !== undefined
  } catch (error) {
    console.warn(`[nuxi] could not look up the pull request of ${repository}@${branch}, so the commit asks for approval`, error)
    return true
  }
}

/**
 * Agent-wide, so it also covers the coder subagent, which only these sessions are offered.
 *
 * - A second line of defense: anywhere else, every `github__*` call, read or write, is denied
 *   before it reaches GitHub.
 * - `commit_changes`, the only tool that writes files to GitHub, asks the person first when the
 *   branch already has an open pull request, like `updatePullRequest`: the coder's own on a
 *   follow-up, or someone else's, such as a dependency update whose conflict it was asked to fix.
 * - A commit this policy can't place, with no branch or a repository outside the list, is denied.
 *   Letting it through would rely on the tool to refuse it, and the two once read the same input
 *   differently: `Nuxt/nuxt.com` was unknown here and allowed there.
 */
export const githubToolsApproval: ApprovalPolicy = async ({ toolName, toolInput, session }) => {
  if (toolName.startsWith('github__') && !(await canUseGithubTools(session.auth.current))) {
    return { type: 'denied', reason: 'GitHub tools are only available to the Nuxt team on Slack and in admin Discord channels.' }
  }
  if (toolName !== 'commit_changes') return undefined

  // Read like the tool's schema reads them: the default repository only when none is given.
  const { repository: named = DEFAULT_REPOSITORY, branch } = toolInput ?? {}
  const repository = allowedRepository(named)
  if (!repository || typeof branch !== 'string' || !branch) {
    return { type: 'denied', reason: `A commit names a branch of one of these repositories: ${GITHUB_REPOSITORIES.join(', ')}.` }
  }
  return await hasOpenPullRequest(repository, branch) ? 'user-approval' : undefined
}
