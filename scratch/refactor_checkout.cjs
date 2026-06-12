const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'supabase', 'functions', 'create-doku-retail-checkout', 'index.ts');
let content = fs.readFileSync(filePath, 'utf-8');

// Replace types
content = content.replace(/productVariantId/g, 'retailProductId');
content = content.replace(/variantId/g, 'retailProductId');

// Replace RPC calls
content = content.replace(/release_product_stock/g, 'release_retail_stock');
content = content.replace(/reserve_product_stock/g, 'reserve_retail_stock');

// Replace RPC params
content = content.replace(/p_variant_id/g, 'p_retail_id');

// Replace table names
content = content.replace(/"product_variants"/g, '"product_retail"');

// Replace columns
content = content.replace(/product_variant_id/g, 'retail_product_id');

// Other specific renames
content = content.replace(/variantRows/g, 'retailRows');
content = content.replace(/variantMap/g, 'retailMap');
content = content.replace(/variantIds/g, 'retailIds');
content = content.replace(/variantsError/g, 'retailsError');
content = content.replace(/aggregatedItemsByVariant/g, 'aggregatedItemsByRetail');
content = content.replace(/Variant not found/g, 'Retail product not found');
content = content.replace(/Variant inactive/g, 'Retail product inactive');

// The DB query for variants needs to be adjusted
// old: .select("id, price, stock, reserved_stock, is_active")
// new: product_retail does not have reserved_stock
content = content.replace(/.select\("id, price, stock, reserved_stock, is_active"\)/g, '.select("id, price, stock, is_active")');
content = content.replace(/reserved_stock: unknown;/g, '');
content = content.replace(/reserved_stock: unknown/g, '');

// minStockLevel calculation
content = content.replace(/const reserved = toNumber\([\s\S]*?reserved_stock[\s\S]*?0,[\s\S]*?\);[\s\S]*?const available = stock - reserved;/g, 'const available = stock;');

fs.writeFileSync(filePath, content);
console.log('Refactoring complete');
