interface SponsorIdentity {
  sponsorId: string
  sponsorName: string | null
  sponsorUrl: string
}

// Open Collective only bans these accounts after the fact, so new ones keep showing up in the tiers.
const ENGAGEMENT_SELLER = /\b(?:buy|get)[\s\S]{0,40}?(?:followers|likes|views|subscribers|plays|reviews|comments|fans)|(?:followers|likes|views|subscribers)[\s-]kaufen/i

const blockedSponsors = [
  'organic-social-boosting',
  'socialfollowersuk'
]

export function isBlockedSponsor(sponsor: SponsorIdentity): boolean {
  if (blockedSponsors.includes(sponsor.sponsorId)) {
    return true
  }
  return [sponsor.sponsorId, sponsor.sponsorName, sponsor.sponsorUrl]
    .some(value => !!value && ENGAGEMENT_SELLER.test(value))
}
