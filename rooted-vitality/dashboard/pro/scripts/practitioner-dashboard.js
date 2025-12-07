/*
╔════════════════════════════════════════════════════════════════════╗
║  ROOTED VITALITY, INC.                                             ║
║  File: practitioner-dashboard.js                                   ║
║  Purpose: DEPRECATED - Notifications moved to practitioner-        ║
║           notifications.js. This file kept for legacy support.     ║
║  Holistic Wellness · Modern Connection Platform                    ║
║  rootedvitality.com | 2025                                         ║
╚════════════════════════════════════════════════════════════════════╝

⚠️  MIGRATION NOTICE:
  All notification functions have been moved to a dedicated module:
  → practitioner-notifications.js
  
  This file is DEPRECATED and kept only for backward compatibility.
  DO NOT use functions from this file - use PractitionerNotifications module instead.
  
  For new code:
    await PractitionerNotifications.init(supabase, authManager);
    await PractitionerNotifications.fetchNotifications();
    PractitionerNotifications.renderNotifications('.rv-notifications-list');
*/

// Deprecated function - provided for backward compatibility only
// Use PractitionerNotifications module instead
async function loadPractitionerNotifications() {
  console.warn('[DEPRECATED] loadPractitionerNotifications() is deprecated. Use PractitionerNotifications.fetchNotifications() instead');
  if (window.PractitionerNotifications) {
    return PractitionerNotifications.fetchNotifications();
  }
}

// Deprecated function - provided for backward compatibility only
async function setupNotificationsRealtimeListener() {
  console.warn('[DEPRECATED] setupNotificationsRealtimeListener() is deprecated. Use PractitionerNotifications.setupRealtimeListener() instead');
  if (window.PractitionerNotifications) {
    return PractitionerNotifications.setupRealtimeListener();
  }
}

/*
╔════════════════════════════════════════════════════════════════════╗
║  LEGACY CODE BELOW - NOT RECOMMENDED FOR NEW DEVELOPMENT           ║
╚════════════════════════════════════════════════════════════════════╝
*/

async function loadPractitionerNotifications() {
  try {
    if (!practitionerId && typeof getPractitionerId === 'function') {
      practitionerId = getPractitionerId();
      console.log('[Pro Notifications] Got practitioner ID from getPractitionerId():', practitionerId);
    }

    if (!practitionerId) {
      console.error('[Pro Notifications] No practitioner ID available after trying all methods');
      return;
    }

    // Get practitioner serial number
    const { data: practitioner, error: practitionerError } = await window.supabaseClient
      .from('practitioners')
      .select('serial_number')
      .eq('id', practitionerId)
      .single();

    if (practitionerError || !practitioner) {
      console.error('[Pro Notifications] Error loading practitioner:', practitionerError);
      return;
    }

    const practitionerSerial = practitioner.serial_number;
    console.log('[Pro Notifications] Got practitioner serial:', practitionerSerial);

    // Fetch all notifications (read and unread) - DO NOT mark as read automatically
    const { data: notifications, error } = await window.supabaseClient
      .from('practitioner_notifications')
      .select('*')
      .eq('practitioner_serial', practitionerSerial)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('[Pro Notifications] Error loading notifications:', error);
      return;
    }

    console.log('[Pro Notifications] Loaded notifications:', notifications?.length || 0);

    // Count unread notifications
    const unreadCount = notifications ? notifications.filter(n => !n.is_read).length : 0;

    // Update notification badge - with retry for header injection
    let attemptCount = 0;
    const maxAttempts = 10;
    let notificationBadge = document.querySelector('.rv-notification-badge');
    
    while (!notificationBadge && attemptCount < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 100));
      notificationBadge = document.querySelector('.rv-notification-badge');
      attemptCount++;
    }

    if (notificationBadge) {
      console.log('[Pro Notifications] Found notification badge, updating with count:', unreadCount);
      if (unreadCount > 0) {
        notificationBadge.textContent = unreadCount;
        notificationBadge.classList.add('active');
        notificationBadge.style.backgroundColor = '#d4c47c'; // Gold accent
      } else {
        notificationBadge.textContent = '0';
        notificationBadge.classList.remove('active');
        notificationBadge.style.backgroundColor = '';
      }
    } else {
      console.warn('[Pro Notifications] Notification badge not found after retries');
    }

    if (notifications && notifications.length > 0) {
      // Update notification list - with retry for header injection
      let notificationsList = document.querySelector('.rv-notifications-list');
      attemptCount = 0;
      
      while (!notificationsList && attemptCount < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 100));
        notificationsList = document.querySelector('.rv-notifications-list');
        attemptCount++;
      }

      if (notificationsList && notificationsList instanceof Element) {
        console.log('[Pro Notifications] Found notifications list, populating with', notifications.length, 'notifications');
        notificationsList.innerHTML = '';
        
        // Display all notifications
        for (const notif of notifications) {
          const notifElement = document.createElement('a');
          notifElement.className = `rv-notifications-item ${notif.is_read ? '' : 'unread'}`;
          notifElement.href = '#';
          notifElement.innerHTML = `
            <p class="rv-notifications-title">${notif.title}</p>
            <p class="rv-notifications-message">${notif.message}</p>
            <p class="rv-notifications-time">${new Date(notif.created_at).toLocaleDateString()}</p>
          `;
          notifElement.addEventListener('click', async (e) => {
            e.preventDefault();
            // Mark as read when user clicks on it
            if (!notif.is_read) {
              await window.supabaseClient
                .from('practitioner_notifications')
                .update({ is_read: true, updated_at: new Date().toISOString() })
                .eq('id', notif.id);
              notifElement.classList.remove('unread');
              // Update badge
              await loadPractitionerNotifications();
            }
          });
          notificationsList.appendChild(notifElement);
        }
      } else {
        console.warn('[Pro Notifications] Notifications list not found after retries');
      }
    }
  } catch (error) {
    console.error('[Pro Notifications] Exception loading notifications:', error);
  }
}

