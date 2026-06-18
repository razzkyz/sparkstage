import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

dotenv.config({ path: resolve(dirname(fileURLToPath(import.meta.url)), '../.env.local') });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function test() {
  const { data, error } = await supabase
    .from('product_retail')
    .select(`
      id,
      name,
      retail_category_id,
      retail_subcategory_id,
      retail_categories!retail_category_id(id, is_active),
      retail_subcategories:retail_categories!retail_subcategory_id(id, is_active)
    `)
    .limit(5);
    
  console.log('Error:', error);
  console.log('Data:', JSON.stringify(data, null, 2));
}

test();
