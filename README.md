# MODX — Your Mods. Your Community.

A dark, responsive mod discovery and creator community by **ANI STUDIO**.

## Live features
- Mandatory email/password sign-up and sign-in (Supabase Auth)
- Authenticated mod catalogue with game filters and search
- Upload mod files to a private Supabase Storage bucket (50 MB limit)
- Download mods using short-lived signed URLs
- Like/unlike mods and view community like counts
- Comment on mod pages
- My Uploads page and owner-only delete
- Row Level Security policies protect records and storage uploads

## Stack
React + Vite, Supabase Auth, Postgres, Storage, GitHub Pages.

## Local development
```bash
npm install
npm run dev
```

## Supabase connection
The frontend uses the MODX-specific Supabase project and its **publishable** browser key in `src/supabase.js`. A publishable key is intended for browser use; never add a service-role or secret key to frontend code.

The MODX tables and private `modx-files` bucket have been created in the connected Supabase project. The database objects are prefixed `modx_` so they remain separate from other apps in that project. The schema reference is in `supabase/modx_schema.sql`.

In Supabase Dashboard → Authentication → URL Configuration:
- Set **Site URL** to `https://anirudhadebbarma031214-commits.github.io/MODX/`
- Add that same URL to **Redirect URLs**.

Keep email confirmation enabled if you want users to verify their email before signing in. Users may need to check their inbox after registration.

## Deployment
GitHub Actions builds the Vite app and publishes `dist` to GitHub Pages. The Vite base path is configured for the `/MODX/` repository URL.

## Safety
Only upload files you own or have permission to redistribute. Downloads are authenticated and served through expiring signed URLs. The frontend limits uploads to 50 MB and the supported mod extensions; scan files before installing them.

**Created by ANI STUDIO.**
