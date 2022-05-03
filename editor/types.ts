import type { Ref, UnwrapRef } from 'vue'

type MaybeRef<T> = Ref<T> |T

export type PropType = 'string' | 'number' | 'boolean' | 'array' | 'object' | 'func'

export interface ComponentPropSchema {
  name: string
  type: PropType[]
  default?: string
  required?: boolean
  values?: string[]
}

export interface ComponentSlotSchema {
  name: string
}

export interface ComponentSchema {
  name: string
  props: ComponentPropSchema[]
  slots: ComponentSlotSchema[]
}

export interface Options {
  content?: MaybeRef<string>
  components?: MaybeRef<ComponentSchema[]>
  onChanged?: (content: string) => void
  room?: MaybeRef<string>
}

export type UnwrapOptions = { [K in keyof Options]-?: UnwrapRef<Options[K]> }
