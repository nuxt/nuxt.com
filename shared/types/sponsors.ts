export type SponsorType = 'diamond' | 'platinum' | 'silver' | 'gold' | 'bronze' | 'backers'
export interface Sponsor {
  sponsorId: string
  sponsorName: string
  sponsorLogo: string
  sponsorUrl: string
  monthlyPriceInDollars: number
  tier: SponsorType
  sponsorDescription?: string
  /** ISO date the current sponsorship started. */
  since?: string
}

export type SponsorsByTier = Partial<Record<SponsorType, Sponsor[]>>

export type PastSponsor = Pick<Sponsor, 'sponsorId' | 'sponsorName' | 'sponsorLogo' | 'sponsorUrl'>
