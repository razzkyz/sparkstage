import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import AdminLayout from '../../components/AdminLayout';
import { ADMIN_MENU_ITEMS, CASHIER_MENU_SECTIONS } from '../../constants/adminMenu';
import { getMenuSectionsByRole } from '../../utils/auth';
import { useCategorySalesStats, type CategorySalesStat, type ProductSaleItem } from '../../hooks/useCategorySalesStats';
import { useToast } from '../../components/Toast';
import { LazyMotion, m, AnimatePresence } from 'framer-motion';
import { formatCurrency } from '../../utils/formatters';
import { toLocalDateString, nowWIB } from '../../utils/timezone';
import type { AdminMenuSection } from '../../components/AdminLayout';

// ─── Constants ───────────────────────────────────────────────────────────────

const DEPT_LABELS: Record<string, string> = {
  glam: '💄 GLAM',
  charmbar: '💎 Charm Bar',
  shop: '🛍️ Shop',
  service: '✂️ Service',
  sparkclub: '⭐ SparkClub',
};

const DEPT_COLORS: Record<string, { badge: string; header: string }> = {
  glam: { badge: 'bg-pink-100 text-pink-700', header: 'bg-pink-50 border-pink-200' },
  charmbar: { badge: 'bg-purple-100 text-purple-700', header: 'bg-purple-50 border-purple-200' },
  shop: { badge: 'bg-blue-100 text-blue-700', header: 'bg-blue-50 border-blue-200' },
  service: { badge: 'bg-emerald-100 text-emerald-700', header: 'bg-emerald-50 border-emerald-200' },
  sparkclub: { badge: 'bg-amber-100 text-amber-700', header: 'bg-amber-50 border-amber-200' },
};
const DEFAULT_COLOR = { badge: 'bg-gray-100 text-gray-600', header: 'bg-gray-50 border-gray-200' };
const getDeptColor = (dept: string) => DEPT_COLORS[dept] ?? DEFAULT_COLOR;

/** Format YYYY-MM-DD -> DD Bulan YYYY */
const formatDateID = (dateStr: string) =>
  new Date(dateStr + 'T12:00:00').toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

// ─── Detail Drawer ─────────────────────────────────────────────────────────────

type DetailDrawerProps = {
  category: CategorySalesStat | null;
  products: ProductSaleItem[];
  dateRangeLabel: string;
  onClose: () => void;
};

