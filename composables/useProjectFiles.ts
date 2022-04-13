import type { Ref } from 'vue'
import { omit } from 'lodash-es'
import { useStorage } from '@vueuse/core'
import type { GitHubFile, GitHubDraft, Project, Root } from '~/types'
import ProjectModalFileCreate from '~/components/organisms/project/modal/ProjectModalFileCreate.vue'
import ProjectModalFileRename from '~/components/organisms/project/modal/ProjectModalFileRename.vue'
import ProjectModalFileDelete from '~/components/organisms/project/modal/ProjectModalFileDelete.vue'
import ProjectModalFileRevert from '~/components/organisms/project/modal/ProjectModalFileRevert.vue'

export const useProjectFiles = (project: Project, root: Root) => {
  const { open: openModal } = useModal()
  const client = useStrapiClient()
  const { branch } = useProjectBranches(project)

  const recentFiles: Ref<GitHubFile[]> = useState(`project-${project.id}-${root}-files-recent`, () => null)
  if (process.client) {
    const recentFilesStorage = useStorage<GitHubFile[]>(`project-${project.id}-${root}-files-recent`, [])
    recentFiles.value = recentFilesStorage.value
    watch(recentFiles, (value) => { recentFilesStorage.value = value })
  }

  const files: Ref<GitHubFile[]> = useState(`project-${project.id}-${root}-files`, () => null)
  const draft: Ref<GitHubDraft> = useState(`project-${project.id}-${root}-draft`, () => null)
  const file: Ref<GitHubFile> = useState(`project-${project.id}-${root}-file`, () => null)

  const pending = ref(false)

  // Http

  async function fetch (force?: boolean) {
    if (!branch.value) {
      return
    }

    if (files.value !== null && !force) {
      return
    }

    pending.value = true

    const data = await client<{ files: GitHubFile[], draft: GitHubDraft }>(`/projects/${project.id}/files`, {
      params: {
        ref: branch.value.name,
        root
      }
    })

    files.value = data.files
    draft.value = data.draft

    pending.value = false

    init()
  }

  function refresh () {
    return fetch(true)
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

      draft.value = data

      if (file.value?.path === oldPath) {
        select(computedFiles.value.find(file => file.path === newPath))
      } else if (file.value?.path === newPath) {
        file.value.status = 'renamed'
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

      draft.value = data

      // Select new file when deleted was selected
      if (file.value?.path === path) {
        file.value = null
        init()
      }
    } catch (e) {}
  }

  async function fetchFile (path: string) {
    return await client<GitHubFile>(`/projects/${project.id}/files/${encodeURIComponent(path)}`, {
      params: {
        ref: branch.value?.name,
        root
      }
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
    const currentFile = file.value?.path ? computedFiles.value.find(f => f.path === file.value.path) : null

    select(currentFile || computedFiles.value.find(file => file.path.toLowerCase().endsWith('index.md') && file.status !== 'deleted') || computedFiles.value.find(file => file.type === 'blob' && file.status !== 'deleted'))
  }

  function select (f: GitHubFile) {
    file.value = f

    if (f) {
      const updatedRecentFiles = [...recentFiles.value]
      const index = updatedRecentFiles.findIndex(rf => rf.path === f.path)
      if (index !== -1) {
        updatedRecentFiles.splice(index, 1)
      }
      recentFiles.value = [f, ...updatedRecentFiles].slice(0, 6)
    }
  }

  function mergeDraftInFiles () {
    files.value = computedFiles.value.reduce((files, file) => {
      if (file.status === 'deleted') { return files }
      delete file.status
      files.push(file)
      return files
    }, [])

    draft.value = null
  }

  // Computed

  const computedFiles: Ref<GitHubFile[]> = computed(() => {
    const additions = draft.value?.additions.map(a => ({ ...a })) || []
    const deletions = draft.value?.deletions.map(a => ({ ...a })) || []

    const githubFiles = files.value?.map(file => ({ ...file, name: file.path.split('/').pop() })) || []

    for (const addition of additions) {
      if (addition.oldPath) {
        deletions.splice(deletions.findIndex(d => d.path === addition.oldPath), 1)
        const file = githubFiles.find(f => f.path === addition.oldPath)
        if (file) {
          file.status = 'renamed'
          file.name = addition.path.split('/').pop()
          file.path = addition.path
          file.oldPath = addition.oldPath
        }
      } else if (addition.new) {
        githubFiles.push({
          name: addition.path.split('/').pop(),
          type: 'blob',
          status: 'created',
          ...omit(addition, ['new', 'oldPath'])
        })
      } else {
        const file = githubFiles.find(f => f.path === addition.path)
        if (file) {
          file.status = 'updated'
        }
      }
    }
    for (const deletion of deletions) {
      const file = githubFiles.find(f => f.path === deletion.path)
      if (file) {
        file.status = 'deleted'
      }
    }
    return githubFiles
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
    openRenameModal,
    openDeleteModal,
    openRevertModal,
    // Methods
    select,
    init,
    mergeDraftInFiles,
    // Refs
    pending,
    // Computed
    computedFiles,
    isDraft,
    // Data
    recentFiles,
    file,
    draft
  }
}
