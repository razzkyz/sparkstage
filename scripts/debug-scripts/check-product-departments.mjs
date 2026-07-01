// Script diagnostik: cek distribusi VARIANT per department di Supabase
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://hogzjapnkvsihvvbgcdb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhvZ3pqYXBua3ZzaWh2dmJnY2RiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyNzkyNTYsImV4cCI6MjA4Mzg1NTI1Nn0.R5aWWG8FY9lNlIh3FCKFWaz0zYkm78KyrbO_CA2Grlc';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function main() {
  console.log('=== DISTRIBUSI VARIANT PER DEPARTMENT ===\n');

  // Ambil semua variant aktif beserta info department
  const { data: variants, error } = await supabase
    .from('product_variants')
    .select(`
      id,
      name,
      stock,
      is_active,
      products!inner(
        id,
        name,
        is_active,
        deleted_at,
        retail_categories!products_retail_category_id_fkey(department, name)
      )
    `)
    .eq('is_active', true)
    .is('products.deleted_at', null)
    .eq('products.is_active', true);

  if (error) {
    console.error('Error:', error.message);
    return;
  }

  console.log(`Total variant aktif: ${variants.length}\n`);

  const byDept = {};

  for (const v of variants) {
    const dept = v.products?.retail_categories?.department ?? '(NULL / Uncategorized)';
    const catName = v.products?.retail_categories?.name ?? '(no category)';

    if (!byDept[dept]) byDept[dept] = { totalVariants: 0, totalStock: 0, categories: {} };
    byDept[dept].totalVariants++;
    byDept[dept].totalStock += (v.stock || 0);

    if (!byDept[dept].categories[catName]) byDept[dept].categories[catName] = { variants: 0, stock: 0 };
    byDept[dept].categories[catName].variants++;
    byDept[dept].categories[catName].stock += (v.stock || 0);
  }

  console.log('=== PER DEPARTMENT (Variant Count) ===');
  for (const [dept, info] of Object.entries(byDept).sort((a, b) => b[1].totalVariants - a[1].totalVariants)) {
    console.log(`\n[${dept}]: ${info.totalVariants} variant, stok total: ${info.totalStock}`);
    for (const [cat, data] of Object.entries(info.categories).sort((a, b) => b[1].variants - a[1].variants)) {
      console.log(`  └─ ${cat}: ${data.variants} variant, stok: ${data.stock}`);
    }
  }
}

main().catch(console.error);
