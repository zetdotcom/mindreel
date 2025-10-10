# Supabase Database Schema for MindReel

This document outlines the database schema for the cloud-based components of the MindReel application, managed by Supabase. The design is based on the PRD and technical planning sessions, focusing on the MVP requirements which include user authentication and AI summary quota management.

## 1. Tables

### `auth.users`
This is the standard Supabase authentication table. It will be used to store user identity information. No custom `profiles` table will be created for the MVP.

- **`id`**: `uuid` (Primary Key) - User's unique identifier.
- **`email`**: `text` - User's email address.
- **`encrypted_password`**: `text` - User's hashed password.
- **`created_at`**: `timestamptz` - Timestamp of user registration.
- ... (other standard Supabase auth columns)

### `public.user_ai_quota`
This table tracks the number of AI-generated summaries for each user within a rolling 28-day cycle.

| Column Name          | Data Type     | Constraints                                               | Description                                                                 |
| -------------------- | ------------- | --------------------------------------------------------- | --------------------------------------------------------------------------- |
| `user_id`            | `uuid`        | `PRIMARY KEY`, `REFERENCES auth.users(id) ON DELETE CASCADE` | Foreign key to the `auth.users` table, linking the quota to a specific user. |
| `ai_summaries_count` | `integer`     | `NOT NULL`, `DEFAULT 0`                                   | The number of AI summaries generated in the current cycle.                  |
| `cycle_start_at`     | `timestamptz` | `NOT NULL`                                                | The timestamp when the current 28-day quota cycle began.                    |
| `updated_at`         | `timestamptz` | `NOT NULL`, `DEFAULT now()`                               | The timestamp when the row was last modified.                               |

## 2. Relationships

- **`auth.users` to `public.user_ai_quota`**: A **one-to-one** relationship. Each user in `auth.users` can have at most one corresponding entry in `user_ai_quota`. The `user_id` in `user_ai_quota` serves as both the primary key and the foreign key.

## 3. Indexes

- **Primary Key Index on `user_ai_quota(user_id)`**: A B-tree index is automatically created for the primary key, ensuring efficient `O(1)` lookups for a user's quota information. No other indexes are required for the MVP.

## 4. PostgreSQL Functions

A server-side function is required to handle the logic of checking, resetting, and incrementing the summary quota atomically. This function will be defined with `SECURITY DEFINER` to bypass RLS and perform mutations safely.

### `public.increment_ai_summary_count()`

```sql
CREATE OR REPLACE FUNCTION public.increment_ai_summary_count()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id uuid := auth.uid();
  quota_limit int := 5;
  cycle_interval interval := '28 days';
  current_cycle_start timestamptz;
  new_summary_count int;
BEGIN
  -- Upsert the quota row for the user if it doesn't exist.
  INSERT INTO public.user_ai_quota (user_id, ai_summaries_count, cycle_start_at)
  VALUES (current_user_id, 0, now())
  ON CONFLICT (user_id) DO NOTHING;

  -- Retrieve the current cycle start and count.
  SELECT cycle_start_at, ai_summaries_count
  INTO current_cycle_start, new_summary_count
  FROM public.user_ai_quota
  WHERE user_id = current_user_id;

  -- Check if the cycle needs to be reset.
  IF now() >= current_cycle_start + cycle_interval THEN
    -- Reset the cycle.
    UPDATE public.user_ai_quota
    SET
      ai_summaries_count = 0,
      cycle_start_at = now(),
      updated_at = now()
    WHERE user_id = current_user_id
    RETURNING 0 INTO new_summary_count;
  END IF;

  -- Check if the user has reached the quota limit.
  IF new_summary_count >= quota_limit THEN
    RETURN json_build_object('status', 'limit_reached', 'count', new_summary_count);
  END IF;

  -- Increment the count and update the timestamp.
  UPDATE public.user_ai_quota
  SET
    ai_summaries_count = ai_summaries_count + 1,
    updated_at = now()
  WHERE user_id = current_user_id
  RETURNING ai_summaries_count INTO new_summary_count;

  RETURN json_build_object('status', 'incremented', 'count', new_summary_count);
END;
$$;
```

## 5. Row-Level Security (RLS) Policies

RLS will be enabled on the `user_ai_quota` table to ensure users can only access their own quota information.

### Enable RLS on `user_ai_quota`

```sql
ALTER TABLE public.user_ai_quota ENABLE ROW LEVEL SECURITY;
```

### Policies for `user_ai_quota`

1.  **Allow `SELECT` for the owning user:**
    Users should be able to read their own quota status.

    ```sql
    CREATE POLICY "Allow individual user SELECT access"
    ON public.user_ai_quota
    FOR SELECT
    USING (auth.uid() = user_id);
    ```

2.  **Deny all mutations (`INSERT`, `UPDATE`, `DELETE`):**
    All mutations will be handled exclusively by the `increment_ai_summary_count()` `SECURITY DEFINER` function. This prevents users from tampering with their quota directly. Since RLS defaults to `DENY`, no explicit `DENY` policies are needed if no `ALLOW` policies for mutation are defined.

## 6. Design Notes

- **Local-First Approach**: The Supabase database is intentionally minimal for the MVP. It only handles authentication and AI summary quota. All user-generated content (daily entries, generated summaries) is stored locally on the user's machine using SQLite, as specified in the PRD.
- **Lazy Initialization**: A user's quota record in `user_ai_quota` is created "lazily" upon the first attempt to generate an AI summary. This avoids populating the table for users who never use the feature.
- **Atomic Operations**: The `increment_ai_summary_count()` function ensures that checking the cycle, resetting if necessary, and incrementing the count are performed as a single, atomic transaction, preventing race conditions.
- **Security**: The combination of RLS and a `SECURITY DEFINER` function provides a robust security model where users can read their state but cannot modify it, protecting the integrity of the quota system.
- **Scalability**: The design is highly scalable, as each quota update is a fast, indexed operation on a single row. The schema can be easily extended in the future (e.g., to support different subscription plans) by adding columns to the `user_ai_quota` table without requiring a data migration for existing users.