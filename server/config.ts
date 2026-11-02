import 'dotenv/config';
import path from 'path';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const WORKSPACE_ROOT = process.cwd();
export const PORT = Number(process.env.PORT) || 3000;

export const SUPABASE_URL = process.env.SUPABASE_URL || '';
export const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

export const supabase: SupabaseClient | null =
  SUPABASE_URL && SUPABASE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: { persistSession: false },
      })
    : null;

export const ML_PIPELINE_SCRIPT = process.env.ML_PIPELINE_SCRIPT
  ? path.resolve(WORKSPACE_ROOT, process.env.ML_PIPELINE_SCRIPT)
  : path.resolve(WORKSPACE_ROOT, '..', 'CP - MACHINE LEARNING', 'run_goldy_pipeline.py');
