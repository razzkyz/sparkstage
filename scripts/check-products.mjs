import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://hogzjapnkvsihvvbgcdb.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhvZ3pqYXBua3ZzaWh2dmJnY2RiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyNzkyNTYsImV4cCI6MjA4Mzg1NTI1Nn0.R5aWWG8FY9lNlIh3FCKFWaz0zYkm78KyrbO_CA2Grlc'
);

async function check() {
  const { data, error } = await supabase
    .from('products')
    .select(`
      id,
      retail_categories!products_retail_category_id_fkey!inner(id, department)
    `)
    .eq('retail_categories.department', 'glam')
    .limit(1);
    
  console.log("Error:", error);
  console.log("Data:", data);
}

check();
