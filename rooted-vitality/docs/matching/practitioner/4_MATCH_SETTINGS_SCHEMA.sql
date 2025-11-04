/*
╔════════════════════════════════════════════════════════════════════╗
║  ROOTED VITALITY, INC.                                             ║
║  File: 4_MATCH_SETTINGS_SCHEMA.sql                                 ║
║  Purpose: Database schema for match settings and taxonomy          ║
║  Holistic Wellness · Modern Connection Platform                    ║
║  rootedvitality.com | 2025                                         ║
╚════════════════════════════════════════════════════════════════════╝

OVERVIEW:
=========
This SQL creates the complete taxonomy and match settings infrastructure.
It consists of 3 main components:

1. TAXONOMY TABLES (Root Data)
   - holistic_health_taxonomy: Master list of all service categories
   - taxonomy_subcategories: Subcategories for each service

2. PRACTITIONER MATCH SETTINGS (User Data)
   - practitioner_match_settings: Matching preferences (active/inactive status)
   - practitioner_selected_services: Services each practitioner offers
   - practitioner_match_pause: Pause/resume schedule for matching

3. PAYMENT METHODS (User Data - separate schema section)
   - practitioners table additions for payment methods

STRUCTURE:
=========
All user-specific data is linked to practitioners.id via foreign key.
Taxonomy data is reference data accessible to all.
*/

-- ====================================================
-- PART 1: TAXONOMY TABLES (Reference Data)
-- ====================================================

-- Master taxonomy table: All 22 holistic health service categories
CREATE TABLE IF NOT EXISTS holistic_health_taxonomy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Category Information
  category_id TEXT NOT NULL UNIQUE,  -- e.g., "acupuncture", "chiropractic"
  name TEXT NOT NULL,                -- e.g., "Acupuncture & TCM"
  icon TEXT,                         -- e.g., "🧬", "🔧"
  
  -- Credential Requirements
  credential_level TEXT DEFAULT 'none',  -- 'none', 'certification', 'license'
  credential_description TEXT,       -- e.g., "License Required"
  
  -- Metadata
  description TEXT,                  -- Longer description of the category
  display_order INTEGER DEFAULT 0,   -- Sort order in UI
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast lookups
CREATE UNIQUE INDEX idx_taxonomy_category_id ON holistic_health_taxonomy(category_id);

-- Subcategories table: Specific services under each category
CREATE TABLE IF NOT EXISTS taxonomy_subcategories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign Key
  taxonomy_id UUID NOT NULL REFERENCES holistic_health_taxonomy(id) ON DELETE CASCADE,
  
  -- Subcategory Information
  name TEXT NOT NULL,                -- e.g., "Pain Management", "Fertility Support"
  display_order INTEGER DEFAULT 0,   -- Sort order within category
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX idx_subcategories_taxonomy ON taxonomy_subcategories(taxonomy_id);

-- ====================================================
-- PART 2: PRACTITIONER MATCH SETTINGS
-- ====================================================

-- Main match settings table: Tracks if matching is active/paused for each practitioner
CREATE TABLE IF NOT EXISTS practitioner_match_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign Key to practitioners
  practitioner_id UUID NOT NULL REFERENCES practitioners(id) ON DELETE CASCADE,
  
  -- Matching Status
  is_matching_active BOOLEAN DEFAULT false,  -- Global on/off toggle
  matching_activated_at TIMESTAMP WITH TIME ZONE,
  
  -- Pause Status
  is_paused BOOLEAN DEFAULT false,
  pause_until TIMESTAMP WITH TIME ZONE,     -- When to auto-resume
  pause_reason TEXT,
  paused_at TIMESTAMP WITH TIME ZONE,
  
  -- Response Time Settings
  target_response_time_minutes INTEGER DEFAULT 10,  -- Expected response time
  
  -- Lead Quality Preferences
  min_budget_tier TEXT,  -- 'low', 'mid', 'high', 'any'
  max_distance_miles INTEGER,  -- Search radius in miles
  
  -- Metadata
  notes TEXT,  -- Internal notes from practitioner
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast lookups
CREATE UNIQUE INDEX idx_match_settings_practitioner ON practitioner_match_settings(practitioner_id);

