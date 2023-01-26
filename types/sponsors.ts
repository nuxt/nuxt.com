export type SponsorType = 'platinum' | 'silver' | 'gold' | 'bronze' | 'backers'

export interface Sponsor {
  sponsorId: string,
  sponsorName: string,
  sponsorLogo: string,
  sponsorUrl: string,
  monthlyPriceInDollars: string,
  tier: SponsorType
}
