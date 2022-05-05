import type { Ref } from 'vue'
import { omit, identity, pickBy } from 'lodash-es'
import type { GitHubFile, GitHubDraft, Project, Root, PreviewToken } from '~/types'
import ProjectModalFileCreate from '~/components/project/modal/ProjectModalFileCreate.vue'
import ProjectModalFileRename from '~/components/project/modal/ProjectModalFileRename.vue'
import ProjectModalFileDelete from '~/components/project/modal/ProjectModalFileDelete.vue'
import ProjectModalFileRevert from '~/components/project/modal/ProjectModalFileRevert.vue'

const uploadInput: Ref<HTMLInputElement | null> = ref(null)

export const useProjectFiles = (project: Project, root: Root) => {
  const { $socket } = useNuxtApp()
  const { open: openModal } = useModal()
  const client = useStrapiClient()
  const cookie = useCookie(`project-${project.id}-${root}-file`, { path: '/' })
  const { branch } = useProjectBranches(project)

  const recentFiles: Ref<GitHubFile[]> = useState(`project-${project.id}-${root}-files-recent`, () => [])
  const files: Ref<GitHubFile[]> = useState(`project-${project.id}-${root}-files`, () => null)
  const draft: Ref<GitHubDraft> = useState(`project-${project.id}-${root}-draft`, () => null)
  const file: Ref<GitHubFile> = useState(`project-${project.id}-${root}-file`, () => null)
  const token: Ref<PreviewToken> = useState(`project-${project.id}-${root}-token`, () => null)

  const pending = ref(false)

  // Http

  async function fetch ({ force, resetCache }: { force?: boolean, resetCache?: boolean } = {}) {
    if (!branch.value) {
      return
    }

    if (files.value !== null && !force && !resetCache) {
      return
    }

    pending.value = true

    const data = await client<{ files: GitHubFile[], draft: GitHubDraft, token: PreviewToken }>(`/projects/${project.id}/files`, {
      params: {
        ref: branch.value.name,
        root,
        force: resetCache
      }
    })

    files.value = data.files
    draft.value = data.draft
    token.value = data.token

    pending.value = false

    init()
  }

  function refresh (resetCache?: boolean) {
    return fetch({ force: true, resetCache })
  }

  async function create (path: string) {
    try {
      const data = await client<GitHubDraft>(`/projects/${project.id}/files`, {
        method: 'POST',
        params: {
          ref: branch.value.name,
          root
        },
        body: { path }
      })

      $socket.emit('draft:update', `project-${project.id}:${branch.value.name}`)

      draft.value = data

      select(computedFiles.value.find(file => file.path === path))
    } catch (e) {}
  }

  async function upload (path: string, formData: FormData) {
    formData.append('data', JSON.stringify({ path }))

    try {
      const data = await client<GitHubDraft>(`/projects/${project.id}/files/upload`, {
        method: 'POST',
        params: {
          ref: branch.value.name,
          root
        },
        body: formData
      })

      draft.value = data

      select(computedFiles.value.find(file => file.path === path))
    } catch (e) {}
  }

  async function rename (oldPath: string, newPath: string) {
    try {
      const data = await client<GitHubDraft>(`/projects/${project.id}/files/rename`, {
        method: 'PUT',
        params: {
          ref: branch.value?.name,
          root
        },
        body: {
          files: [{
            oldPath,
            newPath
          }]
        }
      })

      $socket.emit('draft:update', `project-${project.id}:${branch.value.name}`)

      draft.value = data

      if (file.value?.path === oldPath) {
        select(computedFiles.value.find(file => file.path === newPath))
      }
    } catch (e) {}
  }

  async function bulkRename (files) {
    if (!files.length) {
      return
    }

    try {
      const data = await client<GitHubDraft>(`/projects/${project.id}/files/rename`, {
        method: 'PUT',
        params: {
          ref: branch.value?.name,
          root
        },
        body: {
          files
        }
      })

      $socket.emit('draft:update', `project-${project.id}:${branch.value.name}`)

      draft.value = data
    } catch (e) {}
  }

  async function revert (path: string) {
    try {
      const data = await client<GitHubDraft>(`/projects/${project.id}/files/${encodeURIComponent(path)}/revert`, {
        method: 'POST',
        params: {
          ref: branch.value?.name,
          root
        }
      })

      $socket.emit('draft:update', `project-${project.id}:${branch.value.name}`)

      const oldFilePath = draft.value.additions.find(addition => addition.path === path)?.oldPath

      draft.value = data

      const currentFileExists = !!computedFiles.value.find(f => f.path === file.value?.path)

      if (!currentFileExists) {
        if (oldFilePath) {
          // Select old file
          const oldFile = computedFiles.value.find(f => f.path === oldFilePath)
          select(oldFile)
        } else {
          // Select new file when reverted file no longer exists
          file.value = null
          init()
        }
      } else {
        // No new selection, fetch new content
        // FIXME: hacky update to trigger any watchers on `file`
        file.value = { ...file.value }
      }
    } catch (e) {}
  }

  async function _delete (path: string) {
    try {
      const data = await client<GitHubDraft>(`/projects/${project.id}/files/${encodeURIComponent(path)}`, {
        method: 'DELETE',
        params: {
          ref: branch.value?.name,
          root
        }
      })

      $socket.emit('draft:update', `project-${project.id}:${branch.value.name}`)

      draft.value = data

      // Select new file when deleted was selected
      if (file.value?.path === path) {
        init()
      }
    } catch (e) {}
  }

  async function fetchFile (path: string, force = false) {
    return await client<GitHubFile>(`/projects/${project.id}/files/${encodeURIComponent(path)}`, {
      params: pickBy({
        ref: branch.value?.name,
        root,
        force
      }, identity)
    })
  }

  // Modals

  function openCreateModal (path: string) {
    openModal(ProjectModalFileCreate, {
      computedFiles: computedFiles.value,
      path,
      onSubmit: create
    })
  }

  function openUploadModal () {
    uploadInput.value?.click()
  }

  function openRenameModal (oldPath: string, lockedPath?: string) {
    openModal(ProjectModalFileRename, {
      computedFiles: computedFiles.value,
      oldPath,
      lockedPath,
      onSubmit: rename
    })
  }

  function openDeleteModal (path: string) {
    openModal(ProjectModalFileDelete, {
      path,
      onSubmit: _delete
    })
  }

  function openRevertModal (path: string) {
    openModal(ProjectModalFileRevert, {
      path,
      onSubmit: revert
    })
  }

  // Methods

  function init () {
    let fileToSelect

    if (file.value) {
      fileToSelect = fileToSelect || computedFiles.value.find(f => f.path === file.value.path && f.status !== 'deleted')
    }
    if (cookie.value) {
      fileToSelect = fileToSelect || computedFiles.value.find(f => f.path === cookie.value && f.status !== 'deleted')
    }

    fileToSelect = fileToSelect || computedFiles.value.find(f => f.path.match(/^content\/[0-9.]*index\.md$/i) && f.status !== 'deleted')
    fileToSelect = fileToSelect || computedFiles.value.find(f => f.type === 'blob' && f.status !== 'deleted')

    select(fileToSelect)
  }

  function select (f: GitHubFile) {
    file.value = f
    cookie.value = file.value?.path

    if (file.value) {
      recentFiles.value = [{ ...file.value, openedAt: Date.now() }, ...recentFiles.value.filter(rf => rf.path !== file.value.path)]
    }

    if (process.client) {
      if (file.value) {
        root === 'content' && $socket.emit('file:join', `project-${project.id}:${branch.value.name}:${file.value.path}`)
      } else {
        root === 'content' && $socket.emit('file:leave', `project-${project.id}`)
      }
    }
  }

  // Computed

  const computedFiles: Ref<GitHubFile[]> = computed(() => {
    const additions = draft.value?.additions.map(a => ({ ...a })) || []
    const deletions = draft.value?.deletions.map(a => ({ ...a })) || []

    const githubFiles = files.value?.map(file => ({ ...file, name: file.path.split('/').pop() })) || []

    for (const addition of additions) {
      // File has been renamed
      if (addition.oldPath) {
        // Remove old file from deletions (only display renamed one)
        deletions.splice(deletions.findIndex(d => d.path === addition.oldPath), 1)

        // Custom case of #447
        const oldPathExistInCache = additions.find(a => a.path === addition.oldPath)
        if (oldPathExistInCache) {
          githubFiles.push({
            name: addition.path.split('/').pop(),
            type: 'blob',
            status: 'created',
            forceFetch: true,
            ...addition
          })
        // Update exsiting renamed file data
        } else {
          const file = githubFiles.find(f => f.path === addition.oldPath)
          if (file) {
            file.status = 'renamed'
            file.name = addition.path.split('/').pop()
            file.path = addition.path
            file.oldPath = addition.oldPath
          }
        }
      // File has been added
      } else if (addition.new) {
        githubFiles.push({
          name: addition.path.split('/').pop(),
          type: 'blob',
          status: 'created',
          ...omit(addition, ['new', 'oldPath'])
        })
      // File has been modified
      } else {
        const file = githubFiles.find(f => f.path === addition.path)
        if (file) {
          file.status = 'updated'
        }
      }
    }

    for (const deletion of deletions) {
      // File has been deleted
      const file = githubFiles.find(f => f.path === deletion.path)
      if (file) {
        file.status = 'deleted'
      }
    }
    return githubFiles
  })

  const computedFile: Ref<GitHubFile> = computed(() => {
    return computedFiles.value.find(f => f.path === file.value?.path)
  })

  const isDraft = computed(() => {
    let changesCount = (draft.value?.additions?.length || 0) + (draft.value?.deletions?.length || 0)

    // rework renames count
    if (draft.value?.additions?.length && draft.value?.deletions?.length) {
      for (const addition of draft.value.additions) {
        // if an addition and a deletion have the same path, count them as only one change
        if (addition.oldPath && draft.value.deletions.find(d => d.path === addition.oldPath)) {
          changesCount--
        }
      }
    }

    return changesCount
  })

  return {
    // Http
    fetch,
    refresh,
    upload,
    bulkRename,
    fetchFile,
    // Modals
    openCreateModal,
    openUploadModal,
    openRenameModal,
    openDeleteModal,
    openRevertModal,
    // Methods
    select,
    init,
    // Refs
    pending,
    uploadInput,
    // Computed
    computedFiles,
    computedFile,
    isDraft,
    // Data
    recentFiles,
    files,
    file: readonly(file),
    draft,
    token
  }
}
