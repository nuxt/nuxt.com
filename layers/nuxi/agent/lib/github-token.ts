import { connect } from '@vercel/connect/eve'
import type { ToolContext } from 'eve/tools'
import { appToken, GITHUB_CONNECTOR } from './github.js'
import { GithubRequestError } from './github-files.js'

const userAuth = connect(GITHUB_CONNECTOR)

/**
 * Run `call` with a GitHub token for `repository`, chosen like the GitHub tools' `actAs: 'caller'`:
 * the token of the person who asked, or the App's when no person drives the turn. A person whose
 * token GitHub rejects is asked to sign in again.
 */
export async function withGithubToken<T>(ctx: ToolContext, repository: string, call: (token: string) => Promise<T>): Promise<T> {
  if (ctx.session.auth.current?.principalType !== 'user') return call(await appToken(repository))

  const { token } = await ctx.getToken(userAuth)
  try {
    return await call(token)
  } catch (error) {
    if (error instanceof GithubRequestError && error.status === 401) ctx.requireAuth(userAuth)
    throw error
  }
}
