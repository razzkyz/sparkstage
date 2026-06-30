import * as XLSX from 'xlsx';
import type { InventoryProduct } from '../pages/admin/store-inventory/storeInventoryTypes';
import type { ProductDraft, ProductVariantDraft } from '../components/admin/product-form-modal/productFormModalTypes';
import type { CategoryOption } from '../components/admin/product-form-modal/productFormModalTypes';
import { supabase } from '../lib/supabase';

// ─── EXPORT: Stock Report ─────────────────────────────────────────────────────

export function exportStoreStockReportToExcel(products: InventoryProduct[]) {
  const rows: Record<string, unknown>[] = products.map((product) => ({
    product_name: product.name,
    sku: product.sku,
    category: product.category,
    is_active: product.is_active ? 'ya' : 'tidak',
    price_min: product.price_min,
    price_max: product.price_max,
    stock_available: product.stock_available,
    variant_count: product.variant_count,
  }));

  if (rows.length === 0) return;

  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = Object.keys(rows[0]).map((k) => ({ wch: Math.max(k.length + 2, 14) }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Stok Produk');
  const date = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `stock-report-${date}.xlsx`);
}

// ─── TEMPLATE ─────────────────────────────────────────────────────────────────

export async function downloadStoreProductTemplateExcel(categories: CategoryOption[] = [], retailCategories: CategoryOption[] = []) {
  let sample: any[] = [];

  try {
    const { data: dbProducts, error } = await supabase
      .from('products')
      .select(`
        name, slug, sku, description, is_active,
        categories (name),
        retail_categories!products_retail_category_id_fkey (name, department),
        sub_categories:retail_categories!products_retail_subcategory_id_fkey (name),
        product_variants (name, sku, price, stock, is_active)
      `)
      .is('deleted_at', null)
      .order('name', { ascending: true });

    if (!error && dbProducts && dbProducts.length > 0) {
      dbProducts.forEach((p: any) => {
        const departmentName = p.retail_categories?.department || '';
        const categoryName = p.retail_categories?.name || '';
        const subCategoryName = p.sub_categories?.name || '';
        const variants = Array.isArray(p.product_variants) 
          ? p.product_variants.filter((v: any) => v.is_active !== false)
          : [];
        
        if (variants.length > 0) {
          variants.forEach((v: any, index: number) => {
            sample.push({
              product_name: index === 0 ? p.name : '',
              slug: index === 0 ? (p.slug || '') : '',
              sku: index === 0 ? (p.sku || '') : '',
              description: index === 0 ? (p.description || '') : '',
              department: index === 0 ? departmentName : '',
              category: index === 0 ? categoryName : '',
              sub_category: index === 0 ? subCategoryName : '',
              is_active: index === 0 ? (p.is_active ? 'ya' : 'tidak') : '',
              variant_name: v.name,
              variant_sku: v.sku,
              price: v.price || 0,
              stock: v.stock || 0,
              size: '',
              color: '',
            });
          });
        } else {
          sample.push({
            product_name: p.name,
            slug: p.slug || '',
            sku: p.sku || '',
            description: p.description || '',
            department: departmentName,
            category: categoryName,
            sub_category: subCategoryName,
            is_active: p.is_active ? 'ya' : 'tidak',
            variant_name: 'Default',
            variant_sku: p.sku || '',
            price: 0,
            stock: 0,
            size: '',
            color: '',
          });
        }
      });
    }
  } catch (err) {
    console.error('Failed to fetch products for template', err);
  }

  if (sample.length === 0) {
    sample = [
      {
        product_name: 'Kaos Polos Hitam',
        slug: 'kaos-polos-hitam',
        sku: 'KPH-001',
        description: 'Kaos polos bahan katun combed',
        department: 'sparkclub',
        category: 'Apparel',
        sub_category: 't-shirts',
        is_active: 'ya',
        variant_name: 'Size S',
        variant_sku: 'KPH-S-001',
        price: 85000,
        stock: 10,
        size: 'S',
        color: 'Hitam',
      },
      {
        product_name: '',
        slug: '',
        sku: '',
        description: '',
        department: '',
        category: '',
        sub_category: '',
        is_active: '',
        variant_name: 'Size M',
        variant_sku: 'KPH-M-001',
        price: 85000,
        stock: 15,
        size: 'M',
        color: 'Hitam',
      },
      {
        product_name: 'Kacamata Retro',
        slug: 'kacamata-retro',
        sku: 'GLS-001',
        description: 'Kacamata gaya retro vintage',
        department: 'glam',
        category: 'GLASSES',
        sub_category: 'sunglasses',
        is_active: 'ya',
        variant_name: 'Hitam',
        variant_sku: 'CCO-30-001',
        price: 150000,
        stock: 5,
        size: '30',
        color: 'Olive',
      },
    ];
  }

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(sample);
  XLSX.utils.book_append_sheet(wb, ws, 'Template Import');

  const categoryData: { 'Nama Kategori': string; 'Tipe': string; 'Keterangan': string }[] = [];
  
  if (categories.length > 0) {
    categoryData.push({
      'Nama Kategori': 'sparkclub',
      'Tipe': 'Department',
      'Keterangan': 'Copy ke kolom department'
    }, {
      'Nama Kategori': 'glam',
      'Tipe': 'Department',
      'Keterangan': 'Copy ke kolom department'
    }, {
      'Nama Kategori': 'charmbar',
      'Tipe': 'Department',
      'Keterangan': 'Copy ke kolom department'
    }, {
      'Nama Kategori': 'dressing',
      'Tipe': 'Department',
      'Keterangan': 'Copy ke kolom department'
    });
  }

  if (retailCategories.length > 0) {
    retailCategories.forEach(c => {
      categoryData.push({
        'Nama Kategori': c.name,
        'Tipe': 'Category',
        'Keterangan': 'Copy ke kolom category'
      });
    });
  }

  if (categoryData.length > 0) {
    const wsCat = XLSX.utils.json_to_sheet(categoryData);
    XLSX.utils.book_append_sheet(wb, wsCat, 'Daftar Kategori');
  }

  XLSX.writeFile(wb, 'template-import-produk-store.xlsx');
}

// ─── PARSE IMPORT ─────────────────────────────────────────────────────────────

export function parseStoreProductsFromFile(file: File): Promise<ProductDraft[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Gagal membaca file'));
    reader.onload = (e) => {
      try {
        const content = e.target!.result;
        let wb: XLSX.WorkBook;

        if (typeof content === 'string' || file.name.toLowerCase().endsWith('.csv')) {
          wb = XLSX.read(content as string, { type: 'string', raw: false });
        } else {
          const data = new Uint8Array(content as ArrayBuffer);
          wb = XLSX.read(data, { type: 'array', raw: false });
        }

        const ws = wb.Sheets[wb.SheetNames[0]];
        const raw: Record<string, unknown>[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

        const products: ProductDraft[] = [];
        let currentProduct: ProductDraft | null = null;

        raw.forEach((row) => {
          const productName = String(row['product_name'] ?? '').trim();
          const variantSku = String(row['variant_sku'] ?? row['sku'] ?? '').trim();
          const variantName = String(row['variant_name'] ?? '').trim();

          if (productName) {
            currentProduct = {
              name: productName,
              slug: String(row['slug'] ?? '').trim() ||
                productName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
              description: String(row['description'] ?? '').trim(),
              category_id: null,
              category_name: String(row['department'] ?? row['kategori_utama'] ?? row['category_id'] ?? '').trim(),
              retail_category_id: null,
              retail_category_name: String(row['category'] ?? row['kategori_retail'] ?? '').trim(),
              retail_subcategory_id: null,
              retail_subcategory_name: String(row['sub_category'] ?? '').trim(),
              sku: String(row['sku'] ?? '').trim(),
              is_active: String(row['is_active'] ?? 'ya').trim().toLowerCase() !== 'tidak',
              variants: [],
            };
            products.push(currentProduct);
          }

          if (variantSku && currentProduct) {
            const variant: ProductVariantDraft = {
              name: variantName || 'Default',
              sku: variantSku,
              price: String(Number(row['price']) || 0),
              stock: Number(row['stock']) || 0,
              size: String(row['size'] ?? '').trim() || undefined,
              color: String(row['color'] ?? '').trim() || undefined,
            };
            currentProduct.variants.push(variant);
          }
        });

        for (const p of products) {
          if (p.variants.length === 0) {
            p.variants.push({
              name: 'Default',
              sku: p.sku || `${p.slug}-default`,
              price: '0',
              stock: 0,
            });
          }
        }

        if (products.length === 0) {
          throw new Error('Tidak ada produk valid di file. Pastikan kolom product_name tidak kosong.');
        }

        resolve(products);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        reject(new Error(`Gagal parse file: ${message}`));
      }
    };

    if (file.name.toLowerCase().endsWith('.csv')) {
      reader.readAsText(file, 'utf-8');
    } else {
      reader.readAsArrayBuffer(file);
    }
  });
}
