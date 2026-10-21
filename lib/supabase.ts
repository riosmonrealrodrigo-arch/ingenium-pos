import { createClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://cllrleatfeweyhbpyywo.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsbHJsZWF0ZmV3ZXloYnB5eXdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI1MjYzNDksImV4cCI6MjEwODEwMjM0OX0.Vp0-Z3tcq62qlQzH_h6TxBrx0TuiVMJ5L7qx2CxXiFs';

// Si la variable en Vercel apunta al proyecto viejo (xwonqnfinfcwlzfusiba) o no está definida, usar el proyecto oficial activo
const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabaseUrl = (envUrl && !envUrl.includes('xwonqnfinfcwlzfusiba') && envUrl.startsWith('http'))
  ? envUrl
  : DEFAULT_SUPABASE_URL;

const supabaseAnonKey = (envKey && !envKey.includes('sb_publishable') && envKey.length > 50)
  ? envKey
  : DEFAULT_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function getUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}
