import { useDeferredValue, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

export function useShopFilters() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategory = searchParams.get('category') || 'all';
  const activeSubcategory = searchParams.get('subcategory') || 'all';
  const activeSubSubcategory = searchParams.get('subsubcategory') || 'all';
  const searchQueryParam = searchParams.get('q') || '';
  const [searchQuery, setSearchQuery] = useState(searchQueryParam);

  useEffect(() => {
    setSearchQuery(searchQueryParam);
  }, [searchQueryParam]);

  const updateFilters = (updates: Record<string, string | null>) => {
    console.log('📝 updateFilters called with:', updates);
    console.log('📝 Current searchParams:', Object.fromEntries(searchParams.entries()));
    
    setSearchParams((previous) => {
      const next = new URLSearchParams(previous);
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === 'all' || value === '') {
          console.log(`  ❌ Deleting param: ${key}`);
          next.delete(key);
        } else {
          console.log(`  ✅ Setting param: ${key} = ${value}`);
          next.set(key, value);
        }
      });
      console.log('📝 New searchParams:', Object.fromEntries(next.entries()));
      return next;
    }, { replace: true });
  };

  const deferredSearchQuery = useDeferredValue(searchQuery);
  const resultsResetSignal = `${activeCategory}:${activeSubcategory}:${activeSubSubcategory}:${deferredSearchQuery.trim().toLowerCase()}`;

  return {
    activeCategory,
    activeSubcategory,
    activeSubSubcategory,
    searchQuery,
    setSearchQuery,
    updateFilters,
    deferredSearchQuery,
    resultsResetSignal,
  };
}
