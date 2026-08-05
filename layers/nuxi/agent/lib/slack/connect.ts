const PROD_SLACK_CONNECTOR = 'slack/nuxi'
const PREVIEW_SLACK_CONNECTOR = 'slack/nuxi-preview'

export function slackConnectorId(): string {
  const override = process.env.SLACK_CONNECTOR?.trim()
  if (override) return override
  if (process.env.NODE_ENV === 'development' || process.env.VERCEL_ENV === 'preview') {
    return PREVIEW_SLACK_CONNECTOR
  }
  return PROD_SLACK_CONNECTOR
}
