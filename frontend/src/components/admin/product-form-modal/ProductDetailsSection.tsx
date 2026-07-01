import { useState, useEffect, useMemo } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { slugify } from '../../../utils/merchant';
import { useRetailCategories } from '../../../hooks/useRetailCategories';
import { RupiahPriceInput } from '../../RupiahPriceInput';
import type { ProductDraft } from './productFormModalTypes';

type ProductDetailsSectionProps = {
  draft: ProductDraft;
  slugTouched: boolean;
  setDraft: Dispatch<SetStateAction<ProductDraft>>;
  setSlugTouched: Dispatch<SetStateAction<boolean>>;
};

export function ProductDetailsSection({
  draft,
  slugTouched,
  setDraft,
  setSlugTouched,
}: ProductDetailsSectionProps) {

  const { categories: retailCategories } = useRetailCategories();

  // Track which product we last initialized for, to detect "form switched to new product"
  const [lastDraftId, setLastDraftId] = useState<number | null | undefined>(undefined);
  // Explicit department override — user manually selected a department
  const [departmentOverride, setDepartmentOverride] = useState<string | null>(null);

  // Derive the department from the current retail_category_id (source of truth from DB)
  const derivedDepartment = useMemo(() => {
    if (!draft.retail_category_id || retailCategories.length === 0) return '';
    const cat = retailCategories.find(c => c.id === draft.retail_category_id);
    return cat?.department ?? '';
  }, [draft.retail_category_id, retailCategories]);

  // When editing a different product, clear the override so we fall back to derived value
  useEffect(() => {
    const currentId = draft.id ?? null;
    if (lastDraftId !== currentId) {
      setLastDraftId(currentId);
      setDepartmentOverride(null);
    }
  }, [draft.id, lastDraftId]);

  // The effective department: override (user explicitly picked) or derived from DB value
  const selectedDepartment = departmentOverride !== null ? departmentOverride : derivedDepartment;

  const retailRootOptions = retailCategories.filter(c => !c.parent_id && c.department === selectedDepartment);
  const retailSubOptions = draft.retail_category_id
    ? retailCategories.filter(c => c.parent_id === draft.retail_category_id)
    : [];

  const handleDepartmentChange = (newDept: string) => {
    setDepartmentOverride(newDept);
    setDraft((current) => ({ ...current, retail_category_id: null, retail_subcategory_id: null }));
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-bold text-gray-600">Name</span>
          <input
            value={draft.name}
            onChange={(event) => {
              const name = event.target.value;
              setDraft((current) => ({
                ...current,
                name,
                slug: slugTouched ? current.slug : slugify(name),
              }));
            }}
            className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            placeholder="Product name"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-bold text-gray-600">Slug</span>
          <input
            value={draft.slug}
            onChange={(event) => {
              setSlugTouched(true);
              setDraft((current) => ({ ...current, slug: event.target.value }));
            }}
            className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            placeholder="product-slug"
          />
        </label>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-bold text-gray-600">Product SKU</span>
          <input
            value={draft.sku}
            onChange={(event) => {
              const newSku = event.target.value.toUpperCase();
              setDraft((current) => {
                const nextVariants = [...current.variants];
                if (nextVariants.length > 0) {
                  nextVariants[0] = { ...nextVariants[0], sku: newSku };
                }
                return { ...current, sku: newSku, variants: nextVariants };
              });
            }}
            className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            placeholder="PROD-001"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-bold text-gray-600">Base Price</span>
          <RupiahPriceInput
            value={draft.variants[0]?.price ?? ''}
            className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            onChange={(raw) => {
              setDraft((current) => {
                const nextVariants = [...current.variants];
                if (nextVariants.length > 0) {
                  nextVariants[0] = { ...nextVariants[0], price: raw };
                }
                return { ...current, variants: nextVariants };
              });
            }}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-bold text-gray-600">Base Stock</span>
          <input
            type="number"
            min="0"
            value={draft.variants[0]?.stock ?? 0}
            onChange={(event) => {
              const newStock = Number(event.target.value);
              setDraft((current) => {
                const nextVariants = [...current.variants];
                if (nextVariants.length > 0) {
                  nextVariants[0] = { ...nextVariants[0], stock: Number.isFinite(newStock) ? newStock : 0 };
                }
                return { ...current, variants: nextVariants };
              });
            }}
            className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </label>
      </div>

      {/* --- RETAIL CATEGORIES --- */}
      <div className="mt-2 flex flex-col gap-4 rounded-xl border border-blue-200 bg-blue-50/50 p-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-bold text-blue-800">Department</span>
            <select
              value={selectedDepartment}
              onChange={(event) => handleDepartmentChange(event.target.value)}
              className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Select department</option>
              <option value="glam">Glam</option>
              <option value="charmbar">Charmbar</option>
              <option value="sparkclub">Sparkclub</option>
              <option value="dressing">Dressing</option>
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-bold text-blue-800">Category</span>
            <select
              value={draft.retail_category_id ?? ''}
              onChange={(event) => {
                const val = event.target.value ? Number(event.target.value) : null;
                setDraft((current) => ({ ...current, retail_category_id: val, retail_subcategory_id: null }));
              }}
              disabled={!selectedDepartment}
              className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
            >
              <option value="">Select category</option>
              {retailRootOptions.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        {retailSubOptions.length > 0 && (
          <label className="flex flex-col gap-1">
            <span className="text-xs font-bold text-blue-800">Sub-Category</span>
            <select
              value={draft.retail_subcategory_id ?? ''}
              onChange={(event) => {
                const val = event.target.value ? Number(event.target.value) : null;
                setDraft((current) => ({ ...current, retail_subcategory_id: val }));
              }}
              className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Select subcategory</option>
              {retailSubOptions.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
        )}

        {/* Show current category breadcrumb when editing and department not changed yet */}
        {draft.id != null && derivedDepartment && departmentOverride === null && (
          <p className="text-xs text-blue-600">
            <span className="font-semibold">Kategori saat ini:</span>{' '}
            {derivedDepartment.charAt(0).toUpperCase() + derivedDepartment.slice(1)}
            {(() => {
              const cat = retailCategories.find(c => c.id === draft.retail_category_id);
              const sub = retailCategories.find(c => c.id === draft.retail_subcategory_id);
              return [cat?.name, sub?.name].filter(Boolean).map(n => ` › ${n}`).join('');
            })()}
          </p>
        )}
      </div>
      {/* --- END RETAIL CATEGORIES --- */}

      <label className="flex flex-col gap-1">
        <span className="text-xs font-bold text-gray-600">Description</span>
        <textarea
          value={draft.description}
          onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
          className="min-h-[96px] rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          placeholder="Optional description"
        />
      </label>

      <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
        <div>
          <p className="text-sm font-bold">Active</p>
          <p className="text-xs text-gray-600">Inactive products won't show on Shop page.</p>
        </div>
        <button
          type="button"
          onClick={() => setDraft((current) => ({ ...current, is_active: !current.is_active }))}
          className={`relative h-7 w-12 rounded-full transition-colors ${draft.is_active ? 'bg-primary' : 'bg-gray-100'}`}
        >
          <span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all ${draft.is_active ? 'left-6' : 'left-1'}`} />
        </button>
      </div>
    </div>
  );
}
