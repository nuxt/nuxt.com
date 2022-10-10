export interface Sponsor {
  createdAt: string,
  privacyLevel: string,
  tier: {
    name: string,
    isOneTime: boolean,
    monthlyPriceInCents: number,
    monthlyPriceInDollars: number
  },
  sponsorEntity: {
    __typename: string,
    login: string,
    name: string,
    avatarUrl: string
  }
}
