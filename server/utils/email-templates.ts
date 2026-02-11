export function confirmationEmailHtml(confirmationURL: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirm your subscription</title>
</head>
<body style="margin:0;padding:0;background-color:#0B0C0E;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0B0C0E;">
    <tr>
      <td align="center" style="padding:60px 24px;">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;">
          <!-- Icon -->
          <tr>
            <td align="left" style="padding:0 0 48px;">
              <img src="https://nuxt.com/assets/design-kit/icon-green.svg" alt="Nuxt" width="40" height="40" style="display:block;border:0;">
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td align="left">
              <p style="margin:0 0 8px;font-size:15px;line-height:1.6;color:#8B8B8B;font-weight:400;">Nuxt Newsletter</p>
              <h1 style="margin:0 0 20px;font-size:22px;font-weight:500;color:#EDEDED;line-height:1.4;letter-spacing:-0.02em;">Confirm your email address</h1>
              <p style="margin:0 0 36px;font-size:15px;line-height:1.7;color:#8B8B8B;font-weight:400;">Click the link below to confirm your subscription and start receiving updates about Nuxt.</p>
            </td>
          </tr>
          <!-- CTA Button -->
          <tr>
            <td align="left" style="padding:0 0 48px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="background-color:#00DC82;border-radius:6px;">
                    <a href="${confirmationURL}" target="_blank" style="display:inline-block;padding:11px 28px;font-size:14px;font-weight:500;color:#0B0C0E;text-decoration:none;border-radius:6px;letter-spacing:-0.01em;">Confirm subscription</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Fallback -->
          <tr>
            <td align="left">
              <p style="margin:0;font-size:12px;line-height:1.5;color:#4A4A4A;">Or copy this link: <a href="${confirmationURL}" style="color:#6B6B6B;text-decoration:underline;">${confirmationURL}</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}
