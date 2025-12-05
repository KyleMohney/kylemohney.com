/*
╔════════════════════════════════════════════════════════════════════╗
║  ROOTED VITALITY, INC.                                             ║
║  File: notificationManager.js                                      ║
║  Purpose: Notification management (in-app, email, SMS)             ║
║  Holistic Wellness · Modern Connection Platform                    ║
║  rootedvitality.com | 2025                                         ║
╚════════════════════════════════════════════════════════════════════╝

 TABLE OF CONTENTS
   1. MATCH NOTIFICATIONS
   2. MESSAGE NOTIFICATIONS
   3. REVIEW NOTIFICATIONS
   4. NOTIFICATION PREFERENCES
   5. UTILITIES & HELPERS

 FUNCTIONALITY:
   - Create notifications for clients and practitioners
   - Respect notification preferences (in-app, email, SMS)
   - Handle different notification types (matches, messages, reviews, etc.)
   - Send email/SMS via webhook integration to backend
   - Real-time notification badge updates
*/

// ======================================================
// 1. MATCH NOTIFICATIONS
// ======================================================

/**
 * Create a match notification for client when practitioner accepts/declines
 * @param {Object} options - Notification options
 * @param {string} options.clientSerial - Client serial number (C1, C2, etc.)
 * @param {string} options.practitionerName - Practitioner name for display
 * @param {string} options.projectName - Project name for display
 * @param {string} options.action - 'accepted' or 'declined'
 * @param {string} options.reason - Optional reason for decline
 * @returns {Promise<void>}
 */
async function notifyClientOfMatchResponse(options) {
  const { clientSerial, practitionerName, projectName, action, reason } = options;

  try {
    if (!window.supabaseClient) {
      console.error('[Notifications] Supabase client not initialized');
      return;
    }

    console.log(`[Notifications] INITIATING MATCH ${action.toUpperCase()} notification for client ${clientSerial}`);

    // Determine notification title and message based on action
    let title, message;
    if (action === 'accepted') {
      title = 'âœ“ Connection Accepted';
      message = `${practitionerName} has accepted your request for "${projectName}"! You can now start messaging them.`;
    } else if (action === 'declined') {
      title = 'âœ— Connection Declined';
      message = `${practitionerName} declined your request for "${projectName}"${reason ? ': ' + reason : ''}. You can search for other practitioners.`;
    } else {
      console.warn('[Notifications] Unknown match action:', action);
      return;
    }

    // Step 1: Create in-app notification
    const notification = {
      client_serial: clientSerial,
      type: 'match_response',
      action: action,
      title: title,
      message: message,
      is_read: false,
      created_at: new Date().toISOString()
    };

    const { data: notifData, error: notifError } = await window.supabaseClient
      .from('client_notifications')
      .insert([notification])
      .select()
      .single();

    if (notifError) {
      console.error('[Notifications] Failed to create in-app notification:', notifError);
    } else {

      // Trigger badge update if UI is loaded
      if (window.updateNotificationBadge) {
        window.updateNotificationBadge();
      }
    }

    // Step 2: Check client notification preferences for this type
    const { data: preferences, error: prefError } = await window.supabaseClient
      .from('client_notification_settings')
      .select('matches_email, matches_sms')
      .eq('client_serial', clientSerial)
      .single();

    if (prefError && prefError.code !== 'PGRST116') {
      console.warn('[Notifications] Error fetching preferences:', prefError);
      return;
    }

    // Default to enabled if no preferences found
    const prefs = preferences || { matches_email: true, matches_sms: true };

    // Step 3: Get client contact info if we need to send email/SMS
    if (prefs.matches_email || prefs.matches_sms) {
      const { data: client, error: clientError } = await window.supabaseClient
        .from('clients')
        .select('email, phone')
        .eq('serial_number', clientSerial)
        .single();

      if (clientError) {
        console.warn('[Notifications] Could not fetch client contact info:', clientError);
      } else if (client) {
        console.log(`[Notifications] Client preferences - Email: ${prefs.matches_email}, SMS: ${prefs.matches_sms}`);
        // Step 4: Send external notifications (email/SMS) via webhook
        await sendExternalNotifications({
          email: client.email,
          phone: client.phone,
          emailEnabled: prefs.matches_email,
          smsEnabled: prefs.matches_sms,
          title: title,
          message: message,
          action: action,
          practitionerName: practitionerName,
          projectName: projectName,
          reason: reason
        });
      }
    }

  } catch (error) {
    console.error('[Notifications] Exception in notifyClientOfMatchResponse:', error);
  }
}

