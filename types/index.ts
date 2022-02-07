export interface Avatar {
  url: string
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
  avatar: Avatar
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
}
