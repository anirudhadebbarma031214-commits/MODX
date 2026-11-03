# MODX — Your Mods. Your Community.

A dark, futuristic mod discovery and creator-community frontend by **ANI STUDIO**.

## Run locally
```bash
npm install
npm run dev
``

## Build
```bash
npm run build
``

## Deploy to Vercel
Import this GitHub repository into Vercel. Framework preset: **Vite**. Build command: `npm run build`. Output directory: `dist`.

## Current status
The first UI foundation includes mod discovery cards, search, game filters, sorting, favorites, mod detail dialogs, and an upload form preview.

The current mod catalogue is sample data. Authentication, persistent community uploads, real file downloads, ratings, comments, and user profiles require Supabase project configuration and database/storage setup. Do not treat the sample download buttons as real downloads.

## Supabase setup (next phase)
Create a Supabase project, then configure Vite environment variables:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Never put a Supabase service-role key in frontend code. Use Row Level Security and validate uploaded files server-side or through trusted policies/functions.

**Created by ANI STUDIO.**
