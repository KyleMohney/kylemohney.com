# Database Schema Reference

**IMPORTANT NOTES:**
- All tables have an `id` column for UUID (primary key)
- All tables have a `serial_number` or equivalent column for human-readable tracking
- When you add/remove columns, update this file
- **DO NOT PUSH TO GIT UNLESS ASKED**
- **ALL SQL PROVIDED IN CHAT**

---

## Design Patterns

### Serial Numbers (Auto-Generated)
- **Clients**: `C1`, `C2`, `C3`... (stored in `clients.serial_number`)
- **Practitioners**: `P1`, `P2`, `P3`... (stored in `practitioners.serial_number`)
- **Projects**: `1`, `2`, `3`... (stored in `projects.project_serial` as INTEGER)

### ID Types
- `id` = UUID (system primary key for all table relationships)
- `serial_number`/`project_serial` = Human-readable for UI display
- Foreign keys use `id` (UUID)
- Serial lookups use text/int serials

### Key Relationships
- **Practitioners** → **Projects** via `project_serial` lookup
- **Clients** → **Projects** via `client_serial` lookup
- **Matches** → **Practitioners** & **Projects** via serials
- **Reviews** → **Practitioners** & **Projects** via serials
- **Messages** → **Projects** via `project_id` and `project_serial`

---

## Complete Table Documentation

===================
1: PRACTITIONER TABLES
===================

====================================
practitioners
====================================

| column_name                | data_type                   |
| -------------------------- | --------------------------- |
| id                         | uuid                        |
| email                      | text                        |
| legal_name                 | text                        |
| created_at                 | timestamp without time zone |
| updated_at                 | timestamp without time zone |
| status                     | text                        |
| submitted_at               | timestamp with time zone    |
| business_size              | text                        |
| legal_business_name        | text                        |
| phone                      | text                        |
| serial_number              | text                        |
| payment_methods            | text                        |
| accepts_insurance          | boolean                     |
| insurance_accepted         | ARRAY                       |
| availability_schedule      | jsonb                       |
| insurance_providers        | ARRAY                       |
| custom_insurance_providers | text                        |
| custom_payment_methods     | text                        |
| notification_preferences   | jsonb                       |
| physical_address           | text                        |
| zipcode                    | text                        |
| in_person_enabled          | boolean                     |
| in_person_option           | text                        |
| in_person_base_zipcode     | text                        |
| in_person_radius_miles     | integer                     |
| in_person_zipcodes         | ARRAY                       |
| virtual_enabled            | boolean                     |
| virtual_option             | text                        |
| virtual_states             | ARRAY                       |
| housecalls_enabled         | boolean                     |
| housecalls_option          | text                        |
| housecalls_base_zipcode    | text                        |
| housecalls_radius_miles    | integer                     |
| housecalls_zipcodes        | ARRAY                       |
| timezone                   | text                        |
| availability_last_updated  | timestamp with time zone    |
| matching_enabled           | boolean                     |
| matching_paused            | boolean                     |
| deleted_at                 | timestamp without time zone |
| practice_city              | text                        |
| practice_state             | text                        |
| service_category_ids       | ARRAY                       |
| service_category_names     | ARRAY                       |
| service_subcategory_ids    | ARRAY                       |
| service_subcategory_names  | ARRAY                       |
| last_login                 | timestamp with time zone    |
| pricing                    | jsonb                       |
| dba_name                   | text                        |


====================================
memberships
====================================

| column_name         | data_type                   |
| ------------------- | --------------------------- |
| id                  | uuid                        |
| status              | text                        |
| started_at          | timestamp without time zone |
| created_at          | timestamp without time zone |
| updated_at          | timestamp without time zone |
| practitioner_serial | text                        |
| canceled_at         | timestamp with time zone    |
| re-enrolled_on      | timestamp with time zone    |
| practitioner_id     | uuid                        |


====================================
practitioner_profiles
====================================

| column_name                  | data_type                   |
| ---------------------------- | --------------------------- |
| id                           | uuid                        |
| practitioner_serial          | text                        |
| bio                          | text                        |
| ethos_statement              | text                        |
| gallery_photos               | jsonb                       |
| social_media                 | jsonb                       |
| intro_video_url              | text                        |
| languages                    | ARRAY                       |
| modalities                   | ARRAY                       |
| conditions_treated           | ARRAY                       |
| faq                          | jsonb                       |
| profile_completeness_percent | integer                     |
| created_at                   | timestamp without time zone |
| updated_at                   | timestamp without time zone |
| practice_logo_url            | text                        |
| practice_type                | text                        |
| year_established             | integer                     |


====================================
practitioner_blocks
====================================

| column_name         | data_type                |
| ------------------- | ------------------------ |
| id                  | uuid                     |
| practitioner_id     | uuid                     |
| client_serial       | text                     |
| created_at          | timestamp with time zone |
| is_blocked          | boolean                  |
| practitioner_serial | text                     |
| from_opportunity    | boolean                  |


====================================
practitioner_selected_services
====================================

| column_name         | data_type                |
| ------------------- | ------------------------ |
| id                  | uuid                     |
| taxonomy_id         | uuid                     |
| subcategory_id      | uuid                     |
| is_active           | boolean                  |
| created_at          | timestamp with time zone |
| updated_at          | timestamp with time zone |
| price_per_service   | numeric                  |
| practitioner_serial | text                     |


====================================
practitioner_credentials
====================================

| column_name                     | data_type                   |
| ------------------------------- | --------------------------- |
| id                              | uuid                        |
| practitioner_serial             | text                        |
| credentials                     | jsonb                       |
| badge_certified                 | boolean                     |
| badge_licensed                  | boolean                     |
| badge_background_check_verified | boolean                     |
| background_check_status         | text                        |
| background_check_date           | timestamp without time zone |
| background_check_provider       | text                        |
| background_check_notes          | text                        |
| verification_updated_at         | timestamp without time zone |
| verification_updated_by         | uuid                        |
| verification_audit_trail        | jsonb                       |
| created_at                      | timestamp without time zone |
| updated_at                      | timestamp without time zone |
| approved_by                     | text                        |
| badge_verified                  | boolean                     |
| credentials_verified            | boolean                     |


