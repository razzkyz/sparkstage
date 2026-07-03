export type InventoryProduct = {
  id: number;
  name: string;
  sku: string;
  is_active: boolean;
  category: string;
  category_slug?: string;
  department?: string;
  retail_category_name?: string;
  sub_category?: string;
  stock_available: number;
  stock_status: 'good' | 'ok' | 'low' | 'out';
  price_min: number;
  price_max: number;
  variant_count: number;
  image_url?: string | null;
  image_url_original?: string | null;
};

export type StockFilter = '' | 'in' | 'low' | 'out';
export type ActiveFilter = '' | 'active' | 'inactive';
export type DepartmentFilter = 'all' | 'glam' | 'charmbar' | 'sparkclub' | 'dressing' | 'shop';

export type DeletingProduct = {
  id: number;
  name: string;
};
