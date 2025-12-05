/*
╔════════════════════════════════════════════════════════════════════╗
║  ROOTED VITALITY, INC.                                             ║
║  File: emailTemplates.js                                           ║
║  Purpose: Professional branded email templates for notifications    ║
║  Holistic Wellness · Modern Connection Platform                    ║
║  rootedvitality.com | 2025                                         ║
╚════════════════════════════════════════════════════════════════════╝

 TABLE OF CONTENTS
   1. MATCH ACCEPTANCE NOTIFICATION
   2. MATCH DECLINE NOTIFICATION
   3. REVIEW NOTIFICATION
   4. MESSAGE NOTIFICATION
   5. GENERAL UTILITIES
*/

// ======================================================
// 1. MATCH ACCEPTANCE NOTIFICATION
// ======================================================

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
      '<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', \'Helvetica Neue\', Arial, sans-serif; background-color: #fbf7ec;">' +
      '<div style="max-width: 600px; margin: 0 auto; background-color: #fbf7ec;">' +
      '<div style="background: linear-gradient(135deg, #77883e 0%, #4a8b62 100%); padding: 40px 20px; text-align: center; border-bottom: 4px solid #3a6b4a;">' +
      '<h1 style="margin: 0; color: #fbf7ec; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">âœ“ Connection Accepted!</h1>' +
      '</div>' +
      '<div style="padding: 40px 30px;">' +
      '<p style="margin: 0 0 20px 0; font-size: 16px; color: #2e2b28; line-height: 1.6;">Hi <strong>' + clientName + '</strong>,</p>' +
      '<p style="margin: 0 0 24px 0; font-size: 15px; color: #666; line-height: 1.6;">Great news! <strong>' + practitionerName + '</strong> has accepted your match request for <strong>"' + projectName + '"</strong>.</p>' +
      '<div style="background-color: #fbf7ec; border-left: 4px solid #77883e; padding: 20px; margin: 24px 0; border-radius: 4px;">' +
      '<p style="margin: 0; font-size: 14px; color: #5f7030; font-weight: 500;">ðŸ’¬ You can now start messaging with ' + practitionerName + ' to discuss your wellness goals.</p>' +
      '</div>' +
      '<div style="text-align: center; margin: 32px 0;">' +
      '<a href="https://rootedvitality.com/rooted-vitality/dashboard/client/pages/inbox.html" style="display: inline-block; background-color: #77883e; color: #fbf7ec; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px;">View Your Matches</a>' +
      '</div>' +
      '<p style="margin: 24px 0 0 0; font-size: 14px; color: #999; line-height: 1.6;">This is an automated notification. You received this because you have notifications enabled.</p>' +
      '</div>' +
      '<div style="background-color: #fbf7ec; border-top: 1px solid #e5e0d9; padding: 24px 30px; text-align: center; font-size: 12px; color: #999;">' +
      '<p style="margin: 0 0 8px 0;"><strong>Rooted Vitality</strong> â€¢ Holistic Wellness Connection Platform</p>' +
      '<p style="margin: 0;">support@rootedvitality.health | <a href="https://rootedvitality.com" style="color: #77883e; text-decoration: none;">rootedvitality.com</a></p>' +
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
      '<div style="background-color: #fbf7ec; border-left: 4px solid #d97706; padding: 20px; margin: 24px 0; border-radius: 4px;">' +
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
      '<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', \'Helvetica Neue\', Arial, sans-serif; background-color: #fbf7ec;">' +
      '<div style="max-width: 600px; margin: 0 auto; background-color: #fbf7ec;">' +
      '<div style="background: linear-gradient(135deg, #d97706 0%, #b45309 100%); padding: 40px 20px; text-align: center; border-bottom: 4px solid #92400e;">' +
      '<h1 style="margin: 0; color: #fbf7ec; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">Match Status Update</h1>' +
      '</div>' +
      '<div style="padding: 40px 30px;">' +
      '<p style="margin: 0 0 20px 0; font-size: 16px; color: #2e2b28; line-height: 1.6;">Hi <strong>' + clientName + '</strong>,</p>' +
      '<p style="margin: 0 0 24px 0; font-size: 15px; color: #666; line-height: 1.6;"><strong>' + practitionerName + '</strong> has declined your match request for <strong>"' + projectName + '"</strong>.</p>' +
      reasonSection +
      '<div style="background-color: #fbf7ec; border-left: 4px solid #3b82f6; padding: 20px; margin: 24px 0; border-radius: 4px;">' +
      '<p style="margin: 0; font-size: 14px; color: #1e40af; line-height: 1.6;">Don\'t worry! There are many skilled practitioners on Rooted Vitality. We recommend browsing other matches or posting a new request to find the perfect fit for your wellness goals.</p>' +
      '</div>' +
      '<div style="text-align: center; margin: 32px 0;">' +
      '<a href="https://rootedvitality.com/rooted-vitality/dashboard/client/pages/find-practitioners.html" style="display: inline-block; background-color: #77883e; color: #fbf7ec; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px; transition: background-color 0.2s ease;">Find Other Practitioners</a>' +
      '</div>' +
      '<p style="margin: 24px 0 0 0; font-size: 14px; color: #999; line-height: 1.6;">This is an automated notification from Rooted Vitality. You received this email because you have notifications enabled in your account settings.</p>' +
      '</div>' +
      '<div style="background-color: #fbf7ec; border-top: 1px solid #e5e0d9; padding: 24px 30px; text-align: center; font-size: 12px; color: #999;">' +
      '<p style="margin: 0 0 8px 0;"><strong>Rooted Vitality</strong> â€¢ Holistic Wellness Connection Platform</p>' +
      '<p style="margin: 0;">support@rootedvitality.health | <a href="https://rootedvitality.com" style="color: #77883e; text-decoration: none;">rootedvitality.com</a></p>' +
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
      '<a href="' + buttonUrl + '" style="display: inline-block; background-color: #77883e; color: #fbf7ec; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px; transition: background-color 0.2s ease;">' + buttonText + '</a>' +
      '</div>' : '';
    const html = '<!DOCTYPE html>' +
      '<html lang="en">' +
      '<head>' +
      '<meta charset="UTF-8">' +
      '<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
      '<title>' + title + ' - Rooted Vitality</title>' +
      '</head>' +
      '<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', \'Helvetica Neue\', Arial, sans-serif; background-color: #fbf7ec;">' +
      '<div style="max-width: 600px; margin: 0 auto; background-color: #fbf7ec;">' +
      '<div style="background: linear-gradient(135deg, #77883e 0%, #4a8b62 100%); padding: 40px 20px; text-align: center; border-bottom: 4px solid #3a6b4a;">' +
      '<h1 style="margin: 0; color: #fbf7ec; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">âœ¨ ' + title + '</h1>' +
      '</div>' +
      '<div style="padding: 40px 30px;">' +
      '<p style="margin: 0 0 24px 0; font-size: 15px; color: #666; line-height: 1.8;">' + message + '</p>' +
      buttonSection +
      '<p style="margin: 24px 0 0 0; font-size: 14px; color: #999; line-height: 1.6;">This is a notification from Rooted Vitality. You received this email because you have promotions enabled in your account settings.</p>' +
      '</div>' +
      '<div style="background-color: #fbf7ec; border-top: 1px solid #e5e0d9; padding: 24px 30px; text-align: center; font-size: 12px; color: #999;">' +
      '<p style="margin: 0 0 8px 0;"><strong>Rooted Vitality</strong> â€¢ Holistic Wellness Connection Platform</p>' +
      '<p style="margin: 0;">support@rootedvitality.health | <a href="https://rootedvitality.com" style="color: #77883e; text-decoration: none;">rootedvitality.com</a></p>' +
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
      '<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', \'Helvetica Neue\', Arial, sans-serif; background-color: #fbf7ec;">' +
      '<div style="max-width: 600px; margin: 0 auto; background-color: #fbf7ec;">' +
      '<div style="background: linear-gradient(135deg, #77883e 0%, #4a8b62 100%); padding: 40px 20px; text-align: center; border-bottom: 4px solid #3a6b4a;">' +
      '<h1 style="margin: 0; color: #fbf7ec; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">ðŸŽ¯ New Match Request!</h1>' +
      '</div>' +
      '<div style="padding: 40px 30px;">' +
      '<p style="margin: 0 0 20px 0; font-size: 16px; color: #2e2b28; line-height: 1.6;">Hi <strong>' + practitionerName + '</strong>,</p>' +
      '<p style="margin: 0 0 24px 0; font-size: 15px; color: #666; line-height: 1.6;">Great news! <strong>' + clientName + '</strong> has requested to work with you on <strong>"' + projectName + '"</strong>.</p>' +
      '<div style="background-color: #fbf7ec; border-left: 4px solid #77883e; padding: 20px; margin: 24px 0; border-radius: 4px;">' +
      '<p style="margin: 0 0 12px 0; font-size: 14px; color: #5f7030; font-weight: 500;">ðŸ“Š Match Score: <strong>' + (matchScore || 'N/A') + '</strong></p>' +
      '<p style="margin: 0; font-size: 14px; color: #5f7030;">Review their request in your Rooted Vitality dashboard to accept or decline.</p>' +
      '</div>' +
      '<div style="text-align: center; margin: 32px 0;">' +
      '<a href="https://rootedvitality.health/rooted-vitality/dashboard/pro/pages/index.html" style="display: inline-block; padding: 14px 32px; background-color: #77883e; color: #fbf7ec; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; transition: background-color 0.3s ease;">View Match Request</a>' +
      '</div>' +
      '<hr style="margin: 32px 0; border: none; border-top: 1px solid #e8e6e2;">' +
      '<p style="margin: 0; font-size: 12px; color: #999; line-height: 1.6; text-align: center;">This is an automated message from Rooted Vitality. You can manage your notification preferences in your account settings.</p>' +
      '</div>' +
      '</body>' +
      '</html>';
    return html;
  },

  /**
   * Practitioner match acceptance notification email
   */
  practitionerMatchAccepted: (options) => {
    const { practitionerName, clientName, projectName } = options;
    const html = '<!DOCTYPE html>' +
      '<html lang="en">' +
      '<head>' +
      '<meta charset="UTF-8">' +
      '<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
      '<title>Match Accepted - Rooted Vitality</title>' +
      '</head>' +
      '<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', \'Helvetica Neue\', Arial, sans-serif; background-color: #fbf7ec;">' +
      '<div style="max-width: 600px; margin: 0 auto; background-color: #fbf7ec;">' +
      '<div style="background: linear-gradient(135deg, #22863a 0%, #1b6e2e 100%); padding: 40px 20px; text-align: center; border-bottom: 4px solid #1a5a24;">' +
      '<h1 style="margin: 0; color: #fbf7ec; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">✓ Match Accepted!</h1>' +
      '</div>' +
      '<div style="padding: 40px 30px;">' +
      '<p style="margin: 0 0 20px 0; font-size: 16px; color: #2e2b28; line-height: 1.6;">Hi <strong>' + practitionerName + '</strong>,</p>' +
      '<p style="margin: 0 0 24px 0; font-size: 15px; color: #666; line-height: 1.6;">Excellent news! <strong>' + clientName + '</strong> has accepted your match for <strong>"' + projectName + '"</strong>. You can now start messaging them directly.</p>' +
      '<div style="background-color: #fbf7ec; border-left: 4px solid #22863a; padding: 20px; margin: 24px 0; border-radius: 4px;">' +
      '<p style="margin: 0; font-size: 14px; color: #1a5a24; line-height: 1.6;">💬 Head to your inbox to start your conversation with ' + clientName + ' and discuss the details of their project.</p>' +
      '</div>' +
      '<div style="text-align: center; margin: 32px 0;">' +
      '<a href="https://rootedvitality.health/rooted-vitality/dashboard/pro/pages/inbox.html" style="display: inline-block; padding: 14px 32px; background-color: #22863a; color: #fbf7ec; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; transition: background-color 0.3s ease;">View Your Inbox</a>' +
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
      '<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', \'Helvetica Neue\', Arial, sans-serif; background-color: #fbf7ec;">' +
      '<div style="max-width: 600px; margin: 0 auto; background-color: #fbf7ec;">' +
      '<div style="background: linear-gradient(135deg, #77883e 0%, #4a8b62 100%); padding: 40px 20px; text-align: center; border-bottom: 4px solid #3a6b4a;">' +
      '<h1 style="margin: 0; color: #fbf7ec; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">ðŸ“¬ ' + title + '</h1>' +
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



























































