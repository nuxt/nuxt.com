export interface Template {
  name: string
  slug: string
  description: string
  repo?: string
  demo: string
  purchase?: string
  featured?: boolean
  badge?: 'Premium' | 'Freemium' | 'Free'
  screenshotUrl?: string
  screenshotOptions?: {
    delay: number
  }
}
