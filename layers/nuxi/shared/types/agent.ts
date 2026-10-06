export type NuxiMood = 'idle' | 'happy' | 'excited' | 'thinking' | 'sleeping' | 'surprised' | 'sad' | 'confused'

export interface FaqCategory {
  category: string
  items: string[]
}

export type FaqQuestions = string[] | FaqCategory[]
