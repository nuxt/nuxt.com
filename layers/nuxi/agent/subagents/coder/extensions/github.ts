import githubExtension from '@github-tools/eve-extension'
import { DEFAULT_REPOSITORY, GITHUB_CONNECTOR, GITHUB_REPOSITORIES } from '../../../lib/github.js'

const [owner, repo] = DEFAULT_REPOSITORY.split('/')

// Mounted under the coder subagent only, so the root agent and its public sessions never list
// these tools. `githubToolsApproval` in the root `agent.ts` still gates every call.
export default githubExtension({
  connector: GITHUB_CONNECTOR,
  preset: 'pr-author',
  // Reading a repository and its pull requests, and opening a pull request. Files reach GitHub
  // through `commit_changes` only, from a clone the coder could run: one way to commit, with one
  // rule for the branch it goes to. Review-thread tools can come later.
  exclude: [
    'createBranch', // `commit_changes` creates the branch it commits to
    'editFiles',
    'createOrUpdateFile',
    'deleteBranch',
    'getBranchRules',
    'getCollaboratorPermission', // calls run with the asker's own token, so GitHub enforces their role
    'updatePullRequestBranch',
    'listPullRequestReviewThreads',
    'replyToReviewComment',
    'resolveReviewThread',
    'getCommit',
    'compareCommits',
    'searchCode' // a free-text query: `repositories` can't hold it to the allowed repositories
  ],
  // Calls default to the first repository and are refused outside the list, whose syntax is the guardrail's.
  context: { owner, repo },
  guardrails: { repositories: [...GITHUB_REPOSITORIES] },
  // Each call runs as the person who asked, so the pull request is theirs on GitHub. Someone who
  // hasn't connected GitHub yet gets a sign-in prompt instead of the App. Only `pnpm nuxi` with
  // `NUXI_CLI_ADMIN=1`, which has no GitHub user, runs as the App, for local testing.
  // `attribution` (on by default) credits the App with a PR footer.
  actAs: 'caller',
  // Opening a pull request needs no click: it changes no code, and a person reviews and merges it
  // on GitHub. Editing an existing pull request (`updatePullRequest`) still asks.
  requireApproval: { createPullRequest: 'never' }
})
