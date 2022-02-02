export interface Avatar {
  url: string
}

export interface Team {
  id: number
  name: string
  slug: string
  avatar: Avatar
}

export interface User {
  id: number
  username: string
  name: string
  email: string
  avatar: string
  teams: Team[]
}
