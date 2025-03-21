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

  const copy = (source: string, optionsOptions?: toastOptions) => {
    _copy(source)
    if (optionsOptions) {
      toast.add(optionsOptions)
    }
  }

  return {
    copy,
    copied
  }
}
