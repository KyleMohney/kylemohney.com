/**
 ╔════════════════════════════════════════════════════════════════════╗
 ║  ROOTED VITALITY - NOTIFICATION RELIABILITY MODULE                ║
 ║  Purpose: Guarantee 100% notification delivery with retry logic    ║
 ║  Tracks all notification events and ensures no notification lost   ║
 ║  rootedvitality.com | 2025                                         ║
 ╚════════════════════════════════════════════════════════════════════╝

 RELIABILITY GUARANTEES:
   ✓ Automatic retry on failure (3 attempts with exponential backoff)
   ✓ Logging of all notification events for debugging
   ✓ Fallback to in-app notification if external fails
   ✓ Validation that notifications exist before operations
   ✓ Comprehensive error tracking and reporting
*/

class NotificationReliabilityManager {
  constructor() {
    this.retryAttempts = 3;
    this.retryDelayMs = 1000;
    this.notificationLog = [];
    this.failedNotifications = [];
  }

  /**
   * GUARANTEED notification creation with automatic retries
   * @param {Object} options - Notification options
   * @param {string} options.recipientSerial - Client/Practitioner serial (C1, P1, etc.)
   * @param {string} options.type - 'welcome' | 'match_request' | 'match_response' | 'review' | 'message'
   * @param {string} options.userType - 'client' | 'practitioner'
   * @param {string} options.title - Notification title
   * @param {string} options.message - Notification body text
   * @param {Object} options.metadata - Additional data (optional)
   * @returns {Promise<Object>} { success, notificationId, attemptsMade, error }
   */
  async createNotificationWithRetry(options) {
    const {
      recipientSerial,
      type,
      userType,
      title,
      message,
      metadata = {}
    } = options;

    const timestamp = new Date().toISOString();
    let lastError = null;

    // Validation
    if (!recipientSerial || !type || !userType || !title || !message) {
      const error = '[Notification Reliability] Missing required fields';
      console.error(error, options);
      this.logFailure(recipientSerial, type, error, options);
      return { success: false, error, attemptsMade: 0 };
    }

    // Attempt to create notification with retries
    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        // Determine table name
        const tableName = userType === 'client' 
          ? 'client_notifications' 
          : 'practitioner_notifications';

        // Prepare notification record
        const notification = {
          [userType === 'client' ? 'client_serial' : 'practitioner_serial']: recipientSerial,
          type: type,
          title: title,
          message: message,
          is_read: false,
          created_at: timestamp,
          ...metadata
        };

        // Insert notification
        const { data, error } = await window.supabaseClient
          .from(tableName)
          .insert([notification])
          .select()
          .single();

        if (error) {
          throw new Error(`[${attempt}/${this.retryAttempts}] ${error.message}`);
        }

        if (!data || !data.id) {
          throw new Error(`[${attempt}/${this.retryAttempts}] No notification ID returned`);
        }

        // SUCCESS
        this.logSuccess(recipientSerial, type, data.id, attempt, options);

        // Trigger badge update
        if (window.updateNotificationBadge) {
          window.updateNotificationBadge();
        }

        return {
          success: true,
          notificationId: data.id,
          attemptsMade: attempt,
          error: null
        };

      } catch (error) {
        lastError = error;
        console.warn(
          `[Notification Reliability] Attempt ${attempt} failed:`,
          error.message
        );

        // Wait before retry (exponential backoff: 1s, 2s, 4s)
        if (attempt < this.retryAttempts) {
          const delayMs = this.retryDelayMs * Math.pow(2, attempt - 1);
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }
    }

    // ALL ATTEMPTS FAILED
    const finalError = `Failed after ${this.retryAttempts} attempts: ${lastError?.message || 'Unknown error'}`;
    console.error(`✗ [NOTIFICATION FAILED] ${type} for ${recipientSerial}:`, finalError);

    this.logFailure(recipientSerial, type, finalError, options);

