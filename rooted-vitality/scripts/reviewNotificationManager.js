/*
╔════════════════════════════════════════════════════════════════════╗
║  ROOTED VITALITY, INC.                                             ║
║  File: reviewNotificationManager.js                                ║
║  Purpose: Real-time review notifications for practitioners         ║
║  Holistic Wellness · Modern Connection Platform                    ║
║  rootedvitality.com | 2025                                         ║
╚════════════════════════════════════════════════════════════════════╝

 TABLE OF CONTENTS
   1. INITIALIZATION & CONFIGURATION
   2. REAL-TIME SUBSCRIPTION SETUP
   3. NOTIFICATION HANDLING & DISPATCH
   4. EVENT LISTENERS & UI UPDATE
   5. UTILITIES & HELPERS

 ARCHITECTURE:
   - Listens for new reviews posted in real-time
   - Notifies practitioners via in-app notifications when they receive reviews
   - Uses Supabase Realtime subscriptions to watch reviews table
   - Sends notification data via events system
*/

// ======================================================
// 1. INITIALIZATION & CONFIGURATION
// ======================================================

let reviewNotificationManager = {
  supabaseClient: null,
  authManager: null,
  subscription: null,
  practitionerId: null,
  isInitialized: false,

  // ======================================================
  // INITIALIZATION
  // ======================================================

  init(supabaseClient, authManager) {
    this.supabaseClient = supabaseClient;
    this.authManager = authManager;
    
    const user = authManager.getCurrentUser();
    if (!user || user.role !== 'practitioner') {

      return;
    }

    this.practitionerId = user.id;
    this.setupRealtimeSubscription();
    this.isInitialized = true;
  },

  // ======================================================
  // REAL-TIME SUBSCRIPTION
  // ======================================================

  setupRealtimeSubscription() {
    if (!this.practitionerId || !this.supabaseClient) {
      console.error('[Review Notifications] Missing practitioner ID or Supabase client');
      return;
    }

    try {
      // Subscribe to reviews table for INSERT events where practitioner_id matches
      this.subscription = this.supabaseClient
        .channel(`reviews:${this.practitionerId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'reviews',
            filter: `practitioner_id=eq.${this.practitionerId}`
          },
          (payload) => {

            this.handleNewReview(payload.new);
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            // Subscription established
          } else if (status === 'CHANNEL_ERROR') {

          } else if (status === 'CLOSED') {

          }
        });
    } catch (error) {
      console.error('[Review Notifications] Failed to setup subscription:', error);
    }
  },

  // ======================================================
  // NOTIFICATION HANDLING
  // ======================================================

  handleNewReview(review) {
    if (!review) return;

    // Create notification object
    const notification = {
      id: review.id,
      type: 'review_posted',
      title: 'â­ New Review Received!',
      message: `${review.client_name} left a ${review.rating}-star review: "${review.review_text?.substring(0, 50)}${review.review_text?.length > 50 ? '...' : ''}"`,
      rating: review.rating,
      clientName: review.client_name,
      reviewId: review.id,
      timestamp: new Date(review.created_at).toLocaleTimeString(),
      link: '/rooted-vitality/dashboard/pro/pages/practitioner-public-profile.html?section=reviews',
      isRead: false
    };

    // Dispatch custom event for UI to listen to
    const event = new CustomEvent('reviewNotification', {
      detail: notification
    });
    window.dispatchEvent(event);

    // Show toast notification if function exists
    if (window.showNotificationToast && typeof window.showNotificationToast === 'function') {
      window.showNotificationToast(notification);
    }

    // Log for monitoring

  },

  // ======================================================
  // CLEANUP
  // ======================================================

  destroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();

    }
    this.isInitialized = false;
  }
};

// Make available globally
window.reviewNotificationManager = reviewNotificationManager;


























































