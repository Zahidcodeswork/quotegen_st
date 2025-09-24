<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1-zPkOKM1J8hIA25lIPYzHT92tOFyu_nn

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Run the app:
   `npm run dev`

## Environment configuration

Create a `.env.local` file at the project root before starting the dev server. Populate it with your Supabase project keys:

```
VITE_SUPABASE_URL=https://<your-project-id>.supabase.co
VITE_SUPABASE_ANON_KEY=<public-anon-key>
```

The build will fail if these variables are missing.

## Supabase schema

Provision these tables (all timestamps can default to `now()`):

- `profiles`
  - `id uuid` primary key referencing `auth.users`
  - `email text`
  - `role text` default `'user'`
  - `full_name text`
  - `created_at timestamptz`
- `quotes`
  - `id uuid` primary key default `uuid_generate_v4()`
  - `quote_no text` unique
  - `user_id uuid` referencing `auth.users`
  - `status text`
  - `owner_email text`
  - `payload jsonb`
  - `created_at timestamptz`
  - `updated_at timestamptz`

Recommended RLS policies (adjust to your requirements):

1. `profiles`: allow authenticated users to select and update their own row.
2. `quotes`: allow users to `select`, `insert`, and `update` where `auth.uid() = user_id`; grant admins a policy to access all rows.

Elevate a user to administrator by setting `profiles.role` to `admin`. Admins see every stored quote, while standard users see only their own data. All quote persistence now uses Supabase instead of `localStorage`.

Once signed in as an admin, use the **Manage Users** button on the dashboard to review all accounts and adjust roles directly from the UI.
