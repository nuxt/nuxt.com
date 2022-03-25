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