-- Selected services table: Which specific services each practitioner offers
-- One record per selected subcategory
CREATE TABLE IF NOT EXISTS practitioner_selected_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign Keys
  practitioner_id UUID NOT NULL REFERENCES practitioners(id) ON DELETE CASCADE,
  taxonomy_id UUID NOT NULL REFERENCES holistic_health_taxonomy(id) ON DELETE CASCADE,
  subcategory_id UUID NOT NULL REFERENCES taxonomy_subcategories(id) ON DELETE CASCADE,
  
  -- Status
  is_active BOOLEAN DEFAULT true,  -- Can deactivate individual services
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for fast lookups
CREATE INDEX idx_practitioner_services_practitioner ON practitioner_selected_services(practitioner_id);
CREATE INDEX idx_practitioner_services_taxonomy ON practitioner_selected_services(taxonomy_id);
CREATE UNIQUE INDEX idx_practitioner_services_unique ON practitioner_selected_services(practitioner_id, subcategory_id);

-- Match pause history table: Track when practitioners paused/resumed matching
CREATE TABLE IF NOT EXISTS practitioner_match_pause_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign Key
  practitioner_id UUID NOT NULL REFERENCES practitioners(id) ON DELETE CASCADE,
  
  -- Pause Information
  pause_start TIMESTAMP WITH TIME ZONE NOT NULL,
  pause_end TIMESTAMP WITH TIME ZONE,  -- NULL if still paused
  pause_reason TEXT,
  pause_duration_minutes INTEGER,
  
  -- Who initiated
  initiated_by TEXT,  -- 'practitioner', 'auto-resume', 'system'
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for lookups
CREATE INDEX idx_pause_history_practitioner ON practitioner_match_pause_history(practitioner_id);

