import { GithubRequestError, request } from '../github-files.js'
import { checkedMediaType } from './media-type.js'

/** The variable that holds the personal access token captures are attached with. */
export const ATTACHMENTS_TOKEN_ENV = 'NUXI_GITHUB_ATTACHMENTS_PAT'

/** GitHub's limit for an attached image, and for a video in a repository on a free plan. */
const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024

interface PublishInput {
  /** `owner/name`: an attachment belongs to a repository. */
  readonly repository: string
  /** File name with its extension. */
  readonly name: string
  readonly bytes: Uint8Array
  readonly fetchImpl?: typeof fetch
}

/**
 * Attach an image or a clip to `repository`, the way a file dropped into a pull request
 * description is, and return its URL once GitHub serves it. It is the request `gh --attach` makes.
 *
 * GitHub accepts that upload from a personal access token only. It answers 404 to every token the
 * `nuxi-code` App can give, its own and the one of a person signed in through it, so the token of
 * the person who asked is never used here. The token is read from `NUXI_GITHUB_ATTACHMENTS_PAT`,
 * and its account, which needs write access to the repository, owns the attachment.
 *
 * Until the URL is in a pull request, an issue or a comment of a public repository, GitHub answers
 * 404 to a reader who is not signed in. From then on anyone can open it. GitHub has no way to
 * delete an attachment.
 */
export async function publishMedia({ repository, name, bytes, fetchImpl = fetch }: PublishInput) {
  const mediaType = checkedMediaType(name, bytes, MAX_ATTACHMENT_BYTES)
  const token = process.env[ATTACHMENTS_TOKEN_ENV]
  if (!token) throw new Error(`${ATTACHMENTS_TOKEN_ENV} is not set, so there is no token to attach the capture with.`)
  const github = { token, fetchImpl }

  // An attachment names its repository by numeric id.
  const { id } = await request<{ id: number }>(github, `https://api.github.com/repos/${repository}`)
  const query = new URLSearchParams({ name, content_type: mediaType, repository_id: String(id) })
  const { url } = await request<{ url?: string }>(github, `https://uploads.github.com/user-attachments/assets?${query}`, bytes).catch((error: unknown) => {
    // The upload answers 404, not 403, to a token it doesn't accept.
    if (error instanceof GithubRequestError && error.status === 404) {
      throw new GithubRequestError(`GitHub refused the attachment (HTTP 404). ${ATTACHMENTS_TOKEN_ENV} must be a personal access token whose account can write to ${repository}: a classic one needs the \`repo\` scope.`, 404)
    }
    throw error
  })
  if (!url) throw new Error('GitHub returned no URL for the attachment.')

  // A URL is a claim until it loads: nothing unverified goes into a pull request. Read with the
  // token, since nothing references the attachment yet.
  const served = await fetchImpl(url, { headers: { authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(30_000) })
  await served.body?.cancel()
  if (!served.ok) throw new Error(`Uploaded, but ${url} answers HTTP ${served.status}.`)

  return { url, mediaType, bytes: bytes.byteLength }
}
