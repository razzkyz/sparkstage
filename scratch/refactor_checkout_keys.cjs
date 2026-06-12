const fs = require('fs');
const path = require('path');

function replaceInFile(filePath, replacements) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let original = content;
  for (const { search, replace } of replacements) {
    content = content.split(search).join(replace);
  }
  if (content !== original) {
    fs.writeFileSync(filePath, content);
    console.log(`Updated ${filePath}`);
  }
}

const checkoutTypesPath = path.join(__dirname, '..', 'frontend', 'src', 'pages', 'product-checkout', 'checkoutTypes.ts');
if (fs.existsSync(checkoutTypesPath)) {
  replaceInFile(checkoutTypesPath, [
    { search: 'product_variant_id', replace: 'retail_product_id' }
  ]);
}

const checkoutPricingPath = path.join(__dirname, '..', 'frontend', 'src', 'pages', 'product-checkout', 'checkoutPricing.ts');
if (fs.existsSync(checkoutPricingPath)) {
  replaceInFile(checkoutPricingPath, [
    { search: 'product_variant_id', replace: 'retail_product_id' }
  ]);
}

const useControllerPath = path.join(__dirname, '..', 'frontend', 'src', 'pages', 'product-checkout', 'useProductCheckoutController.ts');
if (fs.existsSync(useControllerPath)) {
  replaceInFile(useControllerPath, [
    { search: 'productVariantId: item.product_variant_id', replace: 'retailProductId: item.retail_product_id' },
    { search: 'item.product_variant_id', replace: 'item.retail_product_id' }
  ]);
}
