import type { CategoryOption } from '../../../components/admin/ProductFormModal';
import type { ActiveFilter, StockFilter, DepartmentFilter } from './storeInventoryTypes';

type InventoryToolbarProps = {
  resolvedTotalProducts: number;
  isFetching: boolean;
  categoryFilter: string;
  stockFilter: StockFilter;
  activeFilter: ActiveFilter;
  departmentFilter: DepartmentFilter;
  categoryOptions: CategoryOption[];
  onCategoryFilterChange: (value: string) => void;
  onStockFilterChange: (value: StockFilter) => void;
  onActiveFilterChange: (value: ActiveFilter) => void;
  onDepartmentFilterChange: (value: DepartmentFilter) => void;
};

export function InventoryToolbar(props: InventoryToolbarProps) {
  const {
    resolvedTotalProducts,
    isFetching,
    categoryFilter,
    stockFilter,
    activeFilter,
    departmentFilter,
    categoryOptions,
    onCategoryFilterChange,
    onStockFilterChange,
    onActiveFilterChange,
    onDepartmentFilterChange,
  } = props;

  return (
    <div className="flex flex-col gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
      {/* Row 1: Department Filter */}
      <div className="flex border-b border-gray-200">
        {(['all', 'glam', 'charmbar', 'sparkclub'] as DepartmentFilter[]).map((dept) => {
          const labels: Record<DepartmentFilter, string> = {
            all: 'All Departments',
            glam: 'Glam',
            charmbar: 'Charm Bar',
            sparkclub: 'Spark Club',
          };
          return (
            <button
              key={dept}
              onClick={() => onDepartmentFilterChange(dept)}
              className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-colors ${
                departmentFilter === dept
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {labels[dept]}
            </button>
          );
        })}
      </div>

      {/* Row 2: Stock Filter */}
      <div className="flex flex-wrap gap-2 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => onStockFilterChange('')}
          className={`px-4 py-1.5 rounded-md text-sm font-bold transition-colors ${stockFilter === '' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
        >
          All Stock
        </button>
        <button
          onClick={() => onStockFilterChange('in')}
          className={`px-4 py-1.5 rounded-md text-sm font-bold transition-colors ${stockFilter === 'in' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
        >
          In Stock
        </button>
        <button
          onClick={() => onStockFilterChange('low')}
          className={`px-4 py-1.5 rounded-md text-sm font-bold transition-colors ${stockFilter === 'low' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Low Stock
        </button>
        <button
          onClick={() => onStockFilterChange('out')}
          className={`px-4 py-1.5 rounded-md text-sm font-bold transition-colors ${stockFilter === 'out' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Out of Stock
        </button>
      </div>

      {/* Row 3: Additional Filters and Stats */}
      <div className="flex flex-col md:flex-row gap-3 justify-between items-start md:items-center">
        {/* Filter buttons */}
        <div className="flex flex-wrap gap-2 items-center">
          {/* Status Filter */}
          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => onActiveFilterChange('')}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-colors ${activeFilter === '' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
            >
              All Status
            </button>
            <button
              onClick={() => onActiveFilterChange('active')}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-colors ${activeFilter === 'active' ? 'bg-green-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              ✓ Active
            </button>
            <button
              onClick={() => onActiveFilterChange('inactive')}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-colors ${activeFilter === 'inactive' ? 'bg-red-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              ✕ Inactive
            </button>
          </div>

          {/* Category Filter */}
          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg items-center">
            <select
              className="bg-transparent text-xs font-bold text-gray-700 outline-none px-2 py-1 cursor-pointer"
              value={categoryFilter === 'uncategorized' ? '' : categoryFilter}
              onChange={(event) => onCategoryFilterChange(event.target.value)}
            >
              <option value="">All Categories</option>
              {categoryOptions.map((category) => (
                <option key={category.id} value={`rc-${category.id}`}>
                  {category.name}
                </option>
              ))}
            </select>
            <div className="w-px h-4 bg-gray-300 mx-1"></div>
            <button
              onClick={() => onCategoryFilterChange(categoryFilter === 'uncategorized' ? '' : 'uncategorized')}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-colors ${categoryFilter === 'uncategorized' ? 'bg-orange-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              ⚠ No Category
            </button>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            <span className="text-gray-600">Total Filtered:</span>
            <span className="font-bold text-gray-900">
              {resolvedTotalProducts} {isFetching && '...'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
