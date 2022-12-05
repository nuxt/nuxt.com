export const capitalize = function (str: string) {
  return str?.charAt(0).toUpperCase() + str?.slice(1)
}

export const formatNumber = function (num: number, fractionDigits = 0) {
  if (num > 999 && num < 1000000) {
    return (num / 1000).toFixed(fractionDigits) + 'k' // convert to K for number from > 1000 < 1 million
  } else if (num > 1000000) {
    return (num / 1000000).toFixed(fractionDigits) + 'm' // convert to M for number from > 1 million
  } else {
    return String(num)
  }
}

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
