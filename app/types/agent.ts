export interface FaqCategory {
  category: string
  items: string[]
}

export type FaqQuestions = string[] | FaqCategory[]
