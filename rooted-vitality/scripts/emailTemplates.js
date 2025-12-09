/*
╔════════════════════════════════════════════════════════════════════╗
║  ROOTED VITALITY, INC.                                             ║
║  File: emailTemplates.js                                           ║
║  Purpose: Professional branded email templates for notifications    ║
║  Holistic Wellness · Modern Connection Platform                    ║
║  rootedvitality.com | 2025                                         ║
╚════════════════════════════════════════════════════════════════════╝

 TABLE OF CONTENTS
   1. COLOR PALETTE (Centralized for all email templates)
   2. MATCH ACCEPTANCE NOTIFICATION
   3. MATCH DECLINE NOTIFICATION
   4. REVIEW NOTIFICATION
   5. MESSAGE NOTIFICATION
   6. GENERAL UTILITIES
*/

// ======================================================
// COLOR PALETTE - Centralized Configuration
// ======================================================
const EmailColors = {
  // Brand Colors
  primary: '#77883e',
  primaryDark: '#5f7030',
  primaryLight: '#88a947',
  accent: '#d4c47c',
  
  // Backgrounds
  lightBg: '#fbf7ec',
  darkBg: '#1a1714',
  
  // Text Colors
  darkText: '#2e2b28',
  mediumText: '#666',
  lightText: '#999',
  darkAlt: '#3d3a37',
  
  // Status Colors
  successBg: '#065f46',
  successDark: '#22863a',
  successLight: '#1a5a24',
  
  warningBg: '#d97706',
  warningDark: '#92400e',
  warningText: '#b45309',
  
  infoBg: '#3b82f6',
  infoDark: '#1e40af',
  
  // Borders
  borderLight: '#e5e0d9',
  borderMuted: '#e8e4d8',
};

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
    const c = EmailColors;
    const html = '<!DOCTYPE html>' +
      '<html lang="en">' +
      '<head>' +
      '<meta charset="UTF-8">' +
      '<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
      '<title>Connection Accepted - Rooted Vitality</title>' +
      '</head>' +
      '<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', \'Helvetica Neue\', Arial, sans-serif; background-color: ' + c.lightBg + ';">' +
      '<div style="max-width: 600px; margin: 0 auto; background-color: ' + c.lightBg + ';">' +
      '<div style="background: linear-gradient(135deg, ' + c.primary + ' 0%, ' + c.primaryDark + ' 100%); padding: 40px 20px; text-align: center; border-bottom: 4px solid ' + c.primaryDark + ';">' +
      '<h1 style="margin: 0; color: ' + c.lightBg + '; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">✓ Connection Accepted!</h1>' +
      '</div>' +
      '<div style="padding: 40px 30px;">' +
      '<p style="margin: 0 0 20px 0; font-size: 16px; color: ' + c.darkText + '; line-height: 1.6;">Hi <strong>' + clientName + '</strong>,</p>' +
      '<p style="margin: 0 0 24px 0; font-size: 15px; color: ' + c.mediumText + '; line-height: 1.6;">Great news! <strong>' + practitionerName + '</strong> has accepted your match request for <strong>"' + projectName + '"</strong>.</p>' +
      '<div style="background-color: ' + c.lightBg + '; border-left: 4px solid ' + c.primary + '; padding: 20px; margin: 24px 0; border-radius: 4px;">' +
      '<p style="margin: 0; font-size: 14px; color: ' + c.primaryDark + '; font-weight: 500;">💬 You can now start messaging with ' + practitionerName + ' to discuss your wellness goals.</p>' +
      '</div>' +
      '<div style="text-align: center; margin: 32px 0;">' +
      '<a href="https://rootedvitality.com/rooted-vitality/dashboard/client/pages/inbox.html" style="display: inline-block; background-color: ' + c.primary + '; color: ' + c.lightBg + '; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px;">View Your Matches</a>' +
      '</div>' +
      '<p style="margin: 24px 0 0 0; font-size: 14px; color: ' + c.lightText + '; line-height: 1.6;">This is an automated notification. You received this because you have notifications enabled.</p>' +
      '</div>' +
      '<div style="background-color: ' + c.lightBg + '; border-top: 1px solid ' + c.borderLight + '; padding: 24px 30px; text-align: center; font-size: 12px; color: ' + c.lightText + ';">' +
      '<p style="margin: 0 0 8px 0;"><strong>Rooted Vitality</strong> â€¢ Holistic Wellness Connection Platform</p>' +
      '<p style="margin: 0;">support@rootedvitality.health | <a href="https://rootedvitality.com" style="color: ' + c.primary + '; text-decoration: none;">rootedvitality.com</a></p>' +
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
    const c = EmailColors;
    const reasonSection = reason ? 
      '<div style="background-color: ' + c.lightBg + '; border-left: 4px solid ' + c.warningBg + '; padding: 20px; margin: 24px 0; border-radius: 4px;">' +
      '<p style="margin: 0 0 8px 0; font-size: 13px; color: ' + c.warningDark + '; font-weight: 600;">Reason:</p>' +
      '<p style="margin: 0; font-size: 14px; color: ' + c.warningText + ';">' + reason + '</p>' +
      '</div>' : '';
    const html = '<!DOCTYPE html>' +
      '<html lang="en">' +
      '<head>' +
      '<meta charset="UTF-8">' +
      '<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
      '<title>Match Update - Rooted Vitality</title>' +
      '</head>' +
      '<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', \'Helvetica Neue\', Arial, sans-serif; background-color: ' + c.lightBg + ';">' +
      '<div style="max-width: 600px; margin: 0 auto; background-color: ' + c.lightBg + ';">' +
      '<div style="background: linear-gradient(135deg, ' + c.warningBg + ' 0%, ' + c.warningText + ' 100%); padding: 40px 20px; text-align: center; border-bottom: 4px solid ' + c.warningDark + ';">' +
      '<h1 style="margin: 0; color: ' + c.lightBg + '; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">Match Status Update</h1>' +
      '</div>' +
      '<div style="padding: 40px 30px;">' +
      '<p style="margin: 0 0 20px 0; font-size: 16px; color: ' + c.darkText + '; line-height: 1.6;">Hi <strong>' + clientName + '</strong>,</p>' +
      '<p style="margin: 0 0 24px 0; font-size: 15px; color: ' + c.mediumText + '; line-height: 1.6;"><strong>' + practitionerName + '</strong> has declined your match request for <strong>"' + projectName + '"</strong>.</p>' +
      reasonSection +
      '<div style="background-color: ' + c.lightBg + '; border-left: 4px solid ' + c.infoBg + '; padding: 20px; margin: 24px 0; border-radius: 4px;">' +
      '<p style="margin: 0; font-size: 14px; color: ' + c.infoDark + '; line-height: 1.6;">Don\'t worry! There are many skilled practitioners on Rooted Vitality. We recommend browsing other matches or posting a new request to find the perfect fit for your wellness goals.</p>' +
      '</div>' +
      '<div style="text-align: center; margin: 32px 0;">' +
      '<a href="https://rootedvitality.com/rooted-vitality/dashboard/client/pages/find-practitioners.html" style="display: inline-block; background-color: ' + c.primary + '; color: ' + c.lightBg + '; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px; transition: background-color 0.2s ease;">Find Other Practitioners</a>' +
      '</div>' +
      '<p style="margin: 24px 0 0 0; font-size: 14px; color: ' + c.lightText + '; line-height: 1.6;">This is an automated notification from Rooted Vitality. You received this email because you have notifications enabled in your account settings.</p>' +
      '</div>' +
      '<div style="background-color: ' + c.lightBg + '; border-top: 1px solid ' + c.borderLight + '; padding: 24px 30px; text-align: center; font-size: 12px; color: ' + c.lightText + ';">' +
      '<p style="margin: 0 0 8px 0;"><strong>Rooted Vitality</strong> • Holistic Wellness Connection Platform</p>' +
      '<p style="margin: 0;">support@rootedvitality.health | <a href="https://rootedvitality.com" style="color: ' + c.primary + '; text-decoration: none;">rootedvitality.com</a></p>' +
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
    const c = EmailColors;
    const buttonSection = buttonUrl ? 
      '<div style="text-align: center; margin: 32px 0;">' +
      '<a href="' + buttonUrl + '" style="display: inline-block; background-color: ' + c.primary + '; color: ' + c.lightBg + '; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px; transition: background-color 0.2s ease;">' + buttonText + '</a>' +
      '</div>' : '';
    const html = '<!DOCTYPE html>' +
      '<html lang="en">' +
      '<head>' +
      '<meta charset="UTF-8">' +
      '<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
      '<title>' + title + ' - Rooted Vitality</title>' +
      '</head>' +
      '<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', \'Helvetica Neue\', Arial, sans-serif; background-color: ' + c.lightBg + ';">' +
      '<div style="max-width: 600px; margin: 0 auto; background-color: ' + c.lightBg + ';">' +
      '<div style="background: linear-gradient(135deg, ' + c.primary + ' 0%, ' + c.successAccent + ' 100%); padding: 40px 20px; text-align: center; border-bottom: 4px solid ' + c.successDark + ';">' +
      '<h1 style="margin: 0; color: ' + c.lightBg + '; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">âœ¨ ' + title + '</h1>' +
      '</div>' +
      '<div style="padding: 40px 30px;">' +
      '<p style="margin: 0 0 24px 0; font-size: 15px; color: ' + c.mediumText + '; line-height: 1.8;">' + message + '</p>' +
      buttonSection +
      '<p style="margin: 24px 0 0 0; font-size: 14px; color: ' + c.lightText + '; line-height: 1.6;">This is a notification from Rooted Vitality. You received this email because you have promotions enabled in your account settings.</p>' +
      '</div>' +
      '<div style="background-color: ' + c.lightBg + '; border-top: 1px solid ' + c.borderLight + '; padding: 24px 30px; text-align: center; font-size: 12px; color: ' + c.lightText + ';">' +
      '<p style="margin: 0 0 8px 0;"><strong>Rooted Vitality</strong> â€¢ Holistic Wellness Connection Platform</p>' +
      '<p style="margin: 0;">support@rootedvitality.health | <a href="https://rootedvitality.com" style="color: ' + c.primary + '; text-decoration: none;">rootedvitality.com</a></p>' +
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
    const c = EmailColors;
    const html = '<!DOCTYPE html>' +
      '<html lang="en">' +
      '<head>' +
      '<meta charset="UTF-8">' +
      '<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
      '<title>New Match Request - Rooted Vitality</title>' +
      '</head>' +
      '<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', \'Helvetica Neue\', Arial, sans-serif; background-color: ' + c.lightBg + ';">' +
      '<div style="max-width: 600px; margin: 0 auto; background-color: ' + c.lightBg + ';">' +
      '<div style="background: linear-gradient(135deg, ' + c.primary + ' 0%, ' + c.successAccent + ' 100%); padding: 40px 20px; text-align: center; border-bottom: 4px solid ' + c.successDark + ';">' +
      '<h1 style="margin: 0; color: ' + c.lightBg + '; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">ðŸŽ¯ New Match Request!</h1>' +
      '</div>' +
      '<div style="padding: 40px 30px;">' +
      '<p style="margin: 0 0 20px 0; font-size: 16px; color: ' + c.darkText + '; line-height: 1.6;">Hi <strong>' + practitionerName + '</strong>,</p>' +
      '<p style="margin: 0 0 24px 0; font-size: 15px; color: ' + c.mediumText + '; line-height: 1.6;">Great news! <strong>' + clientName + '</strong> has requested to work with you on <strong>"' + projectName + '"</strong>.</p>' +
      '<div style="background-color: ' + c.lightBg + '; border-left: 4px solid ' + c.primary + '; padding: 20px; margin: 24px 0; border-radius: 4px;">' +
      '<p style="margin: 0 0 12px 0; font-size: 14px; color: ' + c.primaryDark + '; font-weight: 500;">ðŸ"Š Match Score: <strong>' + (matchScore || 'N/A') + '</strong></p>' +
      '<p style="margin: 0; font-size: 14px; color: ' + c.primaryDark + ';">Review their request in your Rooted Vitality dashboard to accept or decline.</p>'
      '</div>' +
      '<div style="text-align: center; margin: 32px 0;">' +
      '<a href="https://rootedvitality.health/rooted-vitality/dashboard/pro/pages/index.html" style="display: inline-block; padding: 14px 32px; background-color: ' + c.primary + '; color: ' + c.lightBg + '; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; transition: background-color 0.3s ease;">View Match Request</a>' +
      '</div>' +
      '<hr style="margin: 32px 0; border: none; border-top: 1px solid ' + c.borderLight + ';">' +
      '<p style="margin: 0; font-size: 12px; color: ' + c.lightText + '; line-height: 1.6; text-align: center;">This is an automated message from Rooted Vitality. You can manage your notification preferences in your account settings.</p>' +
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
    const c = EmailColors;
    const html = '<!DOCTYPE html>' +
      '<html lang="en">' +
      '<head>' +
      '<meta charset="UTF-8">' +
      '<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
      '<title>Match Accepted - Rooted Vitality</title>' +
      '</head>' +
      '<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', \'Helvetica Neue\', Arial, sans-serif; background-color: ' + c.lightBg + ';">' +
      '<div style="max-width: 600px; margin: 0 auto; background-color: ' + c.lightBg + ';">' +
      '<div style="background: linear-gradient(135deg, ' + c.successBg + ' 0%, ' + c.successDark + ' 100%); padding: 40px 20px; text-align: center; border-bottom: 4px solid ' + c.successDarker + ';">' +
      '<h1 style="margin: 0; color: ' + c.lightBg + '; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">✓ Match Accepted!</h1>' +
      '</div>' +
      '<div style="padding: 40px 30px;">' +
      '<p style="margin: 0 0 20px 0; font-size: 16px; color: ' + c.darkText + '; line-height: 1.6;">Hi <strong>' + practitionerName + '</strong>,</p>' +
      '<p style="margin: 0 0 24px 0; font-size: 15px; color: ' + c.mediumText + '; line-height: 1.6;">Excellent news! <strong>' + clientName + '</strong> has accepted your match for <strong>"' + projectName + '"</strong>. You can now start messaging them directly.</p>' +
      '<div style="background-color: ' + c.lightBg + '; border-left: 4px solid ' + c.successBg + '; padding: 20px; margin: 24px 0; border-radius: 4px;">' +
      '<p style="margin: 0; font-size: 14px; color: ' + c.successDarker + '; line-height: 1.6;">💬 Head to your inbox to start your conversation with ' + clientName + ' and discuss the details of their project.</p>' +
      '</div>' +
      '<div style="text-align: center; margin: 32px 0;">' +
      '<a href="https://rootedvitality.health/rooted-vitality/dashboard/pro/pages/inbox.html" style="display: inline-block; padding: 14px 32px; background-color: ' + c.successBg + '; color: ' + c.lightBg + '; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; transition: background-color 0.3s ease;">View Your Inbox</a>' +
      '</div>' +
      '<hr style="margin: 32px 0; border: none; border-top: 1px solid ' + c.borderLight + ';">' +
      '<p style="margin: 0; font-size: 12px; color: ' + c.lightText + '; line-height: 1.6; text-align: center;">This is an automated message from Rooted Vitality. You can manage your notification preferences in your account settings.</p>' +
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
    const c = EmailColors;
    const html = '<!DOCTYPE html>' +
      '<html lang="en">' +
      '<head>' +
      '<meta charset="UTF-8">' +
      '<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
      '<title>' + title + ' - Rooted Vitality</title>' +
      '</head>' +
      '<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', \'Helvetica Neue\', Arial, sans-serif; background-color: ' + c.lightBg + ';">' +
      '<div style="max-width: 600px; margin: 0 auto; background-color: ' + c.lightBg + ';">' +
      '<div style="background: linear-gradient(135deg, ' + c.primary + ' 0%, ' + c.successAccent + ' 100%); padding: 40px 20px; text-align: center; border-bottom: 4px solid ' + c.successDark + ';">' +
      '<h1 style="margin: 0; color: ' + c.lightBg + '; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">ðŸ"¬ ' + title + '</h1>' +
      '</div>' +
      '<div style="padding: 40px 30px;">' +
      '<p style="margin: 0 0 24px 0; font-size: 15px; color: ' + c.mediumText + '; line-height: 1.6;">' + message + '</p>' +
      '<hr style="margin: 32px 0; border: none; border-top: 1px solid ' + c.borderLight + ';">' +
      '<p style="margin: 0; font-size: 12px; color: ' + c.lightText + '; line-height: 1.6; text-align: center;">This is an automated message from Rooted Vitality. For help, reply to this email or contact support@rootedvitality.health</p>' +
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



























































