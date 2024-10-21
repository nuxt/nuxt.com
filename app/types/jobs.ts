export interface Job {
  title: string
  link: string
  description: string
  remote: string
  locations: string[]
  organization: {
    name: string
    avatar: string
  }
  published_at: string
}
