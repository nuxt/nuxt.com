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

export interface CommunityPartners {
  services: string[],
  location: string
}
