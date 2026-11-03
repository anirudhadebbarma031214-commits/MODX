import { createClient } from '@supabase/supabase-js';

// Publishable browser key: safe to expose. Never use a service_role key here.
export const supabase = createClient(
  'https://xocizxszrqiexfxculsa.supabase.co',
  'sb_publishable_kkoFxldELeXQCUXTYpr_Qg_mejrPEyD',
  { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }
);
