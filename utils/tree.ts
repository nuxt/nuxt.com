export function findFileFromPath (path, files) {
  for (const file of files) {
    if (file.path === path) {
      return file
    }
    if (file.children) {
      const result = findFileFromPath(path, file.children)
      if (result) { return result }
    }
  }
}
