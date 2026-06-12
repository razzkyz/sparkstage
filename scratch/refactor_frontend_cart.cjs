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

const files = [
  'contexts/cartStore.ts',
  'contexts/CartContext.tsx',
  'pages/CartPage.tsx',
  'pages/ProductCheckoutPage.tsx',
  'pages/product-checkout/useProductCheckoutController.ts',
  'pages/product-checkout/checkoutPricing.ts',
  'pages/RetailShopPage.tsx',
  'pages/RetailProductDetailPage.tsx',
  'pages/BeautyPage.tsx',
  'pages/SparkClub.tsx',
  'pages/OnStage.tsx',
  'pages/CharmBar.tsx',
  'pages/BeautyPosterPage.tsx',
  'components/ProductQuickViewModal.tsx'
];

files.forEach(f => {
  const p = path.join(__dirname, '..', 'frontend', 'src', f);
  if (fs.existsSync(p)) {
    replaceInFile(p, [
      { search: 'variantId:', replace: 'retailProductId:' },
      { search: 'variantId,', replace: 'retailProductId,' },
      { search: 'variantId}', replace: 'retailProductId}' },
      { search: 'variantId }', replace: 'retailProductId }' },
      { search: 'variantId ===', replace: 'retailProductId ===' },
      { search: '.variantId', replace: '.retailProductId' },
      { search: 'removeCartItem(variantId)', replace: 'removeCartItem(retailProductId)' },
      { search: '(variantId)', replace: '(retailProductId)' },
      { search: '(variantId:', replace: '(retailProductId:' },
      { search: 'variantIds', replace: 'retailProductIds' },
      // Update create-doku-product-checkout -> create-doku-retail-checkout in useProductCheckoutController
      { search: "'create-doku-product-checkout'", replace: "'create-doku-retail-checkout'" },
      { search: "createOrder('create-doku-product-checkout')", replace: "createOrder('create-doku-retail-checkout')" },
    ]);
  }
});