/**
 * Setup real-time subscription for practitioner notifications
 * Automatically reloads notifications when they change in the database
 */
async function setupNotificationsRealtimeListener() {
  try {
    if (!window.supabaseClient) {
      console.error('[Pro Notifications] Supabase client not ready for realtime');
      return;
    }

    // Get practitioner ID using same methods as loadPractitionerNotifications
    let practitionerId = null;
    
    const rvUserStr = localStorage.getItem('rvUser');
    if (rvUserStr) {
      try {
        const rvUser = JSON.parse(rvUserStr);
        practitionerId = rvUser.id;
      } catch (e) {
        console.warn('[Pro Notifications] Failed to parse rvUser from localStorage:', e);
      }
    }
    
    if (!practitionerId && window.authManager) {
      const currentUser = window.authManager.getCurrentUser();
      if (currentUser) {
        practitionerId = currentUser.id;
      }
    }
    
    if (!practitionerId && typeof getPractitionerId === 'function') {
      practitionerId = getPractitionerId();
    }

    if (!practitionerId) {
      console.warn('[Pro Notifications] No practitioner ID for realtime setup');
      return;
    }

    // Get practitioner serial
    const { data: practitioner } = await window.supabaseClient
      .from('practitioners')
      .select('serial_number')
      .eq('id', practitionerId)
      .single();

    if (!practitioner) {
      console.warn('[Pro Notifications] Practitioner not found for realtime setup');
      return;
    }

    const practitionerSerial = practitioner.serial_number;
    console.log('[Pro Notifications] Setting up realtime listener for:', practitionerSerial);

    const channel = window.supabaseClient
      .channel(`prac-notif:${practitionerSerial}`)
      .on(
        'postgres_changes',
        {
          event: '*',  // Listen for all changes (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'practitioner_notifications',
          filter: `practitioner_serial=eq.${practitionerSerial}`
        },
        (payload) => {
          console.log('[Pro Notifications] Realtime event received:', payload.eventType, payload);
          
          // Handle new notifications (INSERT)
          if (payload.eventType === 'INSERT' && payload.new) {
            const newNotif = payload.new;
            console.log('[Pro Notifications] New notification received:', newNotif.title);

            // Add to the notifications list if it exists
            const notificationsList = document.querySelector('.rv-notifications-list');
            if (notificationsList && notificationsList instanceof Element) {
              const notifElement = document.createElement('a');
              notifElement.className = `rv-notifications-item unread`;
              notifElement.href = '#';
              notifElement.innerHTML = `
                <p class="rv-notifications-title">${newNotif.title}</p>
                <p class="rv-notifications-message">${newNotif.message}</p>
                <p class="rv-notifications-time">${new Date(newNotif.created_at).toLocaleDateString()}</p>
              `;
              notifElement.addEventListener('click', async (e) => {
                e.preventDefault();
                if (!newNotif.is_read) {
                  await window.supabaseClient
                    .from('practitioner_notifications')
                    .update({ is_read: true, updated_at: new Date().toISOString() })
                    .eq('id', newNotif.id);
                  notifElement.classList.remove('unread');
                  await loadPractitionerNotifications();
                }
              });
              notificationsList.insertBefore(notifElement, notificationsList.firstChild);
            }

            // Update badge count
            loadPractitionerNotifications();
          } 
          // Handle updates (when notification is marked as read on another page/tab)
          else if (payload.eventType === 'UPDATE' && payload.new) {
            console.log('[Pro Notifications] Notification updated:', payload.new.id, 'is_read:', payload.new.is_read);
            
            // Reload all notifications to reflect the updated read status
            loadPractitionerNotifications();
          } 
          // Handle deletes
          else if (payload.eventType === 'DELETE' && payload.old) {
            console.log('[Pro Notifications] Notification deleted:', payload.old.id);
            // Reload notifications
            loadPractitionerNotifications();
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('[Pro Notifications] Real-time subscription established for:', practitionerSerial);
        } else if (status === 'CHANNEL_ERROR') {
          console.error('[Pro Notifications] Real-time channel error');
        }
      });

    // Store reference for cleanup if needed
    window._practitionerNotificationsChannel = channel;
  } catch (error) {
    console.error('[Pro Notifications] Failed to setup real-time listener:', error);
  }
}

/**
 * Get practitioner ID from current user (utility function)
 */
function getPractitionerIdFromAuth() {
  try {
    if (window.authManager && typeof window.authManager.getCurrentUser === 'function') {
      const user = window.authManager.getCurrentUser();
      return user ? user.id : null;
    }
  } catch (e) {
    return null;
  }
}

// Export functions globally
window.loadPractitionerNotifications = loadPractitionerNotifications;
window.setupNotificationsRealtimeListener = setupNotificationsRealtimeListener;
window.getPractitionerIdFromAuth = getPractitionerIdFromAuth;