====================================
practitioner_notifications
====================================

| column_name         | data_type                |
| ------------------- | ------------------------ |
| id                  | uuid                     |
| practitioner_serial | text                     |
| type                | text                     |
| action              | text                     |
| title               | text                     |
| message             | text                     |
| is_read             | boolean                  |
| created_at          | timestamp with time zone |
| updated_at          | timestamp with time zone |
| client_serial       | text                     |


====================================
practitioner_notification_settings
====================================

| column_name         | data_type                |
| ------------------- | ------------------------ |
| id                  | uuid                     |
| messages_in_app     | boolean                  |
| messages_sms        | boolean                  |
| messages_email      | boolean                  |
| matches_in_app      | boolean                  |
| matches_sms         | boolean                  |
| matches_email       | boolean                  |
| reviews_in_app      | boolean                  |
| reviews_sms         | boolean                  |
| reviews_email       | boolean                  |
| promotions_in_app   | boolean                  |
| promotions_sms      | boolean                  |
| promotions_email    | boolean                  |
| system_in_app       | boolean                  |
| system_sms          | boolean                  |
| system_email        | boolean                  |
| account_in_app      | boolean                  |
| created_at          | timestamp with time zone |
| updated_at          | timestamp with time zone |
| practitioner_serial | text                     |


===================
2: PROJECT TABLES
===================


====================================
projects
====================================

| column_name               | data_type                |
| ------------------------- | ------------------------ |
| id                        | uuid                     |
| client_serial             | text                     |
| category_id               | text                     |
| description               | text                     |
| street                    | text                     |
| zipcode                   | text                     |
| state                     | text                     |
| start_date                | date                     |
| urgency                   | text                     |
| project_status            | text                     |
| client_open_to_contact    | boolean                  |
| created_at                | timestamp with time zone |
| updated_at                | timestamp with time zone |
| review_left               | boolean                  |
| travel_preference         | text                     |
| subcategory_name          | text                     |
| category_name             | text                     |
| custom_name               | text                     |
| city                      | text                     |
| closed_date               | date                     |
| reopened_date             | date                     |
| matched_practitioners     | text                     |
| client_first_name         | text                     |
| client_last_name          | text                     |
| client_id                 | uuid                     |
| closure_reason            | text                     |
| closure_notes             | text                     |
| project_serial            | integer                  |
| hired_practitioner_serial | text                     |


====================================
project_practitioner_matches
====================================

| column_name                  | data_type                |
| ---------------------------- | ------------------------ |
| id                           | uuid                     |
| status                       | text                     |
| match_score                  | integer                  |
| matched_concerns             | ARRAY                    |
| client_initiated             | boolean                  |
| contacted_at                 | timestamp with time zone |
| created_at                   | timestamp with time zone |
| updated_at                   | timestamp with time zone |
| practitioner_serial          | text                     |
| client_serial                | text                     |
| matched_at                   | timestamp with time zone |
| is_read                      | boolean                  |
| match_status                 | text                     |
| practitioner_response        | text                     |
| practitioner_response_reason | text                     |
| practitioner_responded_at    | timestamp with time zone |
| project_serial               | integer        


============================
project_messages
============================

| column_name            | data_type                |
| ---------------------- | ------------------------ |
| id                     | uuid                     |
| project_id             | uuid                     |
| practitioner_id        | uuid                     |
| client_id              | uuid                     |
| sender_id              | uuid                     |
| sender_type            | text                     |
| message                | text                     |
| is_read                | boolean                  |
| created_at             | timestamp with time zone |
| updated_at             | timestamp with time zone |
| project_serial         | integer                  |
| practitioner_serial    | text                     |
| client_serial          | text                     |
| is_automated           | boolean                  |
| match_id               | uuid                     |
| message_type           | text                     |
| automated_trigger      | text                     |
| is_opportunity_message | boolean                  |
| opportunity_id         | uuid                     |


============================
opportunities
============================

| column_name              | data_type                | is_nullable | column_default     |
| ------------------------ | ------------------------ | ----------- | ------------------ |
| id                       | uuid                     | NO          | uuid_generate_v4() |
| serial_number            | text                     | NO          | null               |
| client_id                | uuid                     | YES         | null               |
| practitioner_id          | uuid                     | YES         | null               |
| service_type             | text                     | YES         | null               |
| description              | text                     | YES         | null               |
| status                   | text                     | YES         | 'new'::text        |
| created_at               | timestamp with time zone | YES         | now()              |
| updated_at               | timestamp with time zone | YES         | now()              |
| project_id               | uuid                     | YES         | null               |
| open_to_match            | boolean                  | YES         | false              |
| is_active                | boolean                  | YES         | true               |
| message_sent             | boolean                  | YES         | false              |
| message_count            | integer                  | YES         | 0                  |
| declined_by_practitioner | boolean                  | YES         | false              |
| declined_by_client       | boolean                  | YES         | false              |
| is_archived              | boolean                  | YES         | false              |
| practitioner_blocked     | boolean                  | YES         | false              |
| converted_to_match       | boolean                  | YES         | false              |
| match_id                 | uuid                     | YES         | null               |
| client_serial            | text                     | YES         | null               |
| practitioner_serial      | text                     | YES         | null               |
| project_serial           | integer                  | YES         | null               |
| opportunity_serial       | text                     | YES         | null               |


====================================
reviews
====================================

