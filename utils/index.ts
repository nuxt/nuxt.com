import { splitByCase, upperFirst } from 'scule'

export const { format: formatNumber } = Intl.NumberFormat('en-GB', { notation: 'compact', maximumFractionDigits: 1 })

// Case-insensitive RegExp, escaping special characters
// https://stackoverflow.com/a/38151393/3926832
export const searchTextRegExp = function (query = '') {
  return new RegExp(query.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'i')
}

export const formatDateByLocale = (locale, d) => {
  return new Date(d).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

export const toRelativeDate = (date) => {
  const diff = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000)
  if (diff < 60) {
    return 'just now'
  } else if (diff < 3600) {
    return `${Math.floor(diff / 60)} minutes ago`
  } else if (diff < 86400) {
    return `${Math.floor(diff / 3600)} hours ago`
  } else if (diff < 604800) {
    return `${Math.floor(diff / 86400)} days ago`
  } else if (diff < 2592000) {
    return `${Math.floor(diff / 604800)} weeks ago`
  } else if (diff < 31536000) {
    return `${Math.floor(diff / 2592000)} months ago`
  } else {
    return `${Math.floor(diff / 31536000)} years ago`
  }
}

export const slugify = (str: string) => str.toLowerCase().replace(/[^a-z0-9 -]/g, ' ').replace(/[\s-]+/g, '-')

export const random = (arr: Array<any>) => {
  return arr[Math.floor(Math.random() * arr.length)]
}

import { splitByCase, upperFirst } from 'scule'

export const createBreadcrumb = (link: string = 'Missing link') => {
  if (link.startsWith('http')) {
    return link
  }
  return link.split('/').filter(Boolean).map(part => splitByCase(part).map(p => upperFirst(p)).join(' ')).join(' > ').replace('Api', 'API')
}
