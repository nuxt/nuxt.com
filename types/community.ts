import { KeyTitleRecord } from '~/types'

export interface CommunityRepository {
  name: string
  description: string
  stargazerCount: number
  forkCount: number
  url: string
  updatedAt: string
  createdAt: string
  owner: { login: string }
  collaborators: {
    totalCount: number,
    nodes: [{ id: string }]
   }
}

export interface CommunityRepositoryStats {
  count: number
  stars: number
  collaborators: number
}

export interface CommunityPartnerLogo {
  light: string
  dark: string
}

export interface CommunityPartner<> {
  title: string
  description: string
  _path: string
  logo: string | CommunityPartnerLogo
  services: string[]
  location: string
}

export interface FormatedCommunityPartner {
  title: string
  description: string
  _path: string
  logo: string | CommunityPartnerLogo
  services: KeyTitleRecord[]
  location: KeyTitleRecord
}
