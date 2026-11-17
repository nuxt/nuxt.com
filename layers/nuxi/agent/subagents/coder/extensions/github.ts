import githubExtension from '@github-tools/eve-extension'
import { GITHUB_CONNECTOR } from '../../../lib/github.js'

// Mounted under the coder subagent only, so the root agent and its public sessions never list
// these tools. `githubToolsApproval` in the root `agent.ts` still gates every call.
export default githubExtension({
  connector: GITHUB_CONNECTOR,
  preset: 'pr-author',
  // Only what opening a pull request needs. Review-thread and branch-maintenance tools can come later.
  exclude: [
    'deleteBranch',
    'createOrUpdateFile', // `editFiles` commits one or more files in a single commit
    'getBranchRules',
    'getCollaboratorPermission', // calls run with the asker's own token, so GitHub enforces their role
    'updatePullRequestBranch',
    'listPullRequestReviewThreads',
    'replyToReviewComment',
    'resolveReviewThread',
    'getCommit',
    'compareCommits',
    'searchCode' // a free-text query: `repositories` can't hold a `repo:` qualifier to nuxt/nuxt.com
  ],
  context: { owner: 'nuxt', repo: 'nuxt.com' },
  guardrails: { repositories: ['nuxt/nuxt.com'], branches: ['nuxi/*'] },
  // Each call runs as the person who asked, so the pull request and its commits are theirs on
  // GitHub. Someone who hasn't connected GitHub yet gets a sign-in prompt instead of the App. Only
  // `pnpm nuxi` with `NUXI_CLI_ADMIN=1`, which has no GitHub user, runs as the App, for local testing.
  // `attribution` (on by default) credits the App with a PR footer and a commit co-author.
  actAs: 'caller',
  // Opening a pull request needs no click: the guardrails keep it on a new `nuxi/*` branch of
  // nuxt/nuxt.com, and a person reviews and merges it on GitHub. Editing an existing pull request
  // (`updatePullRequest`) still asks.
  requireApproval: {
    createBranch: 'never',
    editFiles: 'never',
    createPullRequest: 'never'
  }
})
