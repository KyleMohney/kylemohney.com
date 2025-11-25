/**
 * EMAIL TEMPLATES FOR ROOTED VITALITY NOTIFICATIONS
 * These are HTML template strings for professional branded emails
 */

const EmailTemplates = {
  /**
   * Match acceptance notification email
   */
  matchAccepted: (options) => {
    const { clientName, practitionerName, projectName } = options;
    const html = '<!DOCTYPE html>' +
      '<html lang="en">' +
      '<head>' +
      '<meta charset="UTF-8">' +
      '<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
      '<title>Connection Accepted - Rooted Vitality</title>' +
      '</head>' +
      '<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', \'Helvetica Neue\', Arial, sans-serif; background-color: #f9f8f5;">' +
      '<div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">' +
      '<div style="background: linear-gradient(135deg, #5c9a72 0%, #4a8b62 100%); padding: 40px 20px; text-align: center; border-bottom: 4px solid #3a6b4a;">' +
      '<h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">✓ Connection Accepted!</h1>' +
      '</div>' +
      '<div style="padding: 40px 30px;">' +
      '<p style="margin: 0 0 20px 0; font-size: 16px; color: #2e2b28; line-height: 1.6;">Hi <strong>' + clientName + '</strong>,</p>' +
      '<p style="margin: 0 0 24px 0; font-size: 15px; color: #666; line-height: 1.6;">Great news! <strong>' + practitionerName + '</strong> has accepted your match request for <strong>"' + projectName + '"</strong>.</p>' +
      '<div style="background-color: #f0f8f4; border-left: 4px solid #5c9a72; padding: 20px; margin: 24px 0; border-radius: 4px;">' +
      '<p style="margin: 0; font-size: 14px; color: #4a7d5a; font-weight: 500;">💬 You can now start messaging with ' + practitionerName + ' to discuss your wellness goals.</p>' +
      '</div>' +
      '<div style="text-align: center; margin: 32px 0;">' +
      '<a href="https://rootedvitality.com/rooted-vitality/dashboard/client/pages/my-matches.html" style="display: inline-block; background-color: #5c9a72; color: #ffffff; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px;">View Your Matches</a>' +
      '</div>' +
      '<p style="margin: 24px 0 0 0; font-size: 14px; color: #999; line-height: 1.6;">This is an automated notification. You received this because you have notifications enabled.</p>' +
      '</div>' +
      '<div style="background-color: #f9f8f5; border-top: 1px solid #e5e0d9; padding: 24px 30px; text-align: center; font-size: 12px; color: #999;">' +
      '<p style="margin: 0 0 8px 0;"><strong>Rooted Vitality</strong> • Holistic Wellness Connection Platform</p>' +
      '<p style="margin: 0;">support@rootedvitality.health | <a href="https://rootedvitality.com" style="color: #5c9a72; text-decoration: none;">rootedvitality.com</a></p>' +
      '</div>' +
      '</div>' +
      '</body>' +
      '</html>';
    return html;
  },

  /**
   * Match decline notification email
   */
  matchDeclined: (options) => {
    const { clientName, practitionerName, projectName, reason } = options;
    const reasonSection = reason ? 
      '<div style="background-color: #fef3c7; border-left: 4px solid #d97706; padding: 20px; margin: 24px 0; border-radius: 4px;">' +
      '<p style="margin: 0 0 8px 0; font-size: 13px; color: #92400e; font-weight: 600;">Reason:</p>' +
      '<p style="margin: 0; font-size: 14px; color: #b45309;">' + reason + '</p>' +
      '</div>' : '';
    const html = '<!DOCTYPE html>' +
      '<html lang="en">' +
      '<head>' +
      '<meta charset="UTF-8">' +
      '<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
      '<title>Match Update - Rooted Vitality</title>' +
      '</head>' +
      '<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', \'Helvetica Neue\', Arial, sans-serif; background-color: #f9f8f5;">' +
      '<div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">' +
      '<div style="background: linear-gradient(135deg, #d97706 0%, #b45309 100%); padding: 40px 20px; text-align: center; border-bottom: 4px solid #92400e;">' +
      '<h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">Match Status Update</h1>' +
      '</div>' +
      '<div style="padding: 40px 30px;">' +
      '<p style="margin: 0 0 20px 0; font-size: 16px; color: #2e2b28; line-height: 1.6;">Hi <strong>' + clientName + '</strong>,</p>' +
      '<p style="margin: 0 0 24px 0; font-size: 15px; color: #666; line-height: 1.6;"><strong>' + practitionerName + '</strong> has declined your match request for <strong>"' + projectName + '"</strong>.</p>' +
      reasonSection +
      '<div style="background-color: #f0f4f8; border-left: 4px solid #3b82f6; padding: 20px; margin: 24px 0; border-radius: 4px;">' +
      '<p style="margin: 0; font-size: 14px; color: #1e40af; line-height: 1.6;">Don\'t worry! There are many skilled practitioners on Rooted Vitality. We recommend browsing other matches or posting a new request to find the perfect fit for your wellness goals.</p>' +
      '</div>' +
      '<div style="text-align: center; margin: 32px 0;">' +
      '<a href="https://rootedvitality.com/rooted-vitality/dashboard/client/pages/find-practitioners.html" style="display: inline-block; background-color: #5c9a72; color: #ffffff; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px; transition: background-color 0.2s ease;">Find Other Practitioners</a>' +
      '</div>' +
      '<p style="margin: 24px 0 0 0; font-size: 14px; color: #999; line-height: 1.6;">This is an automated notification from Rooted Vitality. You received this email because you have notifications enabled in your account settings.</p>' +
      '</div>' +
      '<div style="background-color: #f9f8f5; border-top: 1px solid #e5e0d9; padding: 24px 30px; text-align: center; font-size: 12px; color: #999;">' +
      '<p style="margin: 0 0 8px 0;"><strong>Rooted Vitality</strong> • Holistic Wellness Connection Platform</p>' +
      '<p style="margin: 0;">support@rootedvitality.health | <a href="https://rootedvitality.com" style="color: #5c9a72; text-decoration: none;">rootedvitality.com</a></p>' +
      '</div>' +
      '</div>' +
      '</body>' +
      '</html>';
    return html;
  },

  /**
   * Promotion/announcement email
   */
  promotion: (options) => {
    const { title, message, buttonText = 'Learn More', buttonUrl } = options;
    const buttonSection = buttonUrl ? 
      '<div style="text-align: center; margin: 32px 0;">' +
      '<a href="' + buttonUrl + '" style="display: inline-block; background-color: #5c9a72; color: #ffffff; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px; transition: background-color 0.2s ease;">' + buttonText + '</a>' +
      '</div>' : '';
    const html = '<!DOCTYPE html>' +
      '<html lang="en">' +
      '<head>' +
      '<meta charset="UTF-8">' +
      '<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
      '<title>' + title + ' - Rooted Vitality</title>' +
      '</head>' +
      '<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', \'Helvetica Neue\', Arial, sans-serif; background-color: #f9f8f5;">' +
      '<div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">' +
      '<div style="background: linear-gradient(135deg, #5c9a72 0%, #4a8b62 100%); padding: 40px 20px; text-align: center; border-bottom: 4px solid #3a6b4a;">' +
      '<h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">✨ ' + title + '</h1>' +
      '</div>' +
      '<div style="padding: 40px 30px;">' +
      '<p style="margin: 0 0 24px 0; font-size: 15px; color: #666; line-height: 1.8;">' + message + '</p>' +
      buttonSection +
      '<p style="margin: 24px 0 0 0; font-size: 14px; color: #999; line-height: 1.6;">This is a notification from Rooted Vitality. You received this email because you have promotions enabled in your account settings.</p>' +
      '</div>' +
      '<div style="background-color: #f9f8f5; border-top: 1px solid #e5e0d9; padding: 24px 30px; text-align: center; font-size: 12px; color: #999;">' +
      '<p style="margin: 0 0 8px 0;"><strong>Rooted Vitality</strong> • Holistic Wellness Connection Platform</p>' +
      '<p style="margin: 0;">support@rootedvitality.health | <a href="https://rootedvitality.com" style="color: #5c9a72; text-decoration: none;">rootedvitality.com</a></p>' +
      '</div>' +
      '</div>' +
      '</body>' +
      '</html>';
    return html;
  },

  /**
   * New match notification email for practitioners
   */
  practitionerNewMatch: (options) => {
    const { practitionerName, clientName, projectName, matchScore } = options;
    const html = '<!DOCTYPE html>' +
      '<html lang="en">' +
      '<head>' +
      '<meta charset="UTF-8">' +
      '<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
      '<title>New Match Request - Rooted Vitality</title>' +
      '</head>' +
      '<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', \'Helvetica Neue\', Arial, sans-serif; background-color: #f9f8f5;">' +
      '<div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">' +
      '<div style="background: linear-gradient(135deg, #5c9a72 0%, #4a8b62 100%); padding: 40px 20px; text-align: center; border-bottom: 4px solid #3a6b4a;">' +
      '<h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">🎯 New Match Request!</h1>' +
      '</div>' +
      '<div style="padding: 40px 30px;">' +
      '<p style="margin: 0 0 20px 0; font-size: 16px; color: #2e2b28; line-height: 1.6;">Hi <strong>' + practitionerName + '</strong>,</p>' +
      '<p style="margin: 0 0 24px 0; font-size: 15px; color: #666; line-height: 1.6;">Great news! <strong>' + clientName + '</strong> has requested to work with you on <strong>"' + projectName + '"</strong>.</p>' +
      '<div style="background-color: #f0f8f4; border-left: 4px solid #5c9a72; padding: 20px; margin: 24px 0; border-radius: 4px;">' +
      '<p style="margin: 0 0 12px 0; font-size: 14px; color: #4a7d5a; font-weight: 500;">📊 Match Score: <strong>' + (matchScore || 'N/A') + '</strong></p>' +
      '<p style="margin: 0; font-size: 14px; color: #4a7d5a;">Review their request in your Rooted Vitality dashboard to accept or decline.</p>' +
      '</div>' +
      '<div style="text-align: center; margin: 32px 0;">' +
      '<a href="https://rootedvitality.health/rooted-vitality/dashboard/pro/pages/index.html" style="display: inline-block; padding: 14px 32px; background-color: #5c9a72; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; transition: background-color 0.3s ease;">View Match Request</a>' +
      '</div>' +
      '<hr style="margin: 32px 0; border: none; border-top: 1px solid #e8e6e2;">' +
      '<p style="margin: 0; font-size: 12px; color: #999; line-height: 1.6; text-align: center;">This is an automated message from Rooted Vitality. You can manage your notification preferences in your account settings.</p>' +
      '</div>' +
      '</body>' +
      '</html>';
    return html;
  },

  /**
   * System notification email
   */
  system: (options) => {
    const { title, message } = options;
    const html = '<!DOCTYPE html>' +
      '<html lang="en">' +
      '<head>' +
      '<meta charset="UTF-8">' +
      '<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
      '<title>' + title + ' - Rooted Vitality</title>' +
      '</head>' +
      '<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', \'Helvetica Neue\', Arial, sans-serif; background-color: #f9f8f5;">' +
      '<div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">' +
      '<div style="background: linear-gradient(135deg, #5c9a72 0%, #4a8b62 100%); padding: 40px 20px; text-align: center; border-bottom: 4px solid #3a6b4a;">' +
      '<h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">📬 ' + title + '</h1>' +
      '</div>' +
      '<div style="padding: 40px 30px;">' +
      '<p style="margin: 0 0 24px 0; font-size: 15px; color: #666; line-height: 1.6;">' + message + '</p>' +
      '<hr style="margin: 32px 0; border: none; border-top: 1px solid #e8e6e2;">' +
      '<p style="margin: 0; font-size: 12px; color: #999; line-height: 1.6; text-align: center;">This is an automated message from Rooted Vitality. For help, reply to this email or contact support@rootedvitality.health</p>' +
      '</div>' +
      '</div>' +
      '</body>' +
      '</html>';
    return html;
  }
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { EmailTemplates };
}
