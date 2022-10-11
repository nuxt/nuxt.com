
export interface SponsorEntity {
  __typename: string,
  login: string,
  name: string,
  avatarUrl: string
}

export interface Tier {
  name: string,
  isOneTime: boolean,
  monthlyPriceInCents: number,
  monthlyPriceInDollars: number
}

export interface Sponsor {
  createdAt: string,
  privacyLevel: string,
  tier: Tier
  sponsorEntity: SponsorEntity
}
