/*
╔════════════════════════════════════════════════════════════════════╗
║  ROOTED VITALITY, INC.                                             ║
║  File: scripts/notificationManager.js                               ║
║  Purpose: Centralized notification management for all channels     ║
║  Holistic Wellness · Modern Connection Platform                    ║
║  rootedvitality.com | 2025                                         ║
╚════════════════════════════════════════════════════════════════════╝

FUNCTIONALITY:
- Create notifications for clients and practitioners
- Respect notification preferences (in-app, email, SMS)
- Handle different notification types (matches, messages, reviews, etc.)
- Send email/SMS via webhook integration to backend
- Real-time notification badge updates
*/

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

    // Determine notification title and message based on action
    let title, message;
    if (action === 'accepted') {
      title = '✓ Connection Accepted';
      message = `${practitionerName} has accepted your request for "${projectName}"! You can now start messaging them.`;
    } else if (action === 'declined') {
      title = '✗ Connection Declined';
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
      console.log('[Notifications] In-app notification created for', clientSerial);
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
  const { email, phone, emailEnabled, smsEnabled, title, message, action, practitionerName, projectName, reason } = options;

  try {
    // This would typically call a backend webhook that handles actual email/SMS sending
    // For now, log the notification that would be sent
    
    if (emailEnabled && email) {
      console.log('[Notifications] Email would be sent to:', email);
      console.log('[Notifications] Subject:', title);
      console.log('[Notifications] Body:', message);
      
      // TODO: Implement webhook call to backend for email sending
      // const emailResponse = await fetch('/api/send-notification', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     type: 'email',
      //     email: email,
      //     subject: title,
      //     body: message,
      //     notificationType: 'match_response'
      //   })
      // });
    }

    if (smsEnabled && phone) {
      console.log('[Notifications] SMS would be sent to:', phone);
      console.log('[Notifications] Body:', message.substring(0, 160));
      
      // TODO: Implement webhook call to backend for SMS sending
      // const smsResponse = await fetch('/api/send-notification', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     type: 'sms',
      //     phone: phone,
      //     body: message.substring(0, 160), // SMS character limit
      //     notificationType: 'match_response'
      //   })
      // });
    }
  } catch (error) {
    console.error('[Notifications] Error sending external notifications:', error);
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

    const title = 'New Match Request';
    const message = `${clientName} has requested to connect with you for "${projectName}" (${matchScore}% match)`;

    // Create in-app notification
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
      console.log('[Notifications] Practitioner notification created for', practitionerSerial);
    }

    // Check practitioner preferences and send email/SMS if enabled
    const { data: preferences, error: prefError } = await window.supabaseClient
      .from('practitioner_notification_settings')
      .select('matches_email, matches_sms')
      .eq('practitioner_serial', practitionerSerial)
      .single();

    if (!prefError && preferences && (preferences.matches_email || preferences.matches_sms)) {
      const { data: practitioner, error: proError } = await window.supabaseClient
        .from('practitioners')
        .select('email, phone')
        .eq('serial_number', practitionerSerial)
        .single();

      if (practitioner) {
        await sendExternalNotifications({
          email: practitioner.email,
          phone: practitioner.phone,
          emailEnabled: preferences.matches_email,
          smsEnabled: preferences.matches_sms,
          title: title,
          message: message,
          action: 'new_match',
          clientName: clientName,
          projectName: projectName
        });
      }
    }

  } catch (error) {
    console.error('[Notifications] Exception in notifyPractitionerOfNewMatch:', error);
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
    markNotificationAsRead,
    deleteNotification
  };
}
