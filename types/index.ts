export interface Media {
  name: string,
  alternativeText: string,
  caption: string
  ext: string
  url: string
  previewUrl: string
}

export interface Member {
  id: number
  role: 'owner' | 'member'
  // eslint-disable-next-line no-use-before-define
  user: User
}

export interface Team {
  id: number
  name: string
  slug: string
  avatar: Media
  members: Member[]
  code: string
}

export interface Membership {
  id: number
  role: 'owner' | 'member'
  team: Team
}

export interface User {
  id: number
  username: string
  name: string
  email: string
  avatar: string
  memberships: Membership[]
  beta: boolean
}

export interface Template {
  id: number
  owner: string
  name: string
  branch: string
  url: string
  title: string
  slug: string
  description: string
  screenshot: Media
}

export interface Project {
  id: number
  name: string
  template: number | Template
}

export interface Installation {
  id: number
}
