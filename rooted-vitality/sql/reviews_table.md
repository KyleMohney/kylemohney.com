| column_name        |
| ------------------ |
| id                 | (uuid)
| practitioner_id    |
| is_approved        |
| is_verified        |
| review_date        |
| created_at         |
| updated_at         |
| is_featured        |
| project_id         |
| id                 |
| is_visible         |
| rating             |
| client_id          |
| practitioner_name  |
| client_name        |
| review_text        |
| source             |
| external_platform  |
| external_url       |
| external_review_id |
| moderation_notes   |
| photos             |

Notes: 

client_id is populated from Clients table, column: serial_number
practitioner_id is populated from Practitioners table, column: serial_number
project_id is populated from Projects table, column: project_id
rating is an integer from 1 to 5