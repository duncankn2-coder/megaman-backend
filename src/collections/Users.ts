import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'createdAt'],
  },
  auth: {
    maxLoginAttempts: 5,
    lockTime: 10 * 60 * 1000, // 10 minutes lockout
    forgotPassword: {
      expiration: 2 * 60 * 60 * 1000, // 2 hours
      generateEmailHTML: (args) => {
        const serverURL = process.env.PAYLOAD_PUBLIC_SERVER_URL || 'http://localhost:3000';
        const resetURL = `${serverURL}/admin/reset/${args?.token}`;
        return `
          <!doctype html>
          <html>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 40px 20px;">
              <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 560px; background: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
                <tr>
                  <td style="background-color: #005288; padding: 24px 32px; text-align: left;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 600; letter-spacing: 0.5px;">MEGAMAN® CMS</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 32px;">
                    <h2 style="color: #0f172a; margin-top: 0; font-size: 18px; font-weight: 600;">Reset Your Password / Unlock Account</h2>
                    <p style="color: #475569; font-size: 14px; line-height: 22px; margin: 16px 0;">
                      Hello,<br><br>
                      A request was received to reset the password or unlock the MEGAMAN® CMS account for <strong>${args?.user?.email || 'your account'}</strong>.
                    </p>
                    <p style="color: #475569; font-size: 14px; line-height: 22px; margin: 16px 0;">
                      Click the button below to choose a new password. Once set, your account will immediately be unlocked and you will be able to log in.
                    </p>
                    <div style="text-align: center; margin: 28px 0;">
                      <a href="${resetURL}" target="_blank" style="background-color: #005288; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-size: 14px; font-weight: 600; display: inline-block;">
                        Reset Password &amp; Unlock Account
                      </a>
                    </div>
                    <p style="color: #94a3b8; font-size: 12px; line-height: 18px; margin: 24px 0 0; border-top: 1px solid #f1f5f9; padding-top: 16px;">
                      If you did not request this password reset, you can safely ignore this email. This link will expire in 2 hours.<br><br>
                      Button not working? Copy and paste this URL into your browser:<br>
                      <a href="${resetURL}" style="color: #005288; word-break: break-all;">${resetURL}</a>
                    </p>
                  </td>
                </tr>
              </table>
            </body>
          </html>
        `;
      },
      generateEmailSubject: () => 'Reset Your Password & Unlock Account - MEGAMAN® CMS',
    },
  },
  hooks: {
    beforeChange: [
      ({ data }) => {
        // When password is changed, reset or token is used, automatically unlock account & clear failed attempts
        if (data && (data.password || data.salt || data.hash)) {
          data.loginAttempts = 0;
          data.lockUntil = null;
        }
        return data;
      },
    ],
  },
  fields: [
    // Email added by default
    // Add more fields as needed
  ],
}
