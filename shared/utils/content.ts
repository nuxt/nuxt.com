/** Entries directly under `prefix`, skipping dotfiles such as `.navigation.yml`. */
export function isChildPath(path: string, stem: string, prefix: string) {
  const dir = prefix.replace(/\/$/, '')
  return path.startsWith(`${dir}/`) && !stem.split('/').pop()?.startsWith('.')
}
