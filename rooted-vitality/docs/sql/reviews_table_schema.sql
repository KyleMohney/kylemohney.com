-- =============================================
-- ROOTED VITALITY REVIEWS TABLE SCHEMA
-- =============================================
-- Purpose: Store client reviews and testimonials for practitioners
-- Created: November 4, 2025
-- Integration: Links to practitioners table

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    practitioner_id UUID NOT NULL REFERENCES practitioners(user_id) ON DELETE CASCADE,
    client_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Review content
    client_name TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT NOT NULL,
    
    -- Review metadata
    source TEXT NOT NULL CHECK (source IN ('platform', 'external')) DEFAULT 'platform',
    is_verified BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    is_visible BOOLEAN DEFAULT true,
    
    -- External review details (for imported reviews)
    external_platform TEXT, -- 'google', 'yelp', 'facebook', etc.
    external_url TEXT,
    external_review_id TEXT,
    
    -- Moderation
    is_approved BOOLEAN DEFAULT true,
    moderation_notes TEXT,
    
    -- Timestamps
    review_date TIMESTAMP DEFAULT now(),
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_reviews_practitioner_id ON reviews(practitioner_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_source ON reviews(source);
CREATE INDEX IF NOT EXISTS idx_reviews_approved_visible ON reviews(is_approved, is_visible);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at);

-- Enable Row Level Security
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Practitioners can read all their own reviews
CREATE POLICY "Practitioners can view own reviews"
    ON reviews FOR SELECT
    USING (practitioner_id = auth.uid());

-- Practitioners can update their own reviews (for featuring/visibility)
CREATE POLICY "Practitioners can update own reviews"
    ON reviews FOR UPDATE
    USING (practitioner_id = auth.uid());

-- Only allow updates to specific fields by practitioners
CREATE POLICY "Practitioners limited update fields"
    ON reviews FOR UPDATE
    USING (practitioner_id = auth.uid())
    WITH CHECK (
        -- Practitioners can only update visibility and featured status
        (OLD.client_name = NEW.client_name) AND
        (OLD.rating = NEW.rating) AND
        (OLD.review_text = NEW.review_text) AND
        (OLD.source = NEW.source) AND
        (OLD.client_id = NEW.client_id)
    );

-- Clients can insert reviews for practitioners
CREATE POLICY "Clients can create reviews"
    ON reviews FOR INSERT
    WITH CHECK (client_id = auth.uid());

-- Clients can update their own reviews (within time limit - business logic)
CREATE POLICY "Clients can update own reviews"
    ON reviews FOR UPDATE
    USING (client_id = auth.uid());

-- Public can view approved and visible reviews (for practitioner profiles)
CREATE POLICY "Public can view approved reviews"
    ON reviews FOR SELECT
    USING (is_approved = true AND is_visible = true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER reviews_updated_at
    BEFORE UPDATE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_reviews_updated_at();

-- =============================================
-- SAMPLE DATA (for testing)
-- =============================================

-- Insert sample reviews (replace with actual practitioner user_id)
-- INSERT INTO reviews (practitioner_id, client_name, rating, review_text, source) VALUES 
-- ('your-practitioner-user-id-here', 'Sarah Johnson', 5, 'Amazing experience! The practitioner was very professional and knowledgeable. Highly recommend!', 'platform'),
-- ('your-practitioner-user-id-here', 'Michael Chen', 5, 'Great service and very attentive to my needs. Will definitely book again.', 'platform'),
-- ('your-practitioner-user-id-here', 'Emily Rodriguez', 4, 'Very good overall. The only suggestion would be to offer more flexible scheduling.', 'platform');

-- =============================================
-- VERIFICATION QUERIES
-- =============================================

-- Check table structure
-- SELECT column_name, data_type, is_nullable, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'reviews' 
-- ORDER BY ordinal_position;

-- Check indexes
-- SELECT indexname, indexdef 
-- FROM pg_indexes 
-- WHERE tablename = 'reviews';

-- Check RLS policies
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
-- FROM pg_policies 
-- WHERE tablename = 'reviews';

-- Test query for practitioner reviews
-- SELECT r.*, p.legal_name as practitioner_name 
-- FROM reviews r 
-- JOIN practitioners p ON r.practitioner_id = p.user_id 
-- WHERE r.practitioner_id = 'your-user-id' 
-- AND r.is_approved = true 
-- AND r.is_visible = true 
-- ORDER BY r.created_at DESC;