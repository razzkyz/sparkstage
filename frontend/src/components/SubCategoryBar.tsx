type SubCategory = {
  id: number;
  name: string;
  slug: string;
};

type SubCategoryBarProps = {
  subcategories: SubCategory[];
  activeSlug: string;
  onSelectSubcategory: (slug: string | null) => void;
  allButtonLabel?: string;
  className?: string;
};

export function SubCategoryBar({
  subcategories,
  activeSlug,
  onSelectSubcategory,
  allButtonLabel = 'All',
  className = '',
}: SubCategoryBarProps) {
  return (
    <div className={`relative ${className}`}>
      <div className="flex items-center justify-center">
        <div className="flex gap-2 flex-wrap justify-center px-4">
          <button
            type="button"
            onClick={() => onSelectSubcategory(null)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
              activeSlug === 'all'
                ? 'bg-[#ff4b86] text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {allButtonLabel}
          </button>
          {subcategories.map((subcategory) => (
            <button
              key={subcategory.id}
              type="button"
              onClick={() => onSelectSubcategory(subcategory.slug)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                activeSlug === subcategory.slug
                  ? 'bg-[#ff4b86] text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {subcategory.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
