/*
╔════════════════════════════════════════════════════════════════════╗
║  ROOTED VITALITY, INC.                                             ║
║  File: practitioner-notifications.js                               ║
║  Purpose: Centralized notification management for all practitioner ║
║           dashboard pages - handles loading, reading, real-time    ║
║  Holistic Wellness · Modern Connection Platform                    ║
║  rootedvitality.com | 2025                                         ║
╚════════════════════════════════════════════════════════════════════╝

TABLE OF CONTENTS
  1. Initialization & State Management
  2. Notification Loading & Fetching
  3. Notification Read/Unread Status
  4. Real-time Subscription Management
  5. Badge & UI Updates
  6. Public API (Export)
*/

// ======================================================
// 1. INITIALIZATION & STATE MANAGEMENT
// ======================================================

const PractitionerNotifications = (() => {
  // Private state
  let supabaseClient = null;
  let authManager = null;
  let practitionerId = null;
  let practitionerSerial = null;
  let realtimeChannel = null;
  let isInitialized = false;
  let notificationCache = [];

  /**
   * Initialize the notification manager with auth and database clients
   * Call this once on page load
   */
  async function init(supabase, auth) {
    try {
      if (isInitialized) {
        console.warn('[Practitioner Notifications] Already initialized');
        return;
      }

      if (!supabase || !auth) {
        console.error('[Practitioner Notifications] Supabase and auth managers required');
        return;
      }

      supabaseClient = supabase;
      authManager = auth;

      // Get current user
      const currentUser = authManager.getCurrentUser?.();
      if (!currentUser) {
        console.warn('[Practitioner Notifications] No authenticated user');
        return;
      }

      practitionerId = currentUser.id;

      // Get practitioner serial from database
      const { data: practitioner, error } = await supabaseClient
        .from('practitioners')
        .select('serial_number')
        .eq('id', practitionerId)
        .single();

      if (error || !practitioner) {
        console.warn('[Practitioner Notifications] Could not fetch practitioner:', error);
        return;
      }

      practitionerSerial = practitioner.serial_number;
      isInitialized = true;

    } catch (error) {
      console.error('[Practitioner Notifications] Initialization error:', error);
    }
  }

  /**
   * Get current state (for debugging)
   */
  function getState() {
    return {
      isInitialized,
      practitionerId,
      practitionerSerial,
      cacheSize: notificationCache.length
    };
  }

  // ======================================================
  // 2. NOTIFICATION LOADING & FETCHING
  // ======================================================

  /**
   * Fetch all notifications for the practitioner
   * @returns {Promise<Array>} Array of notification objects
   */
  async function fetchNotifications() {
    try {
      if (!isInitialized || !practitionerSerial) {
        console.warn('[Practitioner Notifications] Not initialized, cannot fetch');
        return [];
      }

      const { data, error } = await supabaseClient
        .from('practitioner_notifications')
        .select('*')
        .eq('practitioner_serial', practitionerSerial)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('[Practitioner Notifications] Fetch error:', error);
        return [];
      }

      notificationCache = data || [];
      return notificationCache;

    } catch (error) {
      console.error('[Practitioner Notifications] Exception fetching:', error);
      return [];
    }
  }

  /**
   * Get cached notifications (without re-fetching)
   * @returns {Array} Cached notification objects
   */
  function getCached() {
    return notificationCache;
  }

  /**
   * Get unread count from cache
   * @returns {number} Count of unread notifications
   */
  function getUnreadCount() {
    return notificationCache.filter(n => !n.is_read).length;
  }

  // ======================================================
  // 3. NOTIFICATION READ/UNREAD STATUS
  // ======================================================

  /**
   * Mark a single notification as read
   * @param {string} notificationId - The notification ID
   * @returns {Promise<boolean>} Success status
   */
  async function markAsRead(notificationId) {
    try {
      if (!supabaseClient) {
        console.error('[Practitioner Notifications] Supabase not initialized');
        return false;
      }

      // Must filter by BOTH id AND practitioner_serial to satisfy RLS policy
      const { error } = await supabaseClient
        .from('practitioner_notifications')
        .update({
          is_read: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', notificationId)
        .eq('practitioner_serial', practitionerSerial);

      if (error) {
        console.error('[Practitioner Notifications] Error marking as read:', error);
        return false;
      }

      // Update cache
      const notif = notificationCache.find(n => n.id === notificationId);
      if (notif) {
        notif.is_read = true;
        notif.updated_at = new Date().toISOString();
      }

      return true;

    } catch (error) {
      console.error('[Practitioner Notifications] Exception marking as read:', error);
      return false;
    }
  }

  /**
   * Mark ALL unread notifications as read at once
   * @returns {Promise<boolean>} Success status
   */
  async function markAllAsRead() {
    try {
      if (!isInitialized || !practitionerSerial) {
        console.warn('[Practitioner Notifications] Not initialized');
        return false;
      }

      const { error } = await supabaseClient
        .from('practitioner_notifications')
        .update({
          is_read: true,
          updated_at: new Date().toISOString()
        })
        .eq('practitioner_serial', practitionerSerial)
        .eq('is_read', false);

      if (error) {
        console.error('[Practitioner Notifications] Error marking all as read:', error);
        return false;
      }

      // Update cache
      notificationCache.forEach(n => {
        n.is_read = true;
        n.updated_at = new Date().toISOString();
      });

      return true;

    } catch (error) {
      console.error('[Practitioner Notifications] Exception marking all as read:', error);
      return false;
    }
  }

  /**
   * Delete a notification
   * @param {string} notificationId - The notification ID
   * @returns {Promise<boolean>} Success status
   */
  async function deleteNotification(notificationId) {
    try {
      if (!supabaseClient) {
        console.error('[Practitioner Notifications] Supabase not initialized');
        return false;
      }

      const { error } = await supabaseClient
        .from('practitioner_notifications')
        .delete()
        .eq('id', notificationId);

      if (error) {
        console.error('[Practitioner Notifications] Error deleting:', error);
        return false;
      }

      // Update cache
      notificationCache = notificationCache.filter(n => n.id !== notificationId);
      return true;

    } catch (error) {
      console.error('[Practitioner Notifications] Exception deleting:', error);
      return false;
    }
  }

  // ======================================================
  // 4. REAL-TIME SUBSCRIPTION MANAGEMENT
  // ======================================================

  /**
   * Setup real-time listener for notification changes
   * Automatically reloads when notifications change in database
   * @param {Function} onNotificationChange - Callback when notifications update
   * @returns {Promise<void>}
   */
  async function setupRealtimeListener(onNotificationChange) {
    try {
      if (!isInitialized || !practitionerSerial || !supabaseClient) {
        console.warn('[Practitioner Notifications] Cannot setup realtime listener');
        return;
      }

      // Cleanup existing channel if any
      if (realtimeChannel) {
        await supabaseClient.removeChannel(realtimeChannel);
      }

      const channelName = `prac-notif:${practitionerSerial}`;

      realtimeChannel = supabaseClient
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'practitioner_notifications',
            filter: `practitioner_serial=eq.${practitionerSerial}`
          },
          (payload) => {
            // Handle INSERT (new notification)
            if (payload.eventType === 'INSERT' && payload.new) {
              notificationCache.unshift(payload.new);
              if (onNotificationChange) {
                onNotificationChange('INSERT', payload.new);
              }
            }
            // Handle UPDATE (marked as read, etc)
            else if (payload.eventType === 'UPDATE' && payload.new) {
              const index = notificationCache.findIndex(n => n.id === payload.new.id);
              if (index !== -1) {
                notificationCache[index] = payload.new;
              }
              if (onNotificationChange) {
                onNotificationChange('UPDATE', payload.new);
              }
            }
            // Handle DELETE
            else if (payload.eventType === 'DELETE' && payload.old) {
              notificationCache = notificationCache.filter(n => n.id !== payload.old.id);
              if (onNotificationChange) {
                onNotificationChange('DELETE', payload.old);
              }
            }
          }
        )
        .subscribe((status) => {
          // Subscription status updated
        });

    } catch (error) {
      console.error('[Practitioner Notifications] Exception setting up realtime:', error);
    }
  }

  /**
   * Cleanup realtime subscriptions (call on page unload)
   */
  async function cleanup() {
    try {
      if (realtimeChannel && supabaseClient) {
        await supabaseClient.removeChannel(realtimeChannel);
      }
    } catch (error) {
      console.error('[Practitioner Notifications] Exception cleanup:', error);
    }
  }

  // ======================================================
  // 5. BADGE & UI UPDATES
  // ======================================================

  /**
   * Update the notification badge in the header
   * @param {number} count - Unread count (optional, auto-calculated if omitted)
   * @returns {boolean} Success status
   */
  function updateBadge(count) {
    try {
      const badge = document.querySelector('.rv-notification-badge');
      if (!badge) {
        console.warn('[Practitioner Notifications] Badge element not found');
        return false;
      }

      const unreadCount = count !== undefined ? count : getUnreadCount();

      if (unreadCount > 0) {
        badge.textContent = unreadCount;
        badge.classList.add('active');
        // Let CSS handle styling via .active class
      } else {
        badge.textContent = '0';
        badge.classList.remove('active');
        // CSS removes background on .active class removal
      }

      return true;

    } catch (error) {
      console.error('[Practitioner Notifications] Exception updating badge:', error);
      return false;
    }
  }

  /**
   * Render notifications to a container
   * @param {string|HTMLElement} container - CSS selector or DOM element
   * @param {Array} notifications - Notifications to render (uses cache if omitted)
   * @returns {boolean} Success status
   */
  function renderNotifications(container, notifications) {
    try {
      const containerEl = typeof container === 'string'
        ? document.querySelector(container)
        : container;

      if (!containerEl) {
        console.warn('[Practitioner Notifications] Container not found');
        return false;
      }

      const notifs = notifications || notificationCache;
      containerEl.innerHTML = '';

      if (notifs.length === 0) {
        containerEl.innerHTML = '<p class="rv-notifications-empty">No notifications</p>';
        return true;
      }

      notifs.forEach(notif => {
        const elem = document.createElement('a');
        elem.className = `rv-notifications-item ${notif.is_read ? '' : 'unread'}`;
        elem.href = '#';
        elem.dataset.notificationId = notif.id;
        elem.innerHTML = `
          <p class="rv-notifications-title">${notif.title}</p>
          <p class="rv-notifications-message">${notif.message}</p>
          <p class="rv-notifications-time">${new Date(notif.created_at).toLocaleDateString()}</p>
        `;

        // Mark as read on click
        elem.addEventListener('click', async (e) => {
          e.preventDefault();
          if (!notif.is_read) {
            await markAsRead(notif.id);
            updateBadge();
            elem.classList.remove('unread');
          }
        });

        containerEl.appendChild(elem);
      });

      return true;

    } catch (error) {
      console.error('[Practitioner Notifications] Exception rendering:', error);
      return false;
    }
  }

  // ======================================================
  // 6. PUBLIC API (EXPORT)
  // ======================================================

  return {
    init,
    getState,
    fetchNotifications,
    getCached,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    setupRealtimeListener,
    cleanup,
    updateBadge,
    renderNotifications
  };

})();

// Export for use in HTML scripts
window.PractitionerNotifications = PractitionerNotifications;
