
project_practitioner_matches
| column_name         | data_type                |
| ------------------- | ------------------------ |
| id                  | uuid                     |
| status              | text                     |
| match_score         | integer                  |
| matched_concerns    | ARRAY                    |
| client_initiated    | boolean                  |
| contacted_at        | timestamp with time zone |
| created_at          | timestamp with time zone |
| updated_at          | timestamp with time zone |
| practitioner_serial | text                     |
| client_serial       | text                     |
| matched_at          | timestamp with time zone |
| is_read             | boolean                  |
| project_serial      | text                     |

projects
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

practitioners
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

practitioner_profiles
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

practitioner_credentials
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

