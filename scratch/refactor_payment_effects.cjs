const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'supabase', 'functions', '_shared', 'payment-effects.ts');
let content = fs.readFileSync(filePath, 'utf-8');

// 1. In releaseProductReservedStockIfNeeded, replace select
const select1Target = `        .select('product_variant_id, quantity')
        .eq('order_product_id', order.id)`;
const select1Replace = `        .select('product_variant_id, retail_product_id, quantity')
        .eq('order_product_id', order.id)`;
content = content.replace(select1Target, select1Replace);

// 2. Add isRetailOrder logic in releaseProductReservedStockIfNeeded
const releaseLogicTarget = `      const qtyByVariantId = new Map<number, number>()
      for (const row of orderItems as ProductOrderItem[]) {`;
const releaseLogicReplace = `      const isRetailOrder = Boolean((orderItems as any[])[0]?.retail_product_id)

      if (isRetailOrder) {
        for (const row of orderItems as any[]) {
          const retailId = Number(row.retail_product_id)
          const qty = Math.max(1, Math.floor(Number(row.quantity)))
          if (!retailId || qty <= 0) continue

          const { data: released, error: releaseError } = await supabase.rpc('release_retail_stock', {
            p_retail_id: retailId,
            p_quantity: qty,
          })

          if (releaseError || released !== true) {
            throw new Error(releaseError?.message ?? \`Failed to release stock for retail product \${retailId}\`)
          }
        }
      } else {
      const qtyByVariantId = new Map<number, number>()
      for (const row of orderItems as ProductOrderItem[]) {`;
content = content.replace(releaseLogicTarget, releaseLogicReplace);

// 3. Close the else block specifically in releaseProductReservedStockIfNeeded
// We look for where it marks the stock as released.
const closeElseTarget = `      const { error: markReleasedError } = await supabase
        .from('order_products')
        .update({ stock_released_at: nowIso, updated_at: nowIso })
        .eq('id', order.id)`;
const closeElseReplace = `      } // end else block for isRetailOrder

      const { error: markReleasedError } = await supabase
        .from('order_products')
        .update({ stock_released_at: nowIso, updated_at: nowIso })
        .eq('id', order.id)`;
content = content.replace(closeElseTarget, closeElseReplace);

// 4. Update ensureProductPaidSideEffects select query
const select2Target = `        .from('order_product_items')
        .select('product_variant_id, quantity')
        .eq('order_product_id', order.id)`;
const select2Replace = `        .from('order_product_items')
        .select('product_variant_id, retail_product_id, quantity')
        .eq('order_product_id', order.id)`;
content = content.replace(select2Target, select2Replace);

// 5. Update stockValidationFailed to skip if it's retail
const stockValTarget = `      let stockValidationFailed = false
      const stockIssues: string[] = []

      if (Array.isArray(orderItems)) {
        const variantIds = Array.from`;
const stockValReplace = `      let stockValidationFailed = false
      const stockIssues: string[] = []

      const isRetailOrder = Array.isArray(orderItems) && orderItems.length > 0 && Boolean((orderItems[0] as any).retail_product_id);

      if (Array.isArray(orderItems) && !isRetailOrder) {
        const variantIds = Array.from`;
content = content.replace(stockValTarget, stockValReplace);


fs.writeFileSync(filePath, content);
console.log('Payment-effects refactored cleanly');