const DetailDrawer = ({ category, products, dateRangeLabel, onClose }: DetailDrawerProps) => {
  const color = category ? getDeptColor(category.department) : DEFAULT_COLOR;
  const deptLabel = category ? (DEPT_LABELS[category.department] ?? category.department) : '';

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  if (!category) return null;

  return (
    <>
      {/* Backdrop */}
      <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 bg-black/40 z-40"
        onClick={onClose}
      />

      {/* Drawer panel */}
      <m.aside
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        className="fixed right-0 top-0 h-full w-full max-w-md z-50 flex flex-col bg-white shadow-2xl"
      >
        {/* Header */}
        <div className={`flex-none border-b ${color.header} px-5 py-4`}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-bold ${color.badge}`}>
                  {deptLabel}
                </span>
              </div>
              <h2 className="text-lg font-black text-gray-900 leading-tight truncate">
                {category.categoryName}
              </h2>
              <p className="text-xs text-gray-500 mt-1">{dateRangeLabel}</p>
            </div>
            <button
              onClick={onClose}
              className="flex-shrink-0 rounded-lg p-1.5 text-gray-400 hover:text-gray-700 hover:bg-white/80 transition-colors"
              aria-label="Tutup"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>

          {/* Summary stats */}
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="rounded-lg bg-white border border-gray-200 px-3 py-2.5">
              <p className="text-xs text-gray-500">Total Qty</p>
              <p className="text-xl font-black text-gray-900 mt-0.5">
                {category.qtySold.toLocaleString('id-ID')}
              </p>
            </div>
            <div className="rounded-lg bg-white border border-gray-200 px-3 py-2.5">
              <p className="text-xs text-gray-500">Total Revenue</p>
              <p className="text-lg font-black text-[#ff4b86] mt-0.5 leading-tight">
                Rp {formatCurrency(category.revenue)}
              </p>
            </div>
          </div>
        </div>

        {/* Product list */}
        <div className="flex-1 overflow-y-auto">
          {products.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-center px-6">
              <span className="material-symbols-outlined text-4xl text-gray-300 mb-2">inventory_2</span>
              <p className="text-sm text-gray-500">Tidak ada detail produk</p>
            </div>
          ) : (
            <>
              {/* Table header */}
              <div className="sticky top-0 bg-gray-50 border-b border-gray-100 grid grid-cols-[1fr_auto_auto] gap-2 px-5 py-2.5 text-xs font-bold text-gray-500 uppercase tracking-wide">
                <span>Produk / Varian</span>
                <span className="text-right">Qty</span>
                <span className="text-right w-28">Revenue (Rp)</span>
              </div>

              {/* Product rows */}
              <div className="divide-y divide-gray-50">
                {products.map((item, idx) => (
                  <m.div
                    key={`${item.variantId ?? idx}`}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18, delay: idx * 0.03 }}
                    className="grid grid-cols-[1fr_auto_auto] gap-2 items-center px-5 py-3.5 hover:bg-gray-50 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 text-sm leading-snug truncate">
                        {item.productName}
                      </p>
                      {item.variantName && (
                        <p className="text-xs text-gray-500 truncate mt-0.5">{item.variantName}</p>
                      )}
                      {item.sku && (
                        <p className="text-[10px] text-gray-400 font-mono mt-0.5">{item.sku}</p>
                      )}
                    </div>
                    <span className="text-sm font-bold text-gray-700 tabular-nums text-right">
                      {item.qtySold.toLocaleString('id-ID')}
                    </span>
                    <span className="text-sm font-black text-[#ff4b86] tabular-nums text-right w-28">
                      {formatCurrency(item.revenue)}
                    </span>
                  </m.div>
                ))}
              </div>

              {/* Total footer */}
              <div className="sticky bottom-0 bg-gray-50 border-t-2 border-gray-200 grid grid-cols-[1fr_auto_auto] gap-2 items-center px-5 py-3">
                <span className="text-sm font-black text-gray-900">TOTAL</span>
                <span className="text-sm font-black text-gray-900 tabular-nums text-right">
                  {category.qtySold.toLocaleString('id-ID')}
                </span>
                <span className="text-sm font-black text-[#ff4b86] tabular-nums text-right w-28">
                  {formatCurrency(category.revenue)}
                </span>
              </div>
            </>
          )}
        </div>
      </m.aside>
    </>
  );
};

// ─── Main Page ─────────────────────────────────────────────────────────────────

const CategorySalesPage = () => {
  const { user, signOut } = useAuth();
  const { showToast } = useToast();

  const todayKey = toLocalDateString(nowWIB());
  const [startDate, setStartDate] = useState(todayKey);
  const [endDate, setEndDate] = useState(todayKey);

  const { data: stats, error, isLoading, refetch, isFetching } = useCategorySalesStats({
    startDate,
    endDate,
  });

  const [menuSections, setMenuSections] = useState<AdminMenuSection[]>(CASHIER_MENU_SECTIONS);
  const [selectedCategory, setSelectedCategory] = useState<CategorySalesStat | null>(null);

  useEffect(() => {
    const loadMenuSections = async () => {
      const sections = await getMenuSectionsByRole(user?.id);
      setMenuSections(sections);
    };
    loadMenuSections();
  }, [user?.id]);

  useEffect(() => {
    if (error) {
      showToast('error', error instanceof Error ? error.message : 'Gagal memuat data penjualan');
    }
  }, [error, showToast]);

  const handleStartDateChange = (value: string) => {
    setStartDate(value);
    if (endDate < value) setEndDate(value);
  };
  const handleEndDateChange = (value: string) => {
    setEndDate(value);
    if (startDate > value) setStartDate(value);
  };
  const handleSetToday = () => { setStartDate(todayKey); setEndDate(todayKey); };
  const handleCloseDrawer = useCallback(() => setSelectedCategory(null), []);

  const isToday = startDate === todayKey && endDate === todayKey;
  const dateRangeLabel =
    startDate === endDate
      ? formatDateID(startDate)
      : `${formatDateID(startDate)} — ${formatDateID(endDate)}`;

  const getProductItems = (cat: CategorySalesStat): ProductSaleItem[] => {
    if (!stats) return [];
    const key = String(cat.categoryId ?? 'null');
    return stats.productItemsByCategory[key] ?? [];
  };

  return (
    <AdminLayout
      menuItems={ADMIN_MENU_ITEMS}
      menuSections={menuSections}
      defaultActiveMenuId="category-sales"
      title="Penjualan per Kategori"
      subtitle="Penjualan produk dikelompokkan per kategori"
      onLogout={signOut}
    >
      <LazyMotion features={() => import('framer-motion').then((mod) => mod.domAnimation)}>

        {/* Date Range Picker */}
        <m.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="rounded-xl border border-gray-200 bg-white p-4 md:p-6"
        >
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="material-symbols-outlined text-gray-400 text-xl">calendar_month</span>
              <span className="text-sm font-bold text-gray-700">Rentang Tanggal</span>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
              <div className="flex items-center gap-2 flex-1">
                <label className="text-xs text-gray-500 font-medium w-6 flex-shrink-0">Dari</label>
                <input
                  type="date"
                  value={startDate}
                  max={todayKey}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                  className="flex-1 min-w-0 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-900 focus:border-[#ff4b86] focus:ring-1 focus:ring-[#ff4b86] focus:bg-white outline-none transition-all"
                />
              </div>
              <div className="hidden sm:flex items-center text-gray-400">
                <span className="material-symbols-outlined text-lg">arrow_forward</span>
              </div>
              <div className="flex items-center gap-2 flex-1">
                <label className="text-xs text-gray-500 font-medium w-6 flex-shrink-0">S/d</label>
                <input
                  type="date"
                  value={endDate}
                  min={startDate}
                  max={todayKey}
                  onChange={(e) => handleEndDateChange(e.target.value)}
                  className="flex-1 min-w-0 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-900 focus:border-[#ff4b86] focus:ring-1 focus:ring-[#ff4b86] focus:bg-white outline-none transition-all"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {!isToday && (
                <button
                  onClick={handleSetToday}
                  className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">today</span>
                  Hari ini
                </button>
              )}
              <button
                onClick={() => void refetch()}
                disabled={isFetching}
                className="flex items-center gap-1.5 rounded-lg bg-[#ff4b86] px-4 py-2 text-xs font-bold text-white hover:bg-[#e63d75] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <span className={`material-symbols-outlined text-sm ${isFetching ? 'animate-spin' : ''}`}>
                  {isFetching ? 'progress_activity' : 'search'}
                </span>
                {isFetching ? 'Memuat...' : 'Tampilkan'}
              </button>
            </div>
          </div>

          {!isFetching && (
            <p className="mt-3 text-xs text-gray-400 flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">info</span>
              Menampilkan data:{' '}
              <span className="font-semibold text-gray-600 ml-1">{dateRangeLabel}</span>
            </p>
          )}
        </m.div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {isLoading
            ? [0, 1].map((i) => (
                <div key={i} className="h-24 rounded-xl border border-gray-200 bg-white animate-pulse" />
              ))
            : [
                {
                  label: '📦 Total Item Terjual',
                  value: stats?.totalQty ?? 0,
                  sub: `${stats?.rows.length ?? 0} kategori aktif`,
                  color: 'bg-blue-50 border-blue-200',
                  textColor: 'text-blue-700',
                },
                {
                  label: '💰 Total Revenue',
                  value: `Rp ${formatCurrency(stats?.totalRevenue ?? 0)}`,
                  sub: dateRangeLabel,
                  color: 'bg-emerald-50 border-emerald-200',
                  textColor: 'text-emerald-700',
                },
              ].map((card, i) => (
                <m.div
                  key={card.label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  className={`rounded-xl border ${card.color} bg-white p-5`}
                >
                  <p className={`text-sm ${card.textColor} mb-1`}>{card.label}</p>
                  <p className="text-2xl md:text-3xl font-black text-gray-900">{card.value}</p>
                  <p className={`text-xs ${card.textColor} mt-2 truncate`}>{card.sub}</p>
                </m.div>
              ))}
        </div>

        {/* Category Table */}
        <m.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className="rounded-xl border border-gray-200 bg-white overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-base font-black text-gray-900">🗂️ Rincian per Kategori</h3>
            {!isLoading && stats && stats.rows.length > 0 && (
              <span className="text-xs text-gray-400">
                Klik baris untuk detail produk
              </span>
            )}
          </div>

          {isLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : !stats || stats.rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-6">
              <span className="material-symbols-outlined text-5xl text-gray-300 mb-3">storefront</span>
              <p className="text-base font-bold text-gray-500">Tidak ada penjualan</p>
              <p className="text-sm text-gray-400 mt-1">
                Tidak ada produk terjual pada {dateRangeLabel}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left py-3 px-4 md:px-6 font-bold text-gray-500 text-xs uppercase tracking-wide w-10">#</th>
                    <th className="text-left py-3 px-4 font-bold text-gray-500 text-xs uppercase tracking-wide">Kategori</th>
                    <th className="text-left py-3 px-4 font-bold text-gray-500 text-xs uppercase tracking-wide hidden sm:table-cell">Dept</th>
                    <th className="text-right py-3 px-4 font-bold text-gray-500 text-xs uppercase tracking-wide">Qty</th>
                    <th className="text-right py-3 px-4 font-bold text-gray-500 text-xs uppercase tracking-wide">Revenue (Rp)</th>
                    <th className="text-center py-3 px-4 md:px-6 font-bold text-gray-500 text-xs uppercase tracking-wide">Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.rows.map((row, idx) => {
                    const color = getDeptColor(row.department);
                    const deptLabel = DEPT_LABELS[row.department] ?? row.department;
                    const isSelected = selectedCategory?.categoryId === row.categoryId;
                    return (
                      <m.tr
                        key={row.categoryId ?? row.categoryName}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2, delay: idx * 0.03 }}
                        onClick={() => setSelectedCategory(isSelected ? null : row)}
                        className={`border-b border-gray-50 transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-[#fff0f5] border-l-4 border-l-[#ff4b86]'
                            : 'hover:bg-gray-50/80'
                        }`}
                      >
                        <td className="py-3 px-4 md:px-6 text-gray-400 text-xs font-medium tabular-nums">{idx + 1}</td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-gray-900">{row.categoryName}</span>
                          <span className={`sm:hidden ml-2 inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold ${color.badge}`}>
                            {deptLabel}
                          </span>
                        </td>
                        <td className="py-3 px-4 hidden sm:table-cell">
                          <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-bold ${color.badge}`}>
                            {deptLabel}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-gray-700 tabular-nums">
                          {row.qtySold.toLocaleString('id-ID')}
                        </td>
                        <td className="py-3 px-4 text-right font-black text-[#ff4b86] tabular-nums">
                          {formatCurrency(row.revenue)}
                        </td>
                        <td className="py-3 px-4 md:px-6 text-center">
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelectedCategory(isSelected ? null : row); }}
                            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition-colors ${
                              isSelected
                                ? 'bg-[#ff4b86] text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-[#fff0f5] hover:text-[#ff4b86]'
                            }`}
                          >
                            <span className="material-symbols-outlined text-sm">
                              {isSelected ? 'close' : 'open_in_new'}
                            </span>
                            {isSelected ? 'Tutup' : 'Detail'}
                          </button>
                        </td>
                      </m.tr>
                    );
                  })}

                  {/* Total Row */}
                  <tr className="bg-gray-50 border-t-2 border-gray-200">
                    <td colSpan={4} className="py-3 px-4 md:px-6 font-black text-gray-900 text-sm">TOTAL</td>
                    <td className="py-3 px-4 text-right font-black text-[#ff4b86] text-base tabular-nums">
                      {formatCurrency(stats.totalRevenue)}
                    </td>
                    <td className="py-3 px-4 md:px-6" />
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </m.div>

        {/* Detail Drawer */}
        <AnimatePresence>
          {selectedCategory && (
            <DetailDrawer
              key={selectedCategory.categoryId}
              category={selectedCategory}
              products={getProductItems(selectedCategory)}
              dateRangeLabel={dateRangeLabel}
              onClose={handleCloseDrawer}
            />
          )}
        </AnimatePresence>

      </LazyMotion>
    </AdminLayout>
  );
};

export default CategorySalesPage;
