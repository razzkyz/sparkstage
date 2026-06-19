import type { Product } from '../../hooks/useProducts';
import {
  filterBestSellerCharmProducts,
  filterGoldCharmProducts,
  filterNewestCharmProducts,
  filterSilverCharmProducts,
  rankAllProducts,
} from './shopFilterConfig';

export type FilterShopProductsArgs = {
  products: Product[];
  activeCategory: string;
  activeSubcategory: string;
  activeSubSubcategory: string;
  searchQuery: string;
  allowedSlugMap: Map<string, Set<string>>;
  bestSellerIds: number[];
};

export function filterShopProducts({
  products,
  activeCategory,
  activeSubcategory,
  activeSubSubcategory,
  searchQuery,
  allowedSlugMap,
  bestSellerIds,
}: FilterShopProductsArgs) {
  let currentProducts = products;

  console.log('🎯 FILTER FUNCTION INPUT:', {
    activeCategory,
    activeSubcategory,
    activeSubSubcategory,
    totalProducts: products.length,
  });

  if (activeCategory !== 'all') {
    if (activeCategory === 'charm' && activeSubcategory === 'gold-group') {
      currentProducts = filterGoldCharmProducts(products);
    } else if (activeCategory === 'charm' && activeSubcategory === 'silver-group') {
      currentProducts = filterSilverCharmProducts(products);
    } else if (activeCategory === 'charm' && activeSubcategory === 'newest-group') {
      currentProducts = filterNewestCharmProducts(products, allowedSlugMap.get('charm'));
    } else if (activeCategory === 'charm' && activeSubcategory === 'bestseller-group') {
      currentProducts = filterBestSellerCharmProducts(products, new Set(bestSellerIds));
    } else {
      // Determine the active filtering node
      if (activeSubSubcategory !== 'all') {
        // Most specific: filter by sub-subcategory (exact match only)
        console.log('📌 Filtering by SUB-SUBCATEGORY:', activeSubSubcategory);
        currentProducts = products.filter((product) => product.categorySlug === activeSubSubcategory);
      } else if (activeSubcategory !== 'all') {
        // Filter by subcategory (exact match only)
        console.log('📌 Filtering by SUBCATEGORY:', activeSubcategory);
        currentProducts = products.filter((product) => {
          const matches = product.categorySlug === activeSubcategory;
          if (matches) {
            console.log('  ✓ Match:', product.name, '→', product.categorySlug);
          }
          return matches;
        });
        console.log(`  → Found ${currentProducts.length} products with categorySlug = "${activeSubcategory}"`);
      } else {
        // Filter by category: show all products from this category AND its subcategories
        console.log('📌 Filtering by CATEGORY:', activeCategory);
        const allowedSlugs = allowedSlugMap.get(activeCategory);
        console.log('  → Allowed slugs:', Array.from(allowedSlugs || []));
        if (allowedSlugs) {
          currentProducts = products.filter((product) => product.categorySlug && allowedSlugs.has(product.categorySlug));
        } else {
          // Fallback: exact match only
          currentProducts = products.filter((product) => product.categorySlug === activeCategory);
        }
        console.log(`  → Found ${currentProducts.length} products`);
      }
    }
  }

  const normalizedSearch = searchQuery.toLowerCase().trim();
  if (normalizedSearch) {
    currentProducts = currentProducts.filter(
      (product) =>
        product.name.toLowerCase().includes(normalizedSearch) ||
        (product.description && product.description.toLowerCase().includes(normalizedSearch))
    );
  }

  if (activeCategory === 'all') {
    const makeupSlugs = allowedSlugMap.get('makeup') ?? new Set<string>();
    return rankAllProducts(currentProducts, makeupSlugs);
  }

  console.log('🎯 FILTER FUNCTION OUTPUT:', currentProducts.length, 'products');
  return currentProducts;
}
