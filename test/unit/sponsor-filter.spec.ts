import { describe, expect, it } from 'vitest'
import { isBlockedSponsor } from '../../server/utils/sponsor-filter'

function sponsor(sponsorId: string, sponsorName: string | null, sponsorUrl: string) {
  return { sponsorId, sponsorName, sponsorUrl }
}

describe('sponsor filter', () => {
  it.each([
    sponsor('buy-tiktok-followers-co', 'BuyTikTokFollowers.co', 'https://buytiktokfollowers.co/'),
    sponsor('buyfans', 'Buy.Fans', 'https://buy.fans/'),
    sponsor('hyppesocial-get-tiktok-likes', 'HyppeSocial', 'https://hyppesocial.com/'),
    sponsor('tiktok-likes', 'TikTok Likes', 'https://follower-boerse.de/product/tiktok-likes-kaufen/'),
    sponsor('reputationmanage-to-buy-google-reviews', 'ReputationManage to buy Google reviews', 'https://reputationmanage.co'),
    sponsor('socialfollowersuk', 'Social followers', 'https://www.socialfollowers.uk/')
  ])('blocks engagement sellers like $sponsorId', (value) => {
    expect(isBlockedSponsor(value)).toBe(true)
  })

  it.each([
    sponsor('vercel', 'Vercel', 'https://vercel.com'),
    sponsor('getcleaver', 'Cleaver', 'https://cleaver.cloud'),
    sponsor('kinde-oss', 'Kinde', 'https://kinde.com'),
    sponsor('k-karen', null, 'https://qiita.com/k_karen')
  ])('keeps $sponsorId', (value) => {
    expect(isBlockedSponsor(value)).toBe(false)
  })
})
