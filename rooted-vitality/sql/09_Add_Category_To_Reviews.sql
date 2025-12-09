-- ============================================================================
-- MIGRATION: Add Category Column to Reviews Table
-- ============================================================================
-- Purpose: Track which category of care each review is for
-- For platform reviews: auto-filled from project's category
-- For off-platform reviews: user selects from taxonomy via dropdown
-- ============================================================================

-- Add category column to reviews table
ALTER TABLE reviews
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES holistic_health_taxonomy(id) ON DELETE SET NULL;

-- Add index for faster filtering by category
CREATE INDEX IF NOT EXISTS idx_reviews_category_id ON reviews(category_id);

-- Add composite index for common queries
CREATE INDEX IF NOT EXISTS idx_reviews_practitioner_category ON reviews(practitioner_id, category_id) 
WHERE is_visible = true AND is_approved = true;

-- ============================================================================
-- NOTES:
-- ============================================================================
-- 1. For existing ON-PLATFORM reviews:
--    These should auto-populate from the associated project's category
--    Use trigger or batch update when you have project_id relationship
--
-- 2. For OFF-PLATFORM reviews (source = 'review-link'):
--    User selects category via dropdown in review.html form
--    Category is stored at submission time
--
-- 3. Display Usage:
--    - Show category name alongside rating/date on profile
--    - Filter reviews by category on both practitioner and public profiles
--    - Use in search/discovery to surface reviews by specific service type
--
-- 4. Trigger Recommendation:
--    Create trigger on project_practitioner_matches table to auto-update
--    reviews.category_id when a review is linked to a project
-- ============================================================================