| column_name         | data_type                   |
| ------------------- | --------------------------- |
| id                  | uuid                        |
| practitioner_id     | uuid                        |
| client_id           | uuid                        |
| client_name         | text                        |
| rating              | integer                     |
| review_text         | text                        |
| source              | text                        |
| is_verified         | boolean                     |
| is_featured         | boolean                     |
| is_visible          | boolean                     |
| external_platform   | text                        |
| external_url        | text                        |
| external_review_id  | text                        |
| is_approved         | boolean                     |
| moderation_notes    | text                        |
| review_date         | timestamp without time zone |
| created_at          | timestamp without time zone |
| updated_at          | timestamp without time zone |
| photos              | ARRAY                       |
| project_serial      | integer                     |
| practitioner_name   | text                        |
| client_first_name   | text                        |
| client_last_name    | text                        |
| practitioner_serial | text                        |
| client_serial       | text                        |


===================
3: CLIENT TABLES
===================


====================================
clients
====================================

| column_name              | data_type                   |
| ------------------------ | --------------------------- |
| id                       | uuid                        |
| first_name               | character varying           |
| last_name                | character varying           |
| email                    | character varying           |
| phone                    | character varying           |
| address                  | text                        |
| city                     | text                        |
| state                    | text                        |
| zipcode                  | character varying           |
| account_status           | character varying           |
| account_standing         | character varying           |
| two_factor_enabled       | boolean                     |
| two_factor_method        | character varying           |
| created_at               | timestamp with time zone    |
| updated_at               | timestamp with time zone    |
| last_login               | timestamp with time zone    |
| settings_updated_at      | timestamp with time zone    |
| profile_picture_url      | character varying           |
| age                      | integer                     |
| sex                      | text                        |
| notification_settings    | jsonb                       |
| membership_level         | text                        |
| membership_started_at    | timestamp without time zone |
| membership_expires_at    | timestamp without time zone |
| serial_number            | text                        |
| open_to_contact          | boolean                     |
| open_to_match            | boolean                     |
| open_to_match_updated_at | timestamp with time zone    |
| date_of_birth            | date                        |
| address                  | text                        |
| city                     | text                        |
| state                    | text                        |


====================================
client_profiles
====================================

| column_name                     | data_type                |
| ------------------------------- | ------------------------ |
| id                              | uuid                     |
| user_id                         | uuid                     |
| serial_number                   | text                     |
| main_wellness_goal              | text                     |
| duration_of_issue               | text                     |
| what_tried_before               | text                     |
| allergies_sensitivities         | text                     |
| current_medications_supplements | text                     |
| typical_day_description         | text                     |
| communication_preference        | text                     |
| biggest_barrier_to_healing      | text                     |
| prior_practitioner_experience   | text                     |
| desired_success_outcome         | text                     |
| created_at                      | timestamp with time zone |
| updated_at                      | timestamp with time zone |


====================================
client_notifications
====================================

| column_name   | data_type                |
| ------------- | ------------------------ |
| id            | uuid                     |
| client_serial | text                     |
| type          | text                     |
| action        | text                     |
| title         | text                     |
| message       | text                     |
| is_read       | boolean                  |
| created_at    | timestamp with time zone |
| updated_at    | timestamp with time zone |


====================================
client_notification_settings
====================================

| column_name       | data_type                |
| ----------------- | ------------------------ |
| id                | uuid                     |
| messages_in_app   | boolean                  |
| messages_email    | boolean                  |
| messages_sms      | boolean                  |
| matches_in_app    | boolean                  |
| matches_email     | boolean                  |
| matches_sms       | boolean                  |
| reviews_in_app    | boolean                  |
| reviews_email     | boolean                  |
| reviews_sms       | boolean                  |
| promotions_in_app | boolean                  |
| promotions_email  | boolean                  |
| promotions_sms    | boolean                  |
| system_in_app     | boolean                  |
| system_email      | boolean                  |
| system_sms        | boolean                  |
| account_in_app    | boolean                  |
| created_at        | timestamp with time zone |
| updated_at        | timestamp with time zone |
| client_serial     | text                     |

