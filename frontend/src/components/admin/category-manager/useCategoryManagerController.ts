import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import {
  emptyCategoryDraft,
  getAllDescendants,
  getChildrenByParent,
  getOrphanChildren,
  getParentNameMap,
  getParentOptions,
  getParents,
  toCategoryDraft,
} from './categoryManagerHelpers';
import type { Category, CategoryDraft, CategoryManagerProps } from './categoryManagerTypes';

export function useCategoryManagerController({ isOpen, onUpdate }: Pick<CategoryManagerProps, 'isOpen' | 'onUpdate'>) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [expandedParents, setExpandedParents] = useState<number[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<'glam' | 'charmbar' | 'sparkclub' | 'dressing'>('glam');

  const [draft, setDraft] = useState<CategoryDraft>(() => {
    const d = emptyCategoryDraft();
    d.department = 'glam';
    return d;
  });
  const [slugTouched, setSlugTouched] = useState(false);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase.from('retail_categories').select('*').order('name', { ascending: true });
      if (fetchError) throw fetchError;
      setCategories(data || []);
    } catch (caughtError) {
      console.error('Error fetching categories:', caughtError);
      setError(caughtError instanceof Error ? caughtError.message : 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    void fetchCategories();
  }, [fetchCategories, isOpen]);

  const handleEdit = useCallback((category: Category) => {
    setEditingId(category.id);
    setDraft(toCategoryDraft(category));
    setSlugTouched(true);
    setError(null);
    setSuccess(null);
  }, []);

  const handleNew = useCallback((deptOverride?: typeof selectedDepartment) => {
    setEditingId(null);
    const emptyDraft = emptyCategoryDraft();
    emptyDraft.department = deptOverride ?? selectedDepartment;
    setDraft(emptyDraft);
    setSlugTouched(false);
    setError(null);
    setSuccess(null);
  }, [selectedDepartment]);

  const handleSave = useCallback(async () => {
    if (!draft.name.trim()) {
      setError('Category name is required');
      return;
    }
    if (!draft.slug.trim()) {
      setError('Category slug is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      if (draft.id) {
        const { error: updateError } = await supabase
          .from('retail_categories')
          .update({
            department: draft.department,
            name: draft.name,
            slug: draft.slug,
            is_active: draft.is_active,
            parent_id: draft.parent_id,
            // updated_at is not standard on retail_categories
          })
          .eq('id', draft.id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase.from('retail_categories').insert({
          department: draft.department,
          name: draft.name,
          slug: draft.slug,
          is_active: draft.is_active,
          parent_id: draft.parent_id,
        });
        if (insertError) throw insertError;
      }

      await fetchCategories();
      onUpdate();
      setEditingId(null);

      // Use draft.department (not selectedDepartment) to avoid stale closure
      const newDraft = emptyCategoryDraft();
      newDraft.department = draft.department;
      setDraft(newDraft);

      setSlugTouched(false);
      setSuccess('Category saved successfully!');
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Failed to save category');
    } finally {
      setLoading(false);
    }
  }, [draft, fetchCategories, onUpdate]);

  const handleDelete = useCallback(
    async (id: number) => {
      try {
        setLoading(true);
        setError(null);

        // Check if there are products using this category
        const { count, error: countError } = await supabase
          .from('products')
          .select('id', { count: 'exact', head: true })
          .or(`retail_category_id.eq.${id},retail_subcategory_id.eq.${id}`)
          .is('deleted_at', null);

        if (countError) throw countError;

        const hasProducts = (count ?? 0) > 0;
        const confirmMessage = hasProducts
          ? `AWAS: Ada ${count} produk di kategori ini. Menghapus kategori ini akan ikut MENGHAPUS SEMUA produk tersebut secara PERMANEN. Sebaiknya pindahkan produk ke kategori lain dulu.\n\nTetap hapus?`
          : 'Hapus kategori ini?';

        if (!confirm(confirmMessage)) {
          setLoading(false);
          return;
        }

        const { error: deleteError } = await supabase.from('retail_categories').delete().eq('id', id);
        if (deleteError) throw deleteError;

        await fetchCategories();
        onUpdate();
      } catch (caughtError) {
        console.error('Error deleting category:', caughtError);
        setError(caughtError instanceof Error ? caughtError.message : 'Failed to delete category');
      } finally {
        setLoading(false);
      }
    },
    [fetchCategories, onUpdate]
  );

  const handleToggleActive = useCallback(
    async (id: number, newStatus?: boolean) => {
      try {
        setLoading(true);
        setError(null);

        const category = categories.find((c) => c.id === id);
        if (!category) throw new Error('Category not found');

        const resolvedStatus = newStatus !== undefined ? newStatus : !category.is_active;
        const descendants = getAllDescendants(id, categories);
        const allAffectedIds = [id, ...descendants];

        // Update all affected categories (parent and descendants)
        const { error: updateError } = await supabase
          .from('retail_categories')
          .update({
            is_active: resolvedStatus,
          })
          .in('id', allAffectedIds);

        if (updateError) throw updateError;

        // Also update all products in these categories to match the new status
        const { error: productUpdateError } = await supabase
          .from('products')
          .update({
            is_active: resolvedStatus,
            updated_at: new Date().toISOString(),
          })
          .or(`retail_category_id.in.(${allAffectedIds.join(',')}),retail_subcategory_id.in.(${allAffectedIds.join(',')})`)
          .is('deleted_at', null); // Only update non-deleted products

        if (productUpdateError) throw productUpdateError;

        await fetchCategories();
        onUpdate();
      } catch (caughtError) {
        console.error('Error toggling category status:', caughtError);
        setError(caughtError instanceof Error ? caughtError.message : 'Failed to toggle category status');
      } finally {
        setLoading(false);
      }
    },
    [categories, fetchCategories, onUpdate]
  );

  const filteredCategories = useMemo(() => {
    return categories.filter((c) => c.department === selectedDepartment);
  }, [categories, selectedDepartment]);

  const parentOptions = useMemo(() => getParentOptions(filteredCategories, editingId), [filteredCategories, editingId]);
  const parents = useMemo(() => getParents(filteredCategories), [filteredCategories]);
  const childrenByParent = useMemo(() => getChildrenByParent(filteredCategories), [filteredCategories]);
  const orphanChildren = useMemo(() => getOrphanChildren(filteredCategories), [filteredCategories]);
  const parentNameMap = useMemo(() => getParentNameMap(categories), [categories]);

  useEffect(() => {
    if (!editingId) return;
    const editing = categories.find((category) => category.id === editingId);
    if (!editing) return;
    const parentId = editing.parent_id ?? editing.id;
    setExpandedParents((current) => (current.includes(parentId) ? current : [...current, parentId]));
  }, [categories, editingId]);

  const toggleExpanded = useCallback((parentId: number) => {
    setExpandedParents((current) => (current.includes(parentId) ? current.filter((id) => id !== parentId) : [...current, parentId]));
  }, []);

  return {
    categories: filteredCategories,
    selectedDepartment,
    setSelectedDepartment,
    loading,
    editingId,
    draft,
    slugTouched,
    error,
    success,
    expandedParents,
    setDraft,
    setSlugTouched,
    handleEdit,
    handleNew,
    handleSave,
    handleDelete,
    handleToggleActive,
    toggleExpanded,
    parentOptions,
    parents,
    childrenByParent,
    orphanChildren,
    parentNameMap,
  };
}
