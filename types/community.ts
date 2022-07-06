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

export interface CommunityPartner {
  title: string
  description: string
  _path: string
  logo: {
    light: string
    dark: string
  }
  services: string[]
  location: string
}

export interface FormattedCommunityPartner extends Omit<CommunityPartner, 'services' | 'location'> {
  services: {
    key: string
    title: string
  }[]
  location: {
    key: string
    title: string
  }
}
