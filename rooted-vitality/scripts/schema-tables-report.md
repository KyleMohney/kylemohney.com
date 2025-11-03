| column_name         | data_type                   | is_nullable | column_default         | is_identity |
| ------------------- | --------------------------- | ----------- | ---------------------- | ----------- |
| id                  | uuid                        | NO          | uuid_generate_v4()     | NO          |
| user_id             | uuid                        | NO          | null                   | NO          |
| email               | text                        | NO          | null                   | NO          |
| legal_name          | text                        | YES         | null                   | NO          |
| dba_name            | text                        | YES         | null                   | NO          |
| bio                 | text                        | YES         | null                   | NO          |
| tagline             | text                        | YES         | null                   | NO          |
| modalities          | ARRAY                       | YES         | null                   | NO          |
| availability        | ARRAY                       | YES         | null                   | NO          |
| workspace_type      | text                        | YES         | null                   | NO          |
| created_at          | timestamp without time zone | YES         | now()                  | NO          |
| updated_at          | timestamp without time zone | YES         | now()                  | NO          |
| status              | text                        | YES         | 'pending_review'::text | NO          |
| submitted_at        | timestamp with time zone    | YES         | now()                  | NO          |
| business_size       | text                        | YES         | null                   | NO          |
| year_established    | integer                     | YES         | null                   | NO          |
| legal_business_name | text                        | YES         | null                   | NO          |
| main_category       | text                        | YES         | null                   | NO          |
| phone               | text                        | YES         | null                   | NO          |
| location            | text                        | YES         | null                   | NO          |
| years_in_practice   | text                        | YES         | null                   | NO          |
| ethos_statement     | text                        | YES         | null                   | NO          |
| social_media        | jsonb                       | YES         | '{}'::jsonb            | NO          |
| languages           | ARRAY                       | YES         | ARRAY[]::text[]        | NO          |
| faq                 | jsonb                       | YES         | '[]'::jsonb            | NO          |
| serial_number       | text                        | YES         | null                   | NO          |
| payment_methods     | text                        | YES         | null                   | NO          |
| accepts_insurance   | boolean                     | YES         | false                  | NO          |
| profile_photo_url   | text                        | YES         | null                   | NO          |
| practice_logo_url   | text                        | YES         | null                   | NO          |


======
Query 2
======
| constraint_name                 | constraint_type | table_name    |
| ------------------------------- | --------------- | ------------- |
| practitioners_pkey              | PRIMARY KEY     | practitioners |
| practitioners_serial_number_key | UNIQUE          | practitioners |
| practitioners_user_id_key       | UNIQUE          | practitioners |
| 2200_20099_1_not_null           | CHECK           | practitioners |
| 2200_20099_2_not_null           | CHECK           | practitioners |
| 2200_20099_3_not_null           | CHECK           | practitioners |

========
Query 3
========
| schemaname | tablename     | policyname                     | permissive | roles           | cmd    | qual                   | with_check             |
| ---------- | ------------- | ------------------------------ | ---------- | --------------- | ------ | ---------------------- | ---------------------- |
| public     | practitioners | select_policy                  | PERMISSIVE | {public}        | SELECT | true                   | null                   |
| public     | practitioners | update_policy                  | PERMISSIVE | {authenticated} | UPDATE | (auth.uid() = user_id) | (auth.uid() = user_id) |
| public     | practitioners | Users can read own profile     | PERMISSIVE | {public}        | SELECT | (auth.uid() = user_id) | null                   |
| public     | practitioners | Users can update own profile   | PERMISSIVE | {public}        | UPDATE | (auth.uid() = user_id) | (auth.uid() = user_id) |
| public     | practitioners | Users can create their profile | PERMISSIVE | {public}        | INSERT | null                   | (auth.uid() = user_id) |
| public     | practitioners | insert_policy                  | PERMISSIVE | {authenticated} | INSERT | null                   | (auth.uid() = user_id) |

=======
Query 4
=======
Success. No Rows returned.