export const capitalize = function (str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export const toFormattedBytes = (bytes?: number) => {
  const units = ['bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
  let l = 0; let n = bytes || 0
  while (n >= 1024 && ++l) {
    n = n / 1024
  }
  return (n.toFixed(n < 10 && l > 0 ? 1 : 0) + ' ' + units[l])
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