====================================
holistic_health_taxonomy
====================================
| id                                   | category_id         | name                       | credential_level | credential_description       | description | display_order | is_active | created_at                    | updated_at                    |
| ------------------------------------ | ------------------- | -------------------------- | ---------------- | ---------------------------- | ----------- | ------------- | --------- | ----------------------------- | ----------------------------- |
| 17d4d957-905e-411a-9b4d-1165a9940b4f | acupuncture         | Acupuncture & TCM          | license          | 🔴 License Required          | null        | 1             | true      | 2025-11-02 16:40:48.932142+00 | 2025-11-02 16:40:48.932142+00 |
| 88e8ef68-ea5c-4ef5-af89-53f08502845a | chiropractic        | Chiropractic Care          | license          | 🔴 License Required          | null        | 2             | true      | 2025-11-02 16:40:48.932142+00 | 2025-11-02 16:40:48.932142+00 |
| bc57b6e3-a056-458a-a0a7-04c2f7330f25 | naturopathic        | Naturopathic Medicine      | certification    | 🟡 Certification Recommended | null        | 3             | true      | 2025-11-02 16:40:48.932142+00 | 2025-11-02 16:40:48.932142+00 |
| aec0df0d-876a-400e-bab7-0ea2feee08f3 | nutrition           | Nutrition & Dietetics      | certification    | 🟡 Certification Recommended | null        | 4             | true      | 2025-11-02 16:40:48.932142+00 | 2025-11-02 16:40:48.932142+00 |
| 096d3b79-b86e-458f-8484-d6447fe46dcb | wellness_coaching   | Wellness Coaching          | none             | 🟢 No Credential Required    | null        | 5             | true      | 2025-11-02 16:40:48.932142+00 | 2025-11-02 16:40:48.932142+00 |
| aabcf233-1849-48d8-ae03-5fe7fdd5b4ef | personal_training   | Personal Training          | certification    | 🟡 Certification Recommended | null        | 6             | true      | 2025-11-02 16:40:48.932142+00 | 2025-11-02 16:40:48.932142+00 |
| 59dcda00-c57c-4086-9b01-c83bef2b03cb | yoga                | Yoga                       | certification    | 🟡 Certification Recommended | null        | 7             | true      | 2025-11-02 16:40:48.932142+00 | 2025-11-02 16:40:48.932142+00 |
| 887859c1-28a3-42df-a992-e57a6828d499 | meditation          | Meditation                 | none             | 🟢 No Credential Required    | null        | 8             | true      | 2025-11-02 16:40:48.932142+00 | 2025-11-02 16:40:48.932142+00 |
| 2d87b499-a96b-4fbd-a11f-e075272cd737 | mental_health       | Mental Health & Counseling | license          | 🔴 License Required          | null        | 9             | true      | 2025-11-02 16:40:48.932142+00 | 2025-11-02 16:40:48.932142+00 |
| b0febf76-c8de-4daa-b02d-85dfd59c9989 | energy_healing      | Energy Healing             | none             | 🟢 No Credential Required    | null        | 10            | true      | 2025-11-02 16:40:48.932142+00 | 2025-11-02 16:40:48.932142+00 |
| 72a2ddd6-3994-4649-b889-c0540fd9644c | herbalism           | Herbalism                  | certification    | 🟡 Certification Recommended | null        | 11            | true      | 2025-11-02 16:40:48.932142+00 | 2025-11-02 16:40:48.932142+00 |
| 0f0c52f9-1971-4ace-b888-b7580f1e3210 | ayurveda            | Ayurveda                   | certification    | 🟡 Certification Recommended | null        | 12            | true      | 2025-11-02 16:40:48.932142+00 | 2025-11-02 16:40:48.932142+00 |
| e33028dd-de68-4599-a533-2646fd327977 | homeopathy          | Homeopathy                 | certification    | 🟡 Certification Recommended | null        | 13            | true      | 2025-11-02 16:40:48.932142+00 | 2025-11-02 16:40:48.932142+00 |
| c4364d00-cd21-4353-9548-48132dfd693b | functional_medicine | Functional Medicine        | license          | 🔴 License Required          | null        | 14            | true      | 2025-11-02 16:40:48.932142+00 | 2025-11-02 16:40:48.932142+00 |
| 97094fb7-0572-45cd-873f-5d3972ac066e | physical_therapy    | Physical Therapy           | license          | 🔴 License Required          | null        | 15            | true      | 2025-11-02 16:40:48.932142+00 | 2025-11-02 16:40:48.932142+00 |
| 2b45af41-32f4-4365-a8f0-b0852b641e6a | aromatherapy        | Aromatherapy               | certification    | 🟡 Certification Recommended | null        | 16            | true      | 2025-11-02 16:40:48.932142+00 | 2025-11-02 16:40:48.932142+00 |
| 0465b149-55a0-4dc8-af3e-c1b50de89a76 | life_coaching       | Life Coaching              | none             | 🟢 No Credential Required    | null        | 17            | true      | 2025-11-02 16:40:48.932142+00 | 2025-11-02 16:40:48.932142+00 |
| 053a1520-74e3-4bd9-b125-df6b014a467b | hypnotherapy        | Hypnotherapy               | certification    | 🟡 Certification Recommended | null        | 18            | true      | 2025-11-02 16:40:48.932142+00 | 2025-11-02 16:40:48.932142+00 |
| 900f680e-15e1-4ce1-95df-6c5e2cd10d6a | midwifery           | Midwifery & Doula Services | license          | 🔴 License Required          | null        | 19            | true      | 2025-11-02 16:40:48.932142+00 | 2025-11-02 16:40:48.932142+00 |
| 9a940329-e847-42a7-ad5e-ce84f680ae67 | reflexology         | Reflexology                | certification    | 🟡 Certification Recommended | null        | 20            | true      | 2025-11-02 16:40:48.932142+00 | 2025-11-02 16:40:48.932142+00 |
| fabdc312-1892-4819-8ee7-3873fcfbe0e7 | osteopathy          | Osteopathy                 | license          | 🔴 License Required          | null        | 21            | true      | 2025-11-02 16:40:48.932142+00 | 2025-11-02 16:40:48.932142+00 |

| column_name            | data_type                | is_nullable | column_default    |
| ---------------------- | ------------------------ | ----------- | ----------------- |
| id                     | uuid                     | NO          | gen_random_uuid() |
| category_id            | text                     | NO          | null              |
| name                   | text                     | NO          | null              |
| credential_level       | text                     | YES         | 'none'::text      |
| credential_description | text                     | YES         | null              |
| description            | text                     | YES         | null              |
| display_order          | integer                  | YES         | 0                 |
| is_active              | boolean                  | YES         | true              |
| created_at             | timestamp with time zone | YES         | now()             |
| updated_at             | timestamp with time zone | YES         | now()             |


