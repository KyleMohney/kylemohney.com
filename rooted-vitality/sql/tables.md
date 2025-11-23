NOTES:
all tables have an id column for UUID
all tables have a serial_number column for HUMAN TRACKING
NO NEW DOCUMENTATION UNLESS I ASK
DO NOT PUSH TO GIT UNLESS I ASK
ALL SQL PROVIDED TO ME IN CHAT
          |
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
| dba_name                     | text                        |
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

| column_name            | data_type                |
| ---------------------- | ------------------------ |
| id                     | uuid                     |
| client_serial          | text                     |
| category_id            | text                     |
| description            | text                     |
| street                 | text                     |
| zipcode                | text                     |
| state                  | text                     |
| start_date             | date                     |
| urgency                | text                     |
| project_status         | text                     |
| client_open_to_contact | boolean                  |
| created_at             | timestamp with time zone |
| updated_at             | timestamp with time zone |
| review_left            | boolean                  |
| travel_preference      | text                     |
| subcategory_name       | text                     |
| category_name          | text                     |
| custom_name            | text                     |
| city                   | text                     |
| closed_date            | date                     |
| reopened_date          | date                     |
| matched_practitioners  | text                     |
| hired_practitioner     | character varying        |
| client_first_name      | text                     |
| client_last_name       | text                     |
| client_id              | uuid                     |
| closure_reason         | text                     |
| closure_notes          | text                     |
| project_serial         | integer                  |

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

| column_name         | data_type                |
| ------------------- | ------------------------ |
| id                  | uuid                     |
| project_id          | uuid                     |
| practitioner_id     | uuid                     |
| client_id           | uuid                     |
| sender_id           | uuid                     |
| sender_type         | text                     |
| message             | text                     |
| is_read             | boolean                  |
| created_at          | timestamp with time zone |
| updated_at          | timestamp with time zone |
| project_serial      | integer                  |
| practitioner_serial | text                     |
| client_serial       | text                     |
| is_automated        | boolean                  |
| match_id            | uuid                     |
| message_type        | text                     |
| automated_trigger   | text                     |

===================
3: CLIENT TABLES
===================

====================================
clients
====================================

| column_name           | data_type                   |
| --------------------- | --------------------------- |
| id                    | uuid                        |
| first_name            | character varying           |
| last_name             | character varying           |
| email                 | character varying           |
| phone                 | character varying           |
| zipcode               | character varying           |
| account_status        | character varying           |
| account_standing      | character varying           |
| two_factor_enabled    | boolean                     |
| two_factor_method     | character varying           |
| created_at            | timestamp with time zone    |
| updated_at            | timestamp with time zone    |
| last_login            | timestamp with time zone    |
| settings_updated_at   | timestamp with time zone    |
| profile_picture_url   | character varying           |
| age                   | integer                     |
| sex                   | text                        |
| notification_settings | jsonb                       |
| membership_level      | text                        |
| membership_started_at | timestamp without time zone |
| membership_expires_at | timestamp without time zone |
| serial_number         | text                        |
| open_to_contact       | boolean                     |

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