-- ====================================================
-- PART 3: PRACTITIONER TABLE ALTERATIONS
-- ====================================================
-- Add payment method columns to practitioners table
-- (If these don't already exist)

ALTER TABLE practitioners 
  ADD COLUMN IF NOT EXISTS payment_methods TEXT,
  ADD COLUMN IF NOT EXISTS accepts_insurance BOOLEAN DEFAULT FALSE;

-- ====================================================
-- PART 4: INITIAL TAXONOMY DATA LOAD
-- ====================================================
-- Insert all 22 holistic health categories

INSERT INTO holistic_health_taxonomy (
  category_id, name, icon, credential_level, credential_description, display_order
) VALUES
-- 1. Acupuncture & TCM
('acupuncture', 'Acupuncture & TCM', '🧬', 'license', '🔴 License Required', 1),

-- 2. Chiropractic Care
('chiropractic', 'Chiropractic Care', '🔧', 'license', '🔴 License Required', 2),

-- 3. Naturopathic Medicine
('naturopathic', 'Naturopathic Medicine', '🌿', 'certification', '🟡 Certification Recommended', 3),

-- 4. Nutrition & Dietetics
('nutrition', 'Nutrition & Dietetics', '🥗', 'certification', '🟡 Certification Recommended', 4),

-- 5. Wellness Coaching
('wellness_coaching', 'Wellness Coaching', '💪', 'none', '🟢 No Credential Required', 5),

-- 6. Personal Training
('personal_training', 'Personal Training', '🏋️', 'certification', '🟡 Certification Recommended', 6),

-- 7. Yoga
('yoga', 'Yoga', '🧘', 'certification', '🟡 Certification Recommended', 7),

-- 8. Meditation
('meditation', 'Meditation', '🎯', 'none', '🟢 No Credential Required', 8),

-- 9. Mental Health & Counseling
('mental_health', 'Mental Health & Counseling', '🧠', 'license', '🔴 License Required', 9),

-- 10. Energy Healing
('energy_healing', 'Energy Healing', '⚡', 'none', '🟢 No Credential Required', 10),

-- 11. Herbalism
('herbalism', 'Herbalism', '🌱', 'certification', '🟡 Certification Recommended', 11),

-- 12. Ayurveda
('ayurveda', 'Ayurveda', '🎋', 'certification', '🟡 Certification Recommended', 12),

-- 13. Homeopathy
('homeopathy', 'Homeopathy', '💊', 'certification', '🟡 Certification Recommended', 13),

-- 14. Functional Medicine
('functional_medicine', 'Functional Medicine', '🔬', 'license', '🔴 License Required', 14),

-- 15. Physical Therapy
('physical_therapy', 'Physical Therapy', '🤸', 'license', '🔴 License Required', 15),

-- 16. Aromatherapy
('aromatherapy', 'Aromatherapy', '🌸', 'certification', '🟡 Certification Recommended', 16),

-- 17. Life Coaching
('life_coaching', 'Life Coaching', '🎯', 'none', '🟢 No Credential Required', 17),

-- 18. Hypnotherapy
('hypnotherapy', 'Hypnotherapy', '🌀', 'certification', '🟡 Certification Recommended', 18),

-- 19. Midwifery & Doula Services
('midwifery', 'Midwifery & Doula Services', '👶', 'license', '🔴 License Required', 19),

-- 20. Reflexology
('reflexology', 'Reflexology', '🦶', 'certification', '🟡 Certification Recommended', 20),

-- 21. Osteopathy
('osteopathy', 'Osteopathy', '💀', 'license', '🔴 License Required', 21)

ON CONFLICT (category_id) DO NOTHING;

-- ====================================================
-- PART 5: LOAD SUBCATEGORIES
-- ====================================================

-- Helper: Get taxonomy IDs for subcategory inserts
-- For each category, insert its subcategories

-- 1. ACUPUNCTURE & TCM subcategories
INSERT INTO taxonomy_subcategories (taxonomy_id, name, display_order)
SELECT id, name, row_number() OVER (ORDER BY name) FROM (
  SELECT (SELECT id FROM holistic_health_taxonomy WHERE category_id = 'acupuncture') as id,
  unnest(ARRAY[
    'Pain Management', 'Fertility Support', 'Women''s Health', 'Stress & Anxiety Relief',
    'Digestive Issues', 'Insomnia & Sleep Disorders', 'Headaches & Migraines',
    'Allergies & Sinus Issues', 'Autoimmune Support', 'Weight Management',
    'Smoking Cessation', 'Sports Injury Recovery', 'Facial Acupuncture', 'Cupping Therapy',
    'Electroacupuncture', 'Moxibustion', 'Gua Sha', 'Chinese Herbal Medicine',
    'Auricular Acupuncture', 'Pediatric Acupuncture'
  ]) as name
) t
WHERE id IS NOT NULL
ON CONFLICT DO NOTHING;

-- 2. CHIROPRACTIC CARE subcategories
INSERT INTO taxonomy_subcategories (taxonomy_id, name, display_order)
SELECT id, name, row_number() OVER (ORDER BY name) FROM (
  SELECT (SELECT id FROM holistic_health_taxonomy WHERE category_id = 'chiropractic') as id,
  unnest(ARRAY[
    'Spinal Adjustment/Manipulation', 'Back Pain Treatment', 'Neck Pain Treatment',
    'Headache & Migraine Relief', 'Sciatica Treatment', 'Sports Injury Treatment',
    'Auto Accident Injury', 'Work Injury Treatment', 'Postural Correction',
    'Scoliosis Management', 'Pregnancy Chiropractic', 'Pediatric Chiropractic',
    'Extremity Adjustments', 'Soft Tissue Therapy', 'Ergonomic Assessment',
    'Nutritional Counseling', 'Rehabilitation Exercises', 'Disc Herniation Treatment'
  ]) as name
) t
WHERE id IS NOT NULL
ON CONFLICT DO NOTHING;

-- 3. NATUROPATHIC MEDICINE subcategories
INSERT INTO taxonomy_subcategories (taxonomy_id, name, display_order)
SELECT id, name, row_number() OVER (ORDER BY name) FROM (
  SELECT (SELECT id FROM holistic_health_taxonomy WHERE category_id = 'naturopathic') as id,
  unnest(ARRAY[
    'Botanical Medicine', 'Clinical Nutrition', 'Detoxification Programs',
    'Hydrotherapy', 'Environmental Medicine', 'Functional Lab Analysis',
    'Homeopathy', 'Physical Medicine', 'Psychological Counseling',
    'Minor Surgery', 'Disease Prevention', 'Chronic Disease Management',
    'Allergy Management', 'Autoimmune Support', 'Hormonal Balancing'
  ]) as name
) t
WHERE id IS NOT NULL
ON CONFLICT DO NOTHING;

-- 4. NUTRITION & DIETETICS subcategories
INSERT INTO taxonomy_subcategories (taxonomy_id, name, display_order)
SELECT id, name, row_number() OVER (ORDER BY name) FROM (
  SELECT (SELECT id FROM holistic_health_taxonomy WHERE category_id = 'nutrition') as id,
  unnest(ARRAY[
    'Medical Nutrition Therapy', 'Sports Nutrition', 'Pediatric Nutrition',
    'Pregnancy & Postpartum Nutrition', 'Geriatric Nutrition', 'Renal Nutrition',
    'Diabetes Management', 'Weight Management', 'Eating Disorder Recovery',
    'Food Allergy Management', 'Gut Health Optimization', 'Plant-Based Nutrition',
    'Functional Nutrition Coaching', 'Metabolic Testing', 'Supplement Recommendations'
  ]) as name
) t
WHERE id IS NOT NULL
ON CONFLICT DO NOTHING;

-- 5. WELLNESS COACHING subcategories
INSERT INTO taxonomy_subcategories (taxonomy_id, name, display_order)
SELECT id, name, row_number() OVER (ORDER BY name) FROM (
  SELECT (SELECT id FROM holistic_health_taxonomy WHERE category_id = 'wellness_coaching') as id,
  unnest(ARRAY[
    'Health Coaching', 'Lifestyle Coaching', 'Stress Management',
    'Sleep Optimization', 'Exercise Programming', 'Nutrition Guidance',
    'Habit Formation', 'Goal Setting & Accountability', 'Preventive Health',
    'Energy Management', 'Work-Life Balance', 'Chronic Disease Support',
    'Wellness Program Design', 'Corporate Wellness', 'One-on-One Coaching'
  ]) as name
) t
WHERE id IS NOT NULL
ON CONFLICT DO NOTHING;

-- 6. PERSONAL TRAINING subcategories
INSERT INTO taxonomy_subcategories (taxonomy_id, name, display_order)
SELECT id, name, row_number() OVER (ORDER BY name) FROM (
  SELECT (SELECT id FROM holistic_health_taxonomy WHERE category_id = 'personal_training') as id,
  unnest(ARRAY[
    'Strength Training', 'Cardiovascular Training', 'Flexibility & Mobility',
    'Functional Fitness', 'HIIT Training', 'Pre/Post-Natal Fitness',
    'Senior Fitness', 'Sports-Specific Training', 'Rehabilitation Exercises',
    'Posture & Alignment', 'Nutrition Coaching', 'Group Classes',
    'Online Training', 'Boot Camp Training', 'CrossFit Coaching'
  ]) as name
) t
WHERE id IS NOT NULL
ON CONFLICT DO NOTHING;

-- 7. YOGA subcategories
INSERT INTO taxonomy_subcategories (taxonomy_id, name, display_order)
SELECT id, name, row_number() OVER (ORDER BY name) FROM (
  SELECT (SELECT id FROM holistic_health_taxonomy WHERE category_id = 'yoga') as id,
  unnest(ARRAY[
    'Hatha Yoga', 'Vinyasa Yoga', 'Ashtanga Yoga', 'Restorative Yoga',
    'Yin Yoga', 'Power Yoga', 'Prenatal Yoga', 'Postnatal Yoga',
    'Yoga for Seniors', 'Yoga Therapy', 'Kundalini Yoga', 'Hot Yoga',
    'Aerial Yoga', 'Yoga for Athletes', 'Corporate Yoga Classes'
  ]) as name
) t
WHERE id IS NOT NULL
ON CONFLICT DO NOTHING;

-- 8. MEDITATION subcategories
INSERT INTO taxonomy_subcategories (taxonomy_id, name, display_order)
SELECT id, name, row_number() OVER (ORDER BY name) FROM (
  SELECT (SELECT id FROM holistic_health_taxonomy WHERE category_id = 'meditation') as id,
  unnest(ARRAY[
    'Mindfulness Meditation', 'Guided Meditation', 'Vipassana Meditation',
    'Loving-Kindness Meditation', 'Body Scan Meditation', 'Breath Awareness',
    'Transcendental Meditation', 'Sound Bath Meditation', 'Walking Meditation',
    'Chakra Meditation', 'Visualization Techniques', 'Stress Reduction (MBSR)',
    'Anxiety Relief', 'Sleep Meditation', 'Group Meditation Classes'
  ]) as name
) t
WHERE id IS NOT NULL
ON CONFLICT DO NOTHING;

-- 9. MENTAL HEALTH & COUNSELING subcategories
INSERT INTO taxonomy_subcategories (taxonomy_id, name, display_order)
SELECT id, name, row_number() OVER (ORDER BY name) FROM (
  SELECT (SELECT id FROM holistic_health_taxonomy WHERE category_id = 'mental_health') as id,
  unnest(ARRAY[
    'Psychotherapy', 'Cognitive Behavioral Therapy (CBT)', 'Dialectical Behavior Therapy (DBT)',
    'Acceptance & Commitment Therapy (ACT)', 'Couples Counseling', 'Family Therapy',
    'Individual Counseling', 'Group Therapy', 'Trauma-Informed Therapy',
    'Depression Treatment', 'Anxiety Disorders', 'Addiction Counseling',
    'ADHD Support', 'Grief Counseling', 'Life Coaching'
  ]) as name
) t
WHERE id IS NOT NULL
ON CONFLICT DO NOTHING;

-- 10. ENERGY HEALING subcategories
INSERT INTO taxonomy_subcategories (taxonomy_id, name, display_order)
SELECT id, name, row_number() OVER (ORDER BY name) FROM (
  SELECT (SELECT id FROM holistic_health_taxonomy WHERE category_id = 'energy_healing') as id,
  unnest(ARRAY[
    'Reiki', 'Chakra Balancing', 'Aura Reading & Cleansing', 'Crystal Healing',
    'Pranic Healing', 'Quantum Healing', 'Sound Healing', 'Light Therapy',
    'Biofield Therapy', 'Energy Medicine', 'Shamanic Healing', 'Intuitive Counseling',
    'Spiritual Guidance', 'Past Life Regression', 'Energy Cord Cutting'
  ]) as name
) t
WHERE id IS NOT NULL
ON CONFLICT DO NOTHING;

-- 11. HERBALISM subcategories
INSERT INTO taxonomy_subcategories (taxonomy_id, name, display_order)
SELECT id, name, row_number() OVER (ORDER BY name) FROM (
  SELECT (SELECT id FROM holistic_health_taxonomy WHERE category_id = 'herbalism') as id,
  unnest(ARRAY[
    'Western Herbalism', 'Traditional Chinese Herbalism', 'Ayurvedic Herbalism',
    'Medicinal Herb Identification', 'Herbal Preparation Techniques', 'Tinctures & Extracts',
    'Tea & Infusions', 'Salves & Oils', 'Culinary Herbs', 'Wildcrafting',
    'Herb Growing & Cultivation', 'Herbal Consultation', 'Woman''s Herbs',
    'Men''s Health Herbs', 'Seasonal Herbalism'
  ]) as name
) t
WHERE id IS NOT NULL
ON CONFLICT DO NOTHING;

-- 12. AYURVEDA subcategories
INSERT INTO taxonomy_subcategories (taxonomy_id, name, display_order)
SELECT id, name, row_number() OVER (ORDER BY name) FROM (
  SELECT (SELECT id FROM holistic_health_taxonomy WHERE category_id = 'ayurveda') as id,
  unnest(ARRAY[
    'Dosha Assessment', 'Ayurvedic Massage (Abhyanga)', 'Panchakarma Therapy',
    'Oil Therapy (Sneha)', 'Steam Therapy (Swedana)', 'Herbal Remedies',
    'Dietary Guidance', 'Lifestyle Recommendations', 'Yoga for Ayurveda',
    'Meditation Practices', 'Pulse Diagnosis', 'Ayurvedic Cooking Classes',
    'Seasonal Detoxification', 'Energy Balancing', 'Women''s Health (Stri Roga)'
  ]) as name
) t
WHERE id IS NOT NULL
ON CONFLICT DO NOTHING;

-- 13. HOMEOPATHY subcategories
INSERT INTO taxonomy_subcategories (taxonomy_id, name, display_order)
SELECT id, name, row_number() OVER (ORDER BY name) FROM (
  SELECT (SELECT id FROM holistic_health_taxonomy WHERE category_id = 'homeopathy') as id,
  unnest(ARRAY[
    'Constitutional Homeopathy', 'Acute Care Treatment', 'Chronic Disease Management',
    'Pediatric Homeopathy', 'Pregnancy & Labor Support', 'Grief & Emotional Trauma',
    'Allergies & Sensitivities', 'Auto-Immune Disorders', 'Skin Conditions',
    'First Aid Homeopathy', 'Remedy Selection', 'Case Taking Expertise',
    'Homeopathic Consultation', 'Combination Remedies', 'Constitutional Analysis'
  ]) as name
) t
WHERE id IS NOT NULL
ON CONFLICT DO NOTHING;

-- 14. FUNCTIONAL MEDICINE subcategories
INSERT INTO taxonomy_subcategories (taxonomy_id, name, display_order)
SELECT id, name, row_number() OVER (ORDER BY name) FROM (
  SELECT (SELECT id FROM holistic_health_taxonomy WHERE category_id = 'functional_medicine') as id,
  unnest(ARRAY[
    'Systems-Based Diagnosis', 'Preventive Medicine', 'Chronic Disease Management',
    'Nutritional Assessment', 'Micronutrient Testing', 'Food Sensitivity Testing',
    'Digestive Health Optimization', 'Hormonal Balancing', 'Metabolic Syndrome Treatment',
    'Inflammation Management', 'Immune System Optimization', 'Detoxification Support',
    'Personalized Nutrition Plans', 'Supplement Protocols', 'Lifestyle Medicine'
  ]) as name
) t
WHERE id IS NOT NULL
ON CONFLICT DO NOTHING;

-- 15. PHYSICAL THERAPY subcategories
INSERT INTO taxonomy_subcategories (taxonomy_id, name, display_order)
SELECT id, name, row_number() OVER (ORDER BY name) FROM (
  SELECT (SELECT id FROM holistic_health_taxonomy WHERE category_id = 'physical_therapy') as id,
  unnest(ARRAY[
    'Orthopedic Rehabilitation', 'Neurological Rehabilitation', 'Cardiovascular Rehabilitation',
    'Post-Surgical Recovery', 'Sports Physical Therapy', 'Work-Injury Recovery',
    'Fall Prevention Programs', 'Gait Training', 'Balance & Proprioception',
    'Manual Therapy Techniques', 'Therapeutic Exercise', 'Pain Management',
    'Functional Movement Training', 'Geriatric Physical Therapy', 'Pediatric Rehabilitation'
  ]) as name
) t
WHERE id IS NOT NULL
ON CONFLICT DO NOTHING;

-- 16. AROMATHERAPY subcategories
INSERT INTO taxonomy_subcategories (taxonomy_id, name, display_order)
SELECT id, name, row_number() OVER (ORDER BY name) FROM (
  SELECT (SELECT id FROM holistic_health_taxonomy WHERE category_id = 'aromatherapy') as id,
  unnest(ARRAY[
    'Essential Oil Consultation', 'Diffusion Techniques', 'Topical Application Methods',
    'Inhalation Therapy', 'Hydrosol Therapy', 'Blending & Formulation',
    'Stress & Anxiety Relief', 'Sleep Support', 'Immune Boosting',
    'Skincare & Beauty', 'Respiratory Support', 'Pain Relief',
    'Emotional Balancing', 'Chakra Aromatherapy', 'Seasonal Blending'
  ]) as name
) t
WHERE id IS NOT NULL
ON CONFLICT DO NOTHING;

-- 17. LIFE COACHING subcategories
INSERT INTO taxonomy_subcategories (taxonomy_id, name, display_order)
SELECT id, name, row_number() OVER (ORDER BY name) FROM (
  SELECT (SELECT id FROM holistic_health_taxonomy WHERE category_id = 'life_coaching') as id,
  unnest(ARRAY[
    'Career Coaching', 'Business Coaching', 'Executive Coaching',
    'Relationship Coaching', 'Personal Development', 'Confidence Building',
    'Goal Achievement', 'Life Transitions', 'Purpose Discovery',
    'Financial Wellness Coaching', 'Leadership Development', 'Work-Life Balance',
    'Empowerment Coaching', 'Vision & Values Alignment', 'Accountability Partnership'
  ]) as name
) t
WHERE id IS NOT NULL
ON CONFLICT DO NOTHING;

-- 18. HYPNOTHERAPY subcategories
INSERT INTO taxonomy_subcategories (taxonomy_id, name, display_order)
SELECT id, name, row_number() OVER (ORDER BY name) FROM (
  SELECT (SELECT id FROM holistic_health_taxonomy WHERE category_id = 'hypnotherapy') as id,
  unnest(ARRAY[
    'Smoking Cessation', 'Weight Management Hypnosis', 'Anxiety & Stress Relief',
    'Insomnia Treatment', 'Phobia Release', 'Trauma Healing',
    'Confidence Building', 'Performance Enhancement', 'Public Speaking Anxiety',
    'Pain Management', 'Habit Breaking', 'Sports Hypnosis',
    'Regression Therapy', 'Age Progression', 'Wellness Hypnosis'
  ]) as name
) t
WHERE id IS NOT NULL
ON CONFLICT DO NOTHING;

-- 19. MIDWIFERY & DOULA subcategories
INSERT INTO taxonomy_subcategories (taxonomy_id, name, display_order)
SELECT id, name, row_number() OVER (ORDER BY name) FROM (
  SELECT (SELECT id FROM holistic_health_taxonomy WHERE category_id = 'midwifery') as id,
  unnest(ARRAY[
    'Birth Doula Services', 'Postpartum Doula Services', 'Lactation Support',
    'Prenatal Care', 'Labor & Delivery Support', 'Postpartum Recovery',
    'Emotional Support', 'Advocacy Services', 'Childbirth Education',
    'Partner Support Training', 'Home Birth Assistance', 'Hospital Birth Support',
    'Placenta Care', 'Newborn Care Education', 'Grief Support (Miscarriage/Loss)'
  ]) as name
) t
WHERE id IS NOT NULL
ON CONFLICT DO NOTHING;

-- 20. REFLEXOLOGY subcategories
INSERT INTO taxonomy_subcategories (taxonomy_id, name, display_order)
SELECT id, name, row_number() OVER (ORDER BY name) FROM (
  SELECT (SELECT id FROM holistic_health_taxonomy WHERE category_id = 'reflexology') as id,
  unnest(ARRAY[
    'Foot Reflexology', 'Hand Reflexology', 'Ear Reflexology',
    'Zone Therapy', 'Pressure Point Therapy', 'Stress Relief',
    'Pain Management', 'Digestive Support', 'Immune System Stimulation',
    'Emotional Release', 'Lymphatic Drainage', 'Circulation Improvement',
    'Hormone Balancing', 'Prenatal Reflexology', 'Sports Reflexology'
  ]) as name
) t
WHERE id IS NOT NULL
ON CONFLICT DO NOTHING;

-- 21. OSTEOPATHY subcategories
INSERT INTO taxonomy_subcategories (taxonomy_id, name, display_order)
SELECT id, name, row_number() OVER (ORDER BY name) FROM (
  SELECT (SELECT id FROM holistic_health_taxonomy WHERE category_id = 'osteopathy') as id,
  unnest(ARRAY[
    'Cranial Osteopathy', 'Musculoskeletal Treatment', 'Visceral Osteopathy',
    'Structural Alignment', 'Fascial Release', 'Joint Mobilization',
    'Spinal Care', 'Posture Correction', 'Movement Optimization',
    'Injury Recovery', 'Pregnancy Support', 'Pediatric Osteopathy',
    'Sports Osteopathy', 'Pain Management', 'Wellness Maintenance'
  ]) as name
) t
WHERE id IS NOT NULL
ON CONFLICT DO NOTHING;

-- ====================================================
-- PART 6: GRANT PERMISSIONS
-- ====================================================
-- Ensure practitioners can access their own data

GRANT SELECT, INSERT, UPDATE ON holistic_health_taxonomy TO authenticated;
GRANT SELECT ON taxonomy_subcategories TO authenticated;
GRANT SELECT, INSERT, UPDATE ON practitioner_match_settings TO authenticated;
GRANT SELECT, INSERT, UPDATE ON practitioner_selected_services TO authenticated;
GRANT SELECT, INSERT ON practitioner_match_pause_history TO authenticated;

-- ====================================================
-- PART 7: ENABLE ROW LEVEL SECURITY (RLS)
-- ====================================================

-- Match Settings: Practitioners can only see/edit their own
ALTER TABLE practitioner_match_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Practitioners can manage their own match settings" 
  ON practitioner_match_settings
  FOR ALL
  USING (
    practitioner_id IN (
      SELECT id FROM practitioners WHERE user_id = auth.uid()
    )
  );

-- Selected Services: Practitioners can only see/edit their own
ALTER TABLE practitioner_selected_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Practitioners can manage their own selected services"
  ON practitioner_selected_services
  FOR ALL
  USING (
    practitioner_id IN (
      SELECT id FROM practitioners WHERE user_id = auth.uid()
    )
  );

-- Pause History: Practitioners can only see their own history
ALTER TABLE practitioner_match_pause_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Practitioners can view their own pause history"
  ON practitioner_match_pause_history
  FOR SELECT
  USING (
    practitioner_id IN (
      SELECT id FROM practitioners WHERE user_id = auth.uid()
    )
  );

-- Taxonomy: Everyone can read, no one can modify
ALTER TABLE holistic_health_taxonomy ENABLE ROW LEVEL SECURITY;
ALTER TABLE taxonomy_subcategories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Taxonomy is public read-only"
  ON holistic_health_taxonomy
  FOR SELECT
  USING (true);

CREATE POLICY "Subcategories are public read-only"
  ON taxonomy_subcategories
  FOR SELECT
  USING (true);

-- ====================================================
-- PART 8: VERIFICATION QUERIES
-- ====================================================

-- Verify all categories loaded
SELECT COUNT(*) as total_categories, 
       COUNT(CASE WHEN credential_level = 'license' THEN 1 END) as license_required,
       COUNT(CASE WHEN credential_level = 'certification' THEN 1 END) as certification_recommended,
       COUNT(CASE WHEN credential_level = 'none' THEN 1 END) as no_credential
FROM holistic_health_taxonomy;

-- Verify subcategories loaded
SELECT 
  (SELECT name FROM holistic_health_taxonomy WHERE category_id = 'acupuncture') as category,
  COUNT(*) as subcategory_count
FROM taxonomy_subcategories
WHERE taxonomy_id = (SELECT id FROM holistic_health_taxonomy WHERE category_id = 'acupuncture');

-- Example: Get all services under a category
-- SELECT ts.name FROM taxonomy_subcategories ts
-- JOIN holistic_health_taxonomy t ON ts.taxonomy_id = t.id
-- WHERE t.category_id = 'acupuncture'
-- ORDER BY ts.display_order;

-- Example: Get practitioner's active services
-- SELECT 
--   t.name as category,
--   ts.name as service,
--   pss.created_at
-- FROM practitioner_selected_services pss
-- JOIN holistic_health_taxonomy t ON pss.taxonomy_id = t.id
-- JOIN taxonomy_subcategories ts ON pss.subcategory_id = ts.id
-- WHERE pss.practitioner_id = 'practitioner-uuid'
-- AND pss.is_active = true
-- ORDER BY t.display_order, ts.display_order;

-- Example: Check matching status
-- SELECT 
--   is_matching_active,
--   is_paused,
--   pause_until,
--   target_response_time_minutes,
--   updated_at
-- FROM practitioner_match_settings
-- WHERE practitioner_id = 'practitioner-uuid';