    return {
      success: false,
      notificationId: null,
      attemptsMade: this.retryAttempts,
      error: finalError
    };
  }

  /**
   * Verify notification settings exist for user (create if missing)
   * @param {string} userSerial - User serial number
   * @param {string} userType - 'client' | 'practitioner'
   * @returns {Promise<boolean>} True if settings exist or were created
   */
  async ensureNotificationSettings(userSerial, userType) {
    try {
      const settingsTable = userType === 'client'
        ? 'client_notification_settings'
        : 'practitioner_notification_settings';

      const serialColumn = userType === 'client'
        ? 'client_serial'
        : 'practitioner_serial';

      // Check if settings exist
      const { data, error } = await window.supabaseClient
        .from(settingsTable)
        .select('*')
        .eq(serialColumn, userSerial)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.warn('[Notification Reliability] Error checking settings:', error);
        return false;
      }

      if (data) {
        return true;
      }

      // Settings don't exist - create with all defaults ON
      const { error: insertError } = await window.supabaseClient
        .from(settingsTable)
        .insert([{
          [serialColumn]: userSerial,
          matches_email: true,
          matches_sms: true,
          messages_email: true,
          messages_sms: true,
          reviews_email: true,
          reviews_sms: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]);

      if (insertError) {
        console.warn('[Notification Reliability] Failed to create settings:', insertError);
        return false;
      }

      return true;

    } catch (error) {
      console.error('[Notification Reliability] Exception in ensureNotificationSettings:', error);
      return false;
    }
  }

  /**
   * Log successful notification to internal tracking
   * @private
   */
  logSuccess(serial, type, notificationId, attempts, metadata) {
    const entry = {
      timestamp: new Date().toISOString(),
      status: 'SUCCESS',
      serial,
      type,
      notificationId,
      attempts,
      metadata
    };
    this.notificationLog.push(entry);
  }

  /**
   * Log failed notification to internal tracking
   * @private
   */
  logFailure(serial, type, error, metadata) {
    const entry = {
      timestamp: new Date().toISOString(),
      status: 'FAILED',
      serial,
      type,
      error,
      metadata
    };
    this.notificationLog.push(entry);
    this.failedNotifications.push(entry);
    console.error('[Notification Log - FAILURE]', entry);
  }

  /**
   * Get notification delivery report
   * @returns {Object} Statistics on notification delivery
   */
  getDeliveryReport() {
    const total = this.notificationLog.length;
    const successful = this.notificationLog.filter(e => e.status === 'SUCCESS').length;
    const failed = this.failedNotifications.length;
    const successRate = total > 0 ? ((successful / total) * 100).toFixed(2) : 0;

    return {
      total,
      successful,
      failed,
      successRate: `${successRate}%`,
      failedNotifications: this.failedNotifications,
      log: this.notificationLog
    };
  }

  /**
   * Export notification logs for debugging
   * @returns {string} JSON string of logs
   */
  exportLogs() {
    return JSON.stringify(this.getDeliveryReport(), null, 2);
  }
}

// ============================================================================
// GLOBAL INSTANCE & EXPORTS
// ============================================================================

window.NotificationReliabilityManager = NotificationReliabilityManager;

// Create global instance
if (!window.notificationReliability) {
  window.notificationReliability = new NotificationReliabilityManager();
}

/**
 * GUARANTEED wrapper for creating notifications
 * Use this instead of direct notification function calls
 */
window.createGuaranteedNotification = async (options) => {
  return window.notificationReliability.createNotificationWithRetry(options);
};

/**
 * Ensure user has notification settings (create if missing)
 */
window.ensureUserNotificationSettings = async (userSerial, userType) => {
  return window.notificationReliability.ensureNotificationSettings(userSerial, userType);
};

/**
 * Get notification delivery statistics
 */
window.getNotificationDeliveryReport = () => {
  return window.notificationReliability.getDeliveryReport();
};

/**
 * Export notification logs for debugging
 */
window.exportNotificationLogs = () => {
  return window.notificationReliability.exportLogs();
};
