import dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, key);

async function verify() {
  const { data } = await supabase
    .from('retail_categories')
    .select('id, department, name, slug')
    .order('id', { ascending: false })
    .limit(5);
  
  console.log("Last 5 categories:");
  data?.forEach(c => console.log(`  [${c.id}] dept=${c.department} name="${c.name}" slug="${c.slug}"`));
}

verify();