/**
 * Send email and/or SMS notifications via backend webhook
 * @param {Object} options - Notification details
 * @private
 */
async function sendExternalNotifications(options) {
  const { email, phone, emailEnabled, smsEnabled, title, message, action, practitionerName, projectName, reason, clientName, emailHtml } = options;

  try {
    if (emailEnabled && email) {

      
      // Get HTML template based on action type
      let finalEmailHtml;
      let subject;
      
      if (emailHtml) {
        // Use provided custom HTML (for practitioner new match)
        finalEmailHtml = emailHtml;
        subject = title;
      } else if (action === 'accepted') {
        subject = `âœ“ ${practitionerName} Accepted Your Match Request`;
        finalEmailHtml = EmailTemplates.matchAccepted({
          clientName: 'Valued Client',
          practitionerName: practitionerName,
          projectName: projectName
        });
      } else if (action === 'declined') {
        subject = `Match Update: ${practitionerName} Declined Your Request`;
        finalEmailHtml = EmailTemplates.matchDeclined({
          clientName: 'Valued Client',
          practitionerName: practitionerName,
          projectName: projectName,
          reason: reason || 'Not specified'
        });
      } else {
        // Generic notification
        subject = title;
        finalEmailHtml = EmailTemplates.system({
          title: title,
          message: message
        });
      }

      // Log email send attempt
      console.log(`[Notifications] SENDING EMAIL to ${email} - Subject: "${subject}"`);

      // Send email via Supabase Edge Function
      const emailResponse = await fetch(
        `${window.supabaseClient.supabaseUrl}/functions/v1/send-notification-email`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await window.supabaseClient.auth.getSession()).data.session?.access_token || ''}`
          },
          body: JSON.stringify({
            to: email,
            subject: subject,
            html: finalEmailHtml,
            type: 'notification'
          })
        }
      );

      if (emailResponse.ok) {
        console.log(`[Notifications] ✓ Email successfully sent to ${email}`);
      } else {
        const errorText = await emailResponse.text();
        console.warn('[Notifications] Email API error:', emailResponse.status, errorText);
        console.warn(`[Notifications] ⚠ Failed to send email to ${email} - Status: ${emailResponse.status}`);
      }
    }

    if (smsEnabled && phone) {
      console.log(`[Notifications] SMS sending requested for ${phone} (not yet implemented)`);
      // TODO: Implement SMS sending via Twilio or similar service
    }

  } catch (error) {
    console.error('[Notifications] Exception sending external notifications:', error);
  }
}

/**
 * Create a notification for practitioner when they receive a new match
 * @param {Object} options - Notification options
 * @param {string} options.practitionerSerial - Practitioner serial number
 * @param {string} options.clientName - Client name for display
 * @param {string} options.projectName - Project name for display
 * @param {string} options.matchScore - Match score/percentage
 * @returns {Promise<void>}
 */
async function notifyPractitionerOfNewMatch(options) {
  const { practitionerSerial, clientName, projectName, matchScore } = options;

  try {
    if (!window.supabaseClient) {
      console.error('[Notifications] Supabase client not initialized');
      return;
    }

    // Check practitioner preferences first
    const { data: preferences, error: prefError } = await window.supabaseClient
      .from('practitioner_notification_settings')
      .select('matches_in_app, matches_email, matches_sms')
      .eq('practitioner_serial', practitionerSerial)
      .single();

    if (prefError) {
      
    }

    // Create in-app notification only if matches_in_app is enabled
    if (!prefError && preferences && !preferences.matches_in_app) {

    } else {
      const title = 'New Match Request';
      const message = `${clientName} has requested to connect with you for "${projectName}" (${matchScore}% match)`;

      const notification = {
        practitioner_serial: practitionerSerial,
        type: 'new_match',
        title: title,
        message: message,
        is_read: false,
        created_at: new Date().toISOString()
      };

      const { error } = await window.supabaseClient
        .from('notifications')
        .insert([notification]);

      if (error) {
        console.error('[Notifications] Failed to create practitioner notification:', error);
      } else {

      }
    }

    // Send email if enabled
    if (!prefError && preferences && (preferences.matches_email || preferences.matches_sms)) {
      const { data: practitioner, error: proError } = await window.supabaseClient
        .from('practitioners')
        .select('email, phone')
        .eq('serial_number', practitionerSerial)
        .single();

      if (practitioner) {
        // Use practitioner-specific email template
        const emailHtml = EmailTemplates.practitionerNewMatch({
          practitionerName: 'Valued Practitioner',
          clientName: clientName,
          projectName: projectName,
          matchScore: matchScore || 'N/A'
        });

        await sendExternalNotifications({
          email: practitioner.email,
          phone: practitioner.phone,
          emailEnabled: preferences.matches_email,
          smsEnabled: preferences.matches_sms,
          title: `New Match Request from ${clientName}`,
          message: `${clientName} has requested to work with you on "${projectName}"`,
          action: 'new_match',
          clientName: clientName,
          projectName: projectName,
          emailHtml: emailHtml
        });
      }
    }

  } catch (error) {
    console.error('[Notifications] Exception in notifyPractitionerOfNewMatch:', error);
  }
}

/**
 * Notify practitioner when client accepts their match
 * @param {Object} options - Notification options
 * @param {string} options.practitionerSerial - Practitioner serial number
 * @param {string} options.clientName - Client name for display
 * @param {string} options.projectName - Project name for display
 * @returns {Promise<void>}
 */
async function notifyPractitionerOfMatchAcceptance(options) {
  const { practitionerSerial, clientName, projectName } = options;

  try {
    if (!window.supabaseClient) {
      console.error('[Notifications] Supabase client not initialized');
      return;
    }

    console.log(`[Notifications] INITIATING MATCH ACCEPTANCE notification for practitioner ${practitionerSerial}`);

    // Check practitioner preferences first
    const { data: preferences, error: prefError } = await window.supabaseClient
      .from('practitioner_notification_settings')
      .select('matches_in_app, matches_email, matches_sms')
      .eq('practitioner_serial', practitionerSerial)
      .single();

    if (prefError) {
      console.warn('[Notifications] Error fetching practitioner preferences:', prefError);
      // Default to enabled if no preferences exist
    }

    // Default to enabled if no preferences found
    const prefs = preferences || { matches_in_app: true, matches_email: true, matches_sms: false };

    // Create in-app notification
    if (prefs.matches_in_app !== false) {
      const title = 'Match Accepted!';
      const message = `${clientName} has accepted your match request for "${projectName}"! You can now start messaging them.`;

      const notification = {
        practitioner_serial: practitionerSerial,
        type: 'match_accepted',
        title: title,
        message: message,
        is_read: false,
        created_at: new Date().toISOString()
      };

      const { error } = await window.supabaseClient
        .from('notifications')
        .insert([notification]);

      if (error) {
        console.error('[Notifications] Failed to create practitioner acceptance notification:', error);
      } else {
        console.log(`[Notifications] ✓ In-app notification created for practitioner ${practitionerSerial}`);
      }
    }

    // Send email if enabled
    if (prefs.matches_email) {
      const { data: practitioner, error: proError } = await window.supabaseClient
        .from('practitioners')
        .select('email, phone')
        .eq('serial_number', practitionerSerial)
        .single();

      if (proError) {
        console.warn('[Notifications] Could not fetch practitioner contact info:', proError);
      } else if (practitioner) {
        console.log(`[Notifications] Practitioner preferences - Email: ${prefs.matches_email}, SMS: ${prefs.matches_sms}`);

        // Use practitioner-specific email template
        const emailHtml = EmailTemplates.practitionerMatchAccepted({
          practitionerName: 'Valued Practitioner',
          clientName: clientName,
          projectName: projectName
        });

        await sendExternalNotifications({
          email: practitioner.email,
          phone: practitioner.phone,
          emailEnabled: prefs.matches_email,
          smsEnabled: prefs.matches_sms,
          title: `${clientName} Accepted Your Match!`,
          message: `${clientName} has accepted your match request for "${projectName}"`,
          action: 'match_accepted',
          clientName: clientName,
          projectName: projectName,
          emailHtml: emailHtml
        });
      }
    }

  } catch (error) {
    console.error('[Notifications] Exception in notifyPractitionerOfMatchAcceptance:', error);
  }
}

/**
 * Mark notification as read
 * @param {string} notificationId - Notification ID
 * @param {string} userType - 'client' or 'practitioner'
 * @returns {Promise<void>}
 */
async function markNotificationAsRead(notificationId, userType) {
  try {
    if (!window.supabaseClient) {
      console.error('[Notifications] Supabase client not initialized');
      return;
    }

    const table = userType === 'client' ? 'client_notifications' : 'notifications';

    const { error } = await window.supabaseClient
      .from(table)
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', notificationId);

    if (error) {
      console.error('[Notifications] Failed to mark notification as read:', error);
    }
  } catch (error) {
    console.error('[Notifications] Exception marking notification as read:', error);
  }
}

/**
 * Send promotions notification to all clients who have it enabled
 * @param {Object} options - Promotion notification options
 * @param {string} options.title - Promotion title
 * @param {string} options.message - Promotion message
 * @param {string} options.promotionType - Type of promotion (discount, announcement, etc.)
 * @param {string} options.buttonUrl - Optional button URL
 * @param {string} options.buttonText - Optional button text
 * @returns {Promise<void>}
 */
async function sendPromotionNotification(options) {
  const { title, message, promotionType = 'promotion', buttonUrl, buttonText = 'Learn More' } = options;

  try {
    if (!window.supabaseClient) {
      console.error('[Notifications] Supabase client not initialized');
      return;
    }


    // Get all clients who have promotions_in_app enabled AND get their email preferences + email
    const { data: settings, error: settingsError } = await window.supabaseClient
      .from('client_notification_settings')
      .select('client_serial, promotions_in_app, promotions_email')
      .eq('promotions_in_app', true);

    if (settingsError) {
      console.error('[Notifications] Error fetching client settings:', settingsError);
      return;
    }

    if (!settings || settings.length === 0) {

      return;
    }


    // Create notifications for each client
    const notifications = settings.map(setting => ({
      client_serial: setting.client_serial,
      type: 'promotions',
      action: promotionType,
      title: title,
      message: message,
      is_read: false,
      created_at: new Date().toISOString()
    }));

    // Insert all notifications at once
    const { data: insertedNotifs, error: insertError } = await window.supabaseClient
      .from('client_notifications')
      .insert(notifications)
      .select();

    if (insertError) {
      console.error('[Notifications] Failed to create promotions notifications:', insertError);
      return;
    }


    // Now send emails to clients who have promotions_email enabled
    const clientSerials = settings
      .filter(s => s.promotions_email)
      .map(s => s.client_serial);

    if (clientSerials.length > 0) {

      
      // Fetch client emails
      const { data: clients, error: clientsError } = await window.supabaseClient
        .from('clients')
        .select('serial_number, email')
        .in('serial_number', clientSerials);

      if (clientsError) {
        console.warn('[Notifications] Error fetching client emails:', clientsError);
        return;
      }

      // Send emails
      for (const client of (clients || [])) {
        try {
          const emailHtml = EmailTemplates.promotion({
            title: title,
            message: message,
            buttonUrl: buttonUrl,
            buttonText: buttonText
          });

          const emailResponse = await fetch(
            `${window.supabaseClient.supabaseUrl}/functions/v1/send-notification-email`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${(await window.supabaseClient.auth.getSession()).data.session?.access_token || ''}`
              },
              body: JSON.stringify({
                to: client.email,
                subject: `âœ¨ ${title}`,
                html: emailHtml,
                type: 'promotion'
              })
            }
          );

          if (emailResponse.ok) {

          } else {
            console.warn('[Notifications] Failed to send email to:', client.email);
          }
        } catch (emailError) {
          console.error('[Notifications] Error sending promotion email to', client.email, ':', emailError);
        }
      }
    }

  } catch (error) {
    console.error('[Notifications] Exception in sendPromotionNotification:', error);
  }
}

/**
 * Delete notification
 * @param {string} notificationId - Notification ID
 * @param {string} userType - 'client' or 'practitioner'
 * @returns {Promise<void>}
 */
async function deleteNotification(notificationId, userType) {
  try {
    if (!window.supabaseClient) {
      console.error('[Notifications] Supabase client not initialized');
      return;
    }

    const table = userType === 'client' ? 'client_notifications' : 'notifications';

    const { error } = await window.supabaseClient
      .from(table)
      .delete()
      .eq('id', notificationId);

    if (error) {
      console.error('[Notifications] Failed to delete notification:', error);
    }
  } catch (error) {
    console.error('[Notifications] Exception deleting notification:', error);
  }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    notifyClientOfMatchResponse,
    notifyPractitionerOfNewMatch,
    notifyPractitionerOfMatchAcceptance,
    markNotificationAsRead,
    deleteNotification
  };
}



























































