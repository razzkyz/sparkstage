import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

// Function to authenticate as admin
async function test() {
  // First, we need to authenticate as admin to do the update
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'admin@sparkstage55.com',
    password: 'admin' // Or I can just try the query and see if it's an RLS issue or syntax issue
  });
  
  if (authError) {
    console.log("Auth Error:", authError.message);
  } else {
    console.log("Logged in!");
  }

  const { data, error } = await supabase
    .from('retail_categories')
    .update({ is_active: false })
    .eq('id', 21)
    .select();
    
  console.log('Error:', error);
  console.log('Data:', data);
}

test();
