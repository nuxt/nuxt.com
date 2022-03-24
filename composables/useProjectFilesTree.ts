import type { GitHubFile, Project, Root } from '~/types'
import { mapTree, findTree, renamePath, getPathDir } from '~/utils/tree'

const openedDirs = reactive({})

export const useProjectFilesTree = (project: Project, root: Root) => {
  const { computedFiles, bulkRename } = useProjectFiles(project, root)

  // Methods

  function openDir (path: string, value?: boolean) {
    openedDirs[path] = value !== undefined ? value : !openedDirs[path]
  }

  function renameFiles (src: GitHubFile, dst: GitHubFile, position: 'above' | 'below' | 'over') {
    const filesToRename = []
    // Find files parents
    const srcDir = getPathDir(src.path)
    const dstDir = getPathDir(dst.path)
    // Find files tree
    const srcTree = findTree(src.path, tree.value)
    const dstTree = findTree(dst.path, tree.value)
    // Find files indexes in respective tree
    const srcIndex = srcTree.filter(f => f.type !== 'directory').findIndex(f => f.path === src.path)
    const dstIndex = dstTree.filter(f => f.type !== 'directory').findIndex(f => f.path === dst.path)
    // Src and dst index are the same
    const sameTree = srcDir === dstDir
    // Increment index only if src file is below / above current file or tree is different
    let index = dstIndex === -1 ? 0 : dstIndex
    if (sameTree) {
      if (position === 'below' && srcIndex > dstIndex) {
        index += 1
      } else if (position === 'above' && dstIndex > srcIndex) {
        index -= 1
      }
    } else if (position === 'below') {
      index += 1
    }

    filesToRename.push({ oldPath: src.path, newPath: renamePath(src.path, dst.path, index + 1) })

    if (sameTree) {
      if (srcIndex > dstIndex) {
        // I move a file up
        for (let i = position === 'below' ? (dstIndex + 1) : dstIndex; i < srcIndex; i++) {
          filesToRename.push({ oldPath: srcTree[i].path, newPath: renamePath(srcTree[i].path, srcTree[i].path, i + 2) })
        }
      } else {
        // I move a file down
        for (let i = position === 'above' ? (dstIndex - 1) : dstIndex; i > srcIndex; i--) {
          filesToRename.push({ oldPath: srcTree[i].path, newPath: renamePath(srcTree[i].path, srcTree[i].path, i) })
        }
      }
    } else {
      // Rename `srcTree` files after `srcIndex`
      for (let i = srcIndex + 1; i < srcTree.length; i++) {
        filesToRename.push({ oldPath: srcTree[i].path, newPath: renamePath(srcTree[i].path, srcTree[i].path, i) })
      }
      // Rename `dstTree` files after `dstIndex`
      for (let i = position === 'below' ? (dstIndex + 1) : dstIndex; i < dstTree.length; i++) {
        filesToRename.push({ oldPath: dstTree[i].path, newPath: renamePath(dstTree[i].path, dstTree[i].path, i + 2) })
      }
    }

    bulkRename(filesToRename.filter(f => f.oldPath !== f.newPath))
  }

  // Computed

  const tree = computed(() => {
    const files = [...computedFiles.value]
    files.sort((a, b) => a.path.localeCompare(b.path, undefined, {
      numeric: true,
      sensitivity: 'base'
    }))

    return mapTree(files)
  })

  return {
    // Methods
    openDir,
    renameFiles,
    // Computed
    tree,
    // Data
    openedDirs: readonly(openedDirs)
  }
}
