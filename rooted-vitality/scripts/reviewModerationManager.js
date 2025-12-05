/*
╔════════════════════════════════════════════════════════════════════╗
║  ROOTED VITALITY, INC.                                             ║
║  File: reviewModerationManager.js                                  ║
║  Purpose: Admin review moderation and approval system              ║
║  Holistic Wellness · Modern Connection Platform                    ║
║  rootedvitality.com | 2025                                         ║
╚════════════════════════════════════════════════════════════════════╝

 TABLE OF CONTENTS
   1. CLASS INITIALIZATION
   2. REVIEW APPROVAL & REJECTION
   3. REVIEW FEATURING & VISIBILITY
   4. BULK OPERATIONS
   5. UTILITIES & HELPERS
*/

// ======================================================
// 1. CLASS INITIALIZATION
// ======================================================

// ============================================================================
// reviewModerationManager.js
// ============================================================================
// Purpose: Admin functions for reviewing and moderating user-submitted reviews
// Location: rooted-vitality/scripts/reviewModerationManager.js
// ============================================================================

class ReviewModerationManager {
  constructor(supabaseClient) {
    this.supabaseClient = supabaseClient || window.supabaseClient;
  }

  /**
   * Approve a review - visible to public after approval
   */
  async approveReview(reviewId, moderationNotes = '') {
    try {
      const { error } = await this.supabaseClient
        .from('reviews')
        .update({
          is_approved: true,
          is_visible: true,
          moderation_notes: moderationNotes,
          updated_at: new Date().toISOString()
        })
        .eq('id', reviewId);

      if (error) throw error;


      return { success: true };
    } catch (error) {
      console.error('[Review Moderation] Error approving review:', error);
      return { success: false, error };
    }
  }

  /**
   * Reject/hide a review - not visible to public
   */
  async rejectReview(reviewId, moderationNotes = '') {
    try {
      const { error } = await this.supabaseClient
        .from('reviews')
        .update({
          is_approved: false,
          is_visible: false,
          moderation_notes: moderationNotes,
          updated_at: new Date().toISOString()
        })
        .eq('id', reviewId);

      if (error) throw error;


      return { success: true };
    } catch (error) {
      console.error('[Review Moderation] Error rejecting review:', error);
      return { success: false, error };
    }
  }

  /**
   * Feature a review - highlight on practitioner profile
   */
  async featureReview(reviewId, isFeatured = true) {
    try {
      const { error } = await this.supabaseClient
        .from('reviews')
        .update({
          is_featured: isFeatured,
          updated_at: new Date().toISOString()
        })
        .eq('id', reviewId);

      if (error) throw error;


      return { success: true };
    } catch (error) {
      console.error('[Review Moderation] Error updating featured status:', error);
      return { success: false, error };
    }
  }

  /**
   * Verify a review - mark as verified/legitimate
   */
  async verifyReview(reviewId, isVerified = true) {
    try {
      const { error } = await this.supabaseClient
        .from('reviews')
        .update({
          is_verified: isVerified,
          updated_at: new Date().toISOString()
        })
        .eq('id', reviewId);

      if (error) throw error;


      return { success: true };
    } catch (error) {
      console.error('[Review Moderation] Error updating verified status:', error);
      return { success: false, error };
    }
  }

  /**
   * Add moderation notes to a review
   */
  async addModerationNotes(reviewId, notes) {
    try {
      const { error } = await this.supabaseClient
        .from('reviews')
        .update({
          moderation_notes: notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', reviewId);

      if (error) throw error;


      return { success: true };
    } catch (error) {
      console.error('[Review Moderation] Error adding moderation notes:', error);
      return { success: false, error };
    }
  }

  /**
   * Get reviews pending approval
   */
  async getPendingReviews(limit = 20) {
    try {
      const { data, error } = await this.supabaseClient
        .from('reviews')
        .select('*')
        .eq('is_approved', false)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;


      return { success: true, data };
    } catch (error) {
      console.error('[Review Moderation] Error fetching pending reviews:', error);
      return { success: false, error };
    }
  }

  /**
   * Get all reviews for a practitioner (including unapproved)
   */
  async getPractitionerAllReviews(practitionerSerial) {
    try {
      const { data, error } = await this.supabaseClient
        .from('reviews')
        .select('*')
        .eq('practitioner_serial', practitionerSerial)
        .order('created_at', { ascending: false });

      if (error) throw error;


      return { success: true, data };
    } catch (error) {
      console.error('[Review Moderation] Error fetching practitioner reviews:', error);
      return { success: false, error };
    }
  }

  /**
   * Import external review (from Google, Yelp, etc)
   */
  async importExternalReview(reviewData) {
    try {
      const {
        practitionerId,
        rating,
        reviewText,
        clientName,
        externalPlatform,
        externalUrl,
        externalReviewId,
        reviewDate = new Date()
      } = reviewData;

      const { error } = await this.supabaseClient
        .from('reviews')
        .insert({
          practitioner_serial: practitionerSerial,
          rating,
          review_text: reviewText,
          client_name: clientName,
          source: 'external_import',
          external_platform: externalPlatform,
          external_url: externalUrl,
          external_review_id: externalReviewId,
          review_date: new Date(reviewDate).toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_approved: true,  // Pre-approved since verified from external platform
          is_visible: true,
          is_verified: true,  // Verified via external platform
          moderation_notes: `Imported from ${externalPlatform}`
        });

      if (error) throw error;


      return { success: true };
    } catch (error) {
      console.error('[Review Moderation] Error importing external review:', error);
      return { success: false, error };
    }
  }
}

// Initialize global instance if not in module
if (typeof window !== 'undefined') {
  window.reviewModerationManager = new ReviewModerationManager(window.supabaseClient);
}


























































