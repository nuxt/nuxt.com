import { useClipboard as _useClipboard } from '@vueuse/core'

type toastOptions = {
  title?: string
  description?: string
  icon?: string
  color?: 'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'error' | 'important' | 'neutral'
}

export const useClipboard = () => {
  const { copy: _copy, copied } = _useClipboard()

  const toast = useToast()

  const copy = async (source: string, optionsOptions?: toastOptions) => {
    await _copy(source)
    if (!copied.value) throw new Error('Could not copy to clipboard')
    if (optionsOptions) {
      toast.add(optionsOptions)
    }
  }

  return {
    copy,
    copied
  }
}
