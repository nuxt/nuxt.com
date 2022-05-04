import { isEmpty } from 'lodash-es'
import * as matter from 'gray-matter'
import flat from 'flat'

export const useMarkdown = () => {
  function parseFrontMatter (content: string) {
    // @ts-ignore
    const { data, content: c, ...rest } = matter.default ? matter.default(content) : matter(content)

    // unflatten frontmatter data
    // convert `parent.child` keys into `parent: { child: ... }`
    const unflattenData = flat.unflatten(data || {}, {})

    return {
      content: c.replace(/^\n/, ''),
      matter: unflattenData,
      ...rest
    }
  }

  function stringifyFrontMatter (content: string, data = {}) {
    // flatten frontmatter data
    // convert `parent: { child: ... }` into flat keys `parent.child`
    data = flat.flatten(data, {
      // preserve arrays and their contents as is and do not waltk through arrays
      // flatten array will be like `parent.0.child` and `parent.1.child` with is not readable
      safe: true
    })

    // eslint-disable-next-line import/no-named-as-default-member
    return matter.stringify(isEmpty(data) ? content : `\n${content}`, data)
  }

  return {
    parseFrontMatter,
    stringifyFrontMatter
  }
}
