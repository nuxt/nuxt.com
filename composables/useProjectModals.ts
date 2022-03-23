const isBranchesModalOpen = ref(false)
const isFilesModalOpen = ref(false)

function openFilesModal () {
  isFilesModalOpen.value = true
}

function openBranchesModal () {
  isBranchesModalOpen.value = true
}

export const useProjectModals = () => {
  return {
    isBranchesModalOpen,
    isFilesModalOpen,
    openBranchesModal,
    openFilesModal
  }
}