====================================
taxonomy_subcategories
====================================
| id                                   | taxonomy_id                          | name                             | display_order | is_active | created_at                    |
| ------------------------------------ | ------------------------------------ | -------------------------------- | ------------- | --------- | ----------------------------- |
| 6aba4a33-da8f-4a7b-bade-a7f498241e72 | 17d4d957-905e-411a-9b4d-1165a9940b4f | Allergies & Sinus Issues         | 1             | true      | 2025-11-06 15:42:32.288419+00 |
| d7139860-653f-42e3-8a52-d9321a212cc7 | 17d4d957-905e-411a-9b4d-1165a9940b4f | Auricular Acupuncture            | 2             | true      | 2025-11-06 15:42:32.288419+00 |
| 661b1480-f817-4cb3-8bee-361b3f744c3d | 17d4d957-905e-411a-9b4d-1165a9940b4f | Autoimmune Support               | 3             | true      | 2025-11-06 15:42:32.288419+00 |
| c1773b60-fb3b-48bf-a2ab-85f2cf165d5d | 17d4d957-905e-411a-9b4d-1165a9940b4f | Chinese Herbal Medicine          | 4             | true      | 2025-11-06 15:42:32.288419+00 |
| e6b3919d-7006-4348-aab4-0e5e4210f5d3 | 17d4d957-905e-411a-9b4d-1165a9940b4f | Cupping Therapy                  | 5             | true      | 2025-11-06 15:42:32.288419+00 |
| 3bc9e288-c673-4a64-ac0d-733e287f79d5 | 17d4d957-905e-411a-9b4d-1165a9940b4f | Digestive Issues                 | 6             | true      | 2025-11-06 15:42:32.288419+00 |
| 96ea348e-98c6-4f79-9f32-12ebb116afe3 | 17d4d957-905e-411a-9b4d-1165a9940b4f | Electroacupuncture               | 7             | true      | 2025-11-06 15:42:32.288419+00 |
| 0cd1e726-e7d3-4a42-bd14-ea6ed65e0228 | 17d4d957-905e-411a-9b4d-1165a9940b4f | Facial Acupuncture               | 8             | true      | 2025-11-06 15:42:32.288419+00 |
| f99a0ed3-f708-4bae-b9e6-b237eb04dce8 | 17d4d957-905e-411a-9b4d-1165a9940b4f | Fertility Support                | 9             | true      | 2025-11-06 15:42:32.288419+00 |
| 9df29d42-d69f-4e29-b208-cd607c320eb4 | 17d4d957-905e-411a-9b4d-1165a9940b4f | Gua Sha                          | 10            | true      | 2025-11-06 15:42:32.288419+00 |
| de10f588-9581-4a7c-a907-099c24580777 | 17d4d957-905e-411a-9b4d-1165a9940b4f | Headaches & Migraines            | 11            | true      | 2025-11-06 15:42:32.288419+00 |
| 2c51ace8-2bcb-4738-a7a1-3248dabca523 | 17d4d957-905e-411a-9b4d-1165a9940b4f | Insomnia & Sleep Disorders       | 12            | true      | 2025-11-06 15:42:32.288419+00 |
| 44182a28-5067-4888-8d69-396bf54837e1 | 17d4d957-905e-411a-9b4d-1165a9940b4f | Moxibustion                      | 13            | true      | 2025-11-06 15:42:32.288419+00 |
| ce44e15d-ea85-4b5f-ac99-cd70616ddf35 | 17d4d957-905e-411a-9b4d-1165a9940b4f | Pain Management                  | 14            | true      | 2025-11-06 15:42:32.288419+00 |
| 6a1e7c19-f4f8-43d0-9b10-4d23a8753526 | 17d4d957-905e-411a-9b4d-1165a9940b4f | Pediatric Acupuncture            | 15            | true      | 2025-11-06 15:42:32.288419+00 |
| fc607310-225e-4d56-a5b6-d95a6e0719d3 | 17d4d957-905e-411a-9b4d-1165a9940b4f | Smoking Cessation                | 16            | true      | 2025-11-06 15:42:32.288419+00 |
| 78c6eba5-2c06-4ed2-b943-a2588a06e96f | 17d4d957-905e-411a-9b4d-1165a9940b4f | Sports Injury Recovery           | 17            | true      | 2025-11-06 15:42:32.288419+00 |
| adeabb65-84b1-4cd8-9b73-46553d29f6b6 | 17d4d957-905e-411a-9b4d-1165a9940b4f | Stress & Anxiety Relief          | 18            | true      | 2025-11-06 15:42:32.288419+00 |
| 246e3a70-4b5c-42af-b35a-0d74fdc62dd9 | 17d4d957-905e-411a-9b4d-1165a9940b4f | Weight Management                | 19            | true      | 2025-11-06 15:42:32.288419+00 |
| c934c622-1c68-49c1-827c-e915709ddd3b | 17d4d957-905e-411a-9b4d-1165a9940b4f | Women's Health                   | 20            | true      | 2025-11-06 15:42:32.288419+00 |
| 9c2d10d1-e784-407f-92bf-538b46573a8c | 88e8ef68-ea5c-4ef5-af89-53f08502845a | Auto Accident Injury             | 1             | true      | 2025-11-06 15:42:32.288419+00 |
| bf4a07a4-62f6-4429-80f2-e9e263454db2 | 88e8ef68-ea5c-4ef5-af89-53f08502845a | Back Pain Treatment              | 2             | true      | 2025-11-06 15:42:32.288419+00 |
| f7c2767b-1544-4393-84f4-e6449810955b | 88e8ef68-ea5c-4ef5-af89-53f08502845a | Extremity Adjustments            | 3             | true      | 2025-11-06 15:42:32.288419+00 |
| 3de581b2-b443-420e-85a5-9013c15948aa | 88e8ef68-ea5c-4ef5-af89-53f08502845a | Headache & Migraine Relief       | 4             | true      | 2025-11-06 15:42:32.288419+00 |
| 9617fe16-b593-4d12-911a-6155c3b79a02 | 88e8ef68-ea5c-4ef5-af89-53f08502845a | Lifestyle Coaching               | 5             | true      | 2025-11-06 15:42:32.288419+00 |
| 6db98510-f0c5-470e-a84f-0a261b1b4b90 | 88e8ef68-ea5c-4ef5-af89-53f08502845a | Maintenance/Wellness Care        | 6             | true      | 2025-11-06 15:42:32.288419+00 |
| 57d64089-6083-4a9a-bb1f-2088598654eb | 88e8ef68-ea5c-4ef5-af89-53f08502845a | Neck Pain Treatment              | 7             | true      | 2025-11-06 15:42:32.288419+00 |
| dcbdda27-d091-45c1-b03e-bfdf57b41b21 | 88e8ef68-ea5c-4ef5-af89-53f08502845a | Nutritional Counseling           | 8             | true      | 2025-11-06 15:42:32.288419+00 |
| 28afd371-60eb-4806-98ca-62c90fcab846 | 88e8ef68-ea5c-4ef5-af89-53f08502845a | Pediatric Chiropractic           | 9             | true      | 2025-11-06 15:42:32.288419+00 |
| fa7c22c9-6b28-40a6-a22d-41a38e5f4891 | 88e8ef68-ea5c-4ef5-af89-53f08502845a | Postural Correction              | 10            | true      | 2025-11-06 15:42:32.288419+00 |
| 777029a9-5f2d-4473-a71a-7d44a21179f6 | 88e8ef68-ea5c-4ef5-af89-53f08502845a | Pregnancy Chiropractic           | 11            | true      | 2025-11-06 15:42:32.288419+00 |
| 21aa98bf-663d-40d3-9ed5-2a92d66465dd | 88e8ef68-ea5c-4ef5-af89-53f08502845a | Rehabilitation Exercises         | 12            | true      | 2025-11-06 15:42:32.288419+00 |
| 2d17bd58-dd34-47b5-88a0-7b8d34cde803 | 88e8ef68-ea5c-4ef5-af89-53f08502845a | Sciatica Treatment               | 13            | true      | 2025-11-06 15:42:32.288419+00 |
| e83553d8-e205-4050-a4d9-6bdf27b70241 | 88e8ef68-ea5c-4ef5-af89-53f08502845a | Scoliosis Management             | 14            | true      | 2025-11-06 15:42:32.288419+00 |
| 9ce78573-70b3-476c-bfa9-11eaf3d636ee | 88e8ef68-ea5c-4ef5-af89-53f08502845a | Soft Tissue Therapy              | 15            | true      | 2025-11-06 15:42:32.288419+00 |
| 03209329-5823-4828-b5c2-51c3498d6733 | 88e8ef68-ea5c-4ef5-af89-53f08502845a | Spinal Adjustment/Manipulation   | 16            | true      | 2025-11-06 15:42:32.288419+00 |
| ab714019-e664-4b08-8a37-21618248ec16 | 88e8ef68-ea5c-4ef5-af89-53f08502845a | Sports Injury Treatment          | 17            | true      | 2025-11-06 15:42:32.288419+00 |
| 92640f37-5b46-4bf5-8f17-000489a4dd75 | 88e8ef68-ea5c-4ef5-af89-53f08502845a | Work Injury Treatment            | 18            | true      | 2025-11-06 15:42:32.288419+00 |
| 7984b6ef-cc9b-452d-a784-4a8828eb26e2 | 88e8ef68-ea5c-4ef5-af89-53f08502845a | X-Ray & Diagnostic Services      | 19            | true      | 2025-11-06 15:42:32.288419+00 |
| e8af2088-a192-42f0-9e72-0a32d7f31910 | bc57b6e3-a056-458a-a0a7-04c2f7330f25 | Allergy & Asthma Management      | 1             | true      | 2025-11-06 15:42:32.288419+00 |
| df33c1d0-c617-4616-8a7b-1139e8342b91 | bc57b6e3-a056-458a-a0a7-04c2f7330f25 | Autoimmune Conditions            | 2             | true      | 2025-11-06 15:42:32.288419+00 |
| f8e331b4-80cf-4125-b5aa-74b685a0b4e8 | bc57b6e3-a056-458a-a0a7-04c2f7330f25 | Botanical Medicine               | 3             | true      | 2025-11-06 15:42:32.288419+00 |
| 5c25814e-9a96-493c-94c8-7ed2e62b9075 | bc57b6e3-a056-458a-a0a7-04c2f7330f25 | Cancer Support                   | 4             | true      | 2025-11-06 15:42:32.288419+00 |
| e7f36cf2-444b-466a-b5f1-7f6d84cb4836 | bc57b6e3-a056-458a-a0a7-04c2f7330f25 | Cardiovascular Health            | 5             | true      | 2025-11-06 15:42:32.288419+00 |
| 31d1066b-84e3-4503-95cf-718b5386d54e | bc57b6e3-a056-458a-a0a7-04c2f7330f25 | Chronic Disease Management       | 6             | true      | 2025-11-06 15:42:32.288419+00 |
| 4143cc24-7b43-4b54-8cb6-ca34d0107df5 | bc57b6e3-a056-458a-a0a7-04c2f7330f25 | Chronic Fatigue & Fibromyalgia   | 7             | true      | 2025-11-06 15:42:32.288419+00 |
| 2ff6d2ac-05c1-40f4-b465-1bace673004b | bc57b6e3-a056-458a-a0a7-04c2f7330f25 | Detoxification Programs          | 8             | true      | 2025-11-06 15:42:32.288419+00 |
| 97cd1c01-56aa-440d-8971-70907c24bcde | bc57b6e3-a056-458a-a0a7-04c2f7330f25 | Diabetes Management              | 9             | true      | 2025-11-06 15:42:32.288419+00 |
| 9108e3e1-ca89-44ce-9ce4-55f52900f8c5 | bc57b6e3-a056-458a-a0a7-04c2f7330f25 | Digestive Health                 | 10            | true      | 2025-11-06 15:42:32.288419+00 |
| 3c951ab6-082a-4087-a576-1788775a7e1b | bc57b6e3-a056-458a-a0a7-04c2f7330f25 | Homeopathy                       | 11            | true      | 2025-11-06 15:42:32.288419+00 |
| 10d028b9-7d3f-40e6-9671-2486e07b43b6 | bc57b6e3-a056-458a-a0a7-04c2f7330f25 | Hormone Balance                  | 12            | true      | 2025-11-06 15:42:32.288419+00 |
| a24df2de-7173-4588-87bb-c5ffcce1e2df | bc57b6e3-a056-458a-a0a7-04c2f7330f25 | IV Nutrient Therapy              | 13            | true      | 2025-11-06 15:42:32.288419+00 |
| 9f21a580-ca98-4da5-8960-e2e5d1bc4865 | bc57b6e3-a056-458a-a0a7-04c2f7330f25 | Lab Testing & Interpretation     | 14            | true      | 2025-11-06 15:42:32.288419+00 |
| 7f9b6b93-a145-488c-8e38-49c466a91a8f | bc57b6e3-a056-458a-a0a7-04c2f7330f25 | Lifestyle Counseling             | 15            | true      | 2025-11-06 15:42:32.288419+00 |
| fd5c1fdf-5b50-4e4d-bcad-c89c0cd59391 | bc57b6e3-a056-458a-a0a7-04c2f7330f25 | Men's Health                     | 16            | true      | 2025-11-06 15:42:32.288419+00 |
| 36ed6c1e-243e-4dbb-8c61-a9040809b9b9 | bc57b6e3-a056-458a-a0a7-04c2f7330f25 | Mental Health Support            | 17            | true      | 2025-11-06 15:42:32.288419+00 |
| 34ae15e5-fce7-4dcc-ba1d-aaf805dd10f5 | bc57b6e3-a056-458a-a0a7-04c2f7330f25 | Mind-Body Medicine               | 18            | true      | 2025-11-06 15:42:32.288419+00 |
| 53acb9c5-2b68-4ea4-a70d-544842bb7199 | bc57b6e3-a056-458a-a0a7-04c2f7330f25 | Pain Management                  | 19            | true      | 2025-11-06 15:42:32.288419+00 |
| b1a2ea2e-7659-41fb-a851-6f65eed53980 | bc57b6e3-a056-458a-a0a7-04c2f7330f25 | Pediatric Naturopathy            | 20            | true      | 2025-11-06 15:42:32.288419+00 |
| 896f7d7e-0047-4e68-bb04-4717117371a5 | bc57b6e3-a056-458a-a0a7-04c2f7330f25 | Primary Care                     | 21            | true      | 2025-11-06 15:42:32.288419+00 |
| 59944388-8db3-406b-a60f-546e625d9a28 | bc57b6e3-a056-458a-a0a7-04c2f7330f25 | Weight Management                | 22            | true      | 2025-11-06 15:42:32.288419+00 |
| ae325a06-8646-463b-ac88-fbfa057e27f6 | bc57b6e3-a056-458a-a0a7-04c2f7330f25 | Women's Health                   | 23            | true      | 2025-11-06 15:42:32.288419+00 |
| 69391111-c183-4974-acbd-56a8993ccf02 | aec0df0d-876a-400e-bab7-0ea2feee08f3 | Diabetes Management              | 1             | true      | 2025-11-06 15:42:32.288419+00 |
| 55d8f66c-f558-4191-9ddf-061f9349dafa | aec0df0d-876a-400e-bab7-0ea2feee08f3 | Eating Disorder Recovery         | 2             | true      | 2025-11-06 15:42:32.288419+00 |
| 526ff553-5c34-4008-8867-26bac344d210 | aec0df0d-876a-400e-bab7-0ea2feee08f3 | Food Allergy Management          | 3             | true      | 2025-11-06 15:42:32.288419+00 |
| d52f236c-09ab-4008-a1a0-6c2fe6735a65 | aec0df0d-876a-400e-bab7-0ea2feee08f3 | Functional Nutrition Coaching    | 4             | true      | 2025-11-06 15:42:32.288419+00 |
| ae072ea3-ff65-40b3-b4b0-0fb154edf5b5 | aec0df0d-876a-400e-bab7-0ea2feee08f3 | Geriatric Nutrition              | 5             | true      | 2025-11-06 15:42:32.288419+00 |
| 54212614-a500-4dfc-b447-bb2f6e38792a | aec0df0d-876a-400e-bab7-0ea2feee08f3 | Gut Health Optimization          | 6             | true      | 2025-11-06 15:42:32.288419+00 |
| 4cc3bcc3-94c2-4b8a-b500-9455018e8dfc | aec0df0d-876a-400e-bab7-0ea2feee08f3 | Medical Nutrition Therapy        | 7             | true      | 2025-11-06 15:42:32.288419+00 |
| c5b99117-7226-4ee0-8ae2-b07b2d5cb3ff | aec0df0d-876a-400e-bab7-0ea2feee08f3 | Metabolic Testing                | 8             | true      | 2025-11-06 15:42:32.288419+00 |
| b1539493-1e1e-46b5-9fa0-5f3f98b574fb | aec0df0d-876a-400e-bab7-0ea2feee08f3 | Pediatric Nutrition              | 9             | true      | 2025-11-06 15:42:32.288419+00 |
| 14e7e1b0-5e1a-4611-8721-cd76ce04610a | aec0df0d-876a-400e-bab7-0ea2feee08f3 | Plant-Based Nutrition            | 10            | true      | 2025-11-06 15:42:32.288419+00 |
| 7e2e05f5-84d6-497a-a64d-70b679ac6a9a | aec0df0d-876a-400e-bab7-0ea2feee08f3 | Pregnancy & Postpartum Nutrition | 11            | true      | 2025-11-06 15:42:32.288419+00 |
| d26a88b4-8643-4db0-9a19-2aa7711e6a22 | aec0df0d-876a-400e-bab7-0ea2feee08f3 | Renal Nutrition                  | 12            | true      | 2025-11-06 15:42:32.288419+00 |
| 75f4b992-0587-4b6f-a424-8e1d02eff821 | aec0df0d-876a-400e-bab7-0ea2feee08f3 | Sports Nutrition                 | 13            | true      | 2025-11-06 15:42:32.288419+00 |
| f03d8aa2-944d-4b70-8289-18c3b4fbb972 | aec0df0d-876a-400e-bab7-0ea2feee08f3 | Supplement Recommendations       | 14            | true      | 2025-11-06 15:42:32.288419+00 |
| 18eb3b72-88c7-44de-8ec7-5460eb62a581 | aec0df0d-876a-400e-bab7-0ea2feee08f3 | Weight Management                | 15            | true      | 2025-11-06 15:42:32.288419+00 |
| 413b06f2-3a40-41b4-b5a1-d69bbb6adf40 | 096d3b79-b86e-458f-8484-d6447fe46dcb | Chronic Disease Support          | 1             | true      | 2025-11-06 15:42:32.288419+00 |
| 9e1602bf-f874-4333-a889-f33057d94894 | 096d3b79-b86e-458f-8484-d6447fe46dcb | Corporate Wellness               | 2             | true      | 2025-11-06 15:42:32.288419+00 |
| 76b26b7e-b633-4c32-9985-53daf38fa212 | 096d3b79-b86e-458f-8484-d6447fe46dcb | Energy Management                | 3             | true      | 2025-11-06 15:42:32.288419+00 |
| bc5612df-e647-4cb6-bce6-8dc5511dfc1f | 096d3b79-b86e-458f-8484-d6447fe46dcb | Exercise Programming             | 4             | true      | 2025-11-06 15:42:32.288419+00 |
| f07a5efa-c855-4db6-800f-fd052eb0927e | 096d3b79-b86e-458f-8484-d6447fe46dcb | Goal Setting & Accountability    | 5             | true      | 2025-11-06 15:42:32.288419+00 |
| 8ef6f97e-e5c7-4938-a201-324c0fe7c6e2 | 096d3b79-b86e-458f-8484-d6447fe46dcb | Habit Formation                  | 6             | true      | 2025-11-06 15:42:32.288419+00 |
| 92579b51-885d-4cac-b8cd-00bcbf7960fc | 096d3b79-b86e-458f-8484-d6447fe46dcb | Health Coaching                  | 7             | true      | 2025-11-06 15:42:32.288419+00 |
| f4a1f3f1-a48a-4f9d-8e6d-a8bc995d5718 | 096d3b79-b86e-458f-8484-d6447fe46dcb | Lifestyle Coaching               | 8             | true      | 2025-11-06 15:42:32.288419+00 |
| f2cdeb4f-3c94-4238-a926-4a40f35706f6 | 096d3b79-b86e-458f-8484-d6447fe46dcb | Nutrition Guidance               | 9             | true      | 2025-11-06 15:42:32.288419+00 |
| 64a5c092-92fc-4b18-9d1b-d19a0e9388de | 096d3b79-b86e-458f-8484-d6447fe46dcb | One-on-One Coaching              | 10            | true      | 2025-11-06 15:42:32.288419+00 |
| dd66e3e0-a896-4bb5-bcaa-dd7e4b2c5507 | 096d3b79-b86e-458f-8484-d6447fe46dcb | Preventive Health                | 11            | true      | 2025-11-06 15:42:32.288419+00 |
| e8863303-d1ce-480f-be6a-e2b2aac73ad0 | 096d3b79-b86e-458f-8484-d6447fe46dcb | Sleep Optimization               | 12            | true      | 2025-11-06 15:42:32.288419+00 |
| 48d4186f-6764-4e4b-9b1b-1961f63dc039 | 096d3b79-b86e-458f-8484-d6447fe46dcb | Stress Management                | 13            | true      | 2025-11-06 15:42:32.288419+00 |
| 724da63f-bd11-4a97-8292-a53382d3fa4b | 096d3b79-b86e-458f-8484-d6447fe46dcb | Wellness Program Design          | 14            | true      | 2025-11-06 15:42:32.288419+00 |
| 4654557f-9d2f-4ea2-92e0-41c8c604f12c | 096d3b79-b86e-458f-8484-d6447fe46dcb | Work-Life Balance                | 15            | true      | 2025-11-06 15:42:32.288419+00 |
| 9a50a7c4-9a74-4952-8172-bea16051a4b6 | aabcf233-1849-48d8-ae03-5fe7fdd5b4ef | Boot Camp Training               | 1             | true      | 2025-11-06 15:42:32.288419+00 |
| fe1826e6-c69e-4af5-8cf0-2bfe08e0633b | aabcf233-1849-48d8-ae03-5fe7fdd5b4ef | Cardiovascular Training          | 2             | true      | 2025-11-06 15:42:32.288419+00 |
| e9733733-66a5-404a-a58f-d92f9f7bed86 | aabcf233-1849-48d8-ae03-5fe7fdd5b4ef | CrossFit Coaching                | 3             | true      | 2025-11-06 15:42:32.288419+00 |
| e7fdae29-11a2-4d80-a200-292bb2bbbca8 | aabcf233-1849-48d8-ae03-5fe7fdd5b4ef | Flexibility & Mobility           | 4             | true      | 2025-11-06 15:42:32.288419+00 |
| 11384448-87a3-4771-a4b0-6f3cd88641a1 | aabcf233-1849-48d8-ae03-5fe7fdd5b4ef | Functional Fitness               | 5             | true      | 2025-11-06 15:42:32.288419+00 |
| 2f170ba7-3d2c-4d2c-a0f2-b522bd3868aa | aabcf233-1849-48d8-ae03-5fe7fdd5b4ef | Group Classes                    | 6             | true      | 2025-11-06 15:42:32.288419+00 |
| 348be3c4-5163-43ef-9a55-cdbcbb9e2323 | aabcf233-1849-48d8-ae03-5fe7fdd5b4ef | HIIT Training                    | 7             | true      | 2025-11-06 15:42:32.288419+00 |
| 056b3d6e-d00c-49fb-820d-19d0bef06737 | aabcf233-1849-48d8-ae03-5fe7fdd5b4ef | Nutrition Coaching               | 8             | true      | 2025-11-06 15:42:32.288419+00 |

| column_name   | data_type                | is_nullable | column_default    |
| ------------- | ------------------------ | ----------- | ----------------- |
| id            | uuid                     | NO          | gen_random_uuid() |
| taxonomy_id   | uuid                     | NO          | null              |
| name          | text                     | NO          | null              |
| display_order | integer                  | YES         | 0                 |
| is_active     | boolean                  | YES         | true              |
| created_at    | timestamp with time zone | YES         | now()             |



Workflow =

New Match is made = match AND project status = pending.
Practitioner accepts = match AND project status = in-progress
Practitioner declines = match status = declined
Practitioner blocks = match status = declined
client changes dropdown to hired = match AND project status change to Hired and CLOSE
client changes dropdown to not hired = match status changes to not hired and match closes
client cancels project itself = project status AND ALL match status change to not hired  and CLOSE


