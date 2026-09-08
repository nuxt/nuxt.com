export type SponsorType = 'diamond' | 'platinum' | 'silver' | 'gold' | 'bronze' | 'backers'
export interface Sponsor {
  sponsorId: string
  sponsorName: string
  sponsorLogo: string
  sponsorUrl: string
  monthlyPriceInDollars: number
  tier: SponsorType
}
