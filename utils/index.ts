export const capitalize = function (str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export const formatNumber = function (num: number, fractionDigits?: number = 0) {
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
export const searchTextRegExp = function (query: string = '') {
  return new RegExp(query.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'i')
}
