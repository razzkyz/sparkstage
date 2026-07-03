// Temporary debug: Add this at the start of CharmBar component

useEffect(() => {
  console.log('=== CHARM BAR DEBUG ===');
  console.log('Total products:', products.length);
  console.log('Total categories:', categories.length);
  console.log('CharmBar categories:', charmBarCategories.length);
  console.log('Filtered products:', filteredProducts.length);
  
  // Sample first 3 products
  console.log('Sample products:', products.slice(0, 3).map(p => ({
    id: p.id,
    name: p.name,
    categorySlug: p.categorySlug,
    department: p.department,
    retail_category_id: p.retail_category_id
  })));
  
  // Sample charm bar products
  const charmSample = products.filter(p => {
    const charmBarSlugs = CHARM_BAR_CATEGORIES.filter((cat) => cat.isActive).map((cat) => cat.slug);
    return p.categorySlug && charmBarSlugs.includes(p.categorySlug);
  }).slice(0, 5);
  
  console.log('Charm bar products sample:', charmSample.map(p => ({
    id: p.id,
    name: p.name,
    categorySlug: p.categorySlug
  })));
}, [products, categories, charmBarCategories, filteredProducts]);
