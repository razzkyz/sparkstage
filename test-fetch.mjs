import fetch from 'node-fetch';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

async function test() {
  const res = await fetch(`${process.env.VITE_SUPABASE_URL}/rest/v1/retail_categories?id=eq.21`, {
    method: 'PATCH',
    headers: {
      'apikey': process.env.VITE_SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${process.env.VITE_SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({ is_active: false })
  });
  
  const text = await res.text();
  console.log('Status:', res.status);
  console.log('Body:', text);
}

test();
