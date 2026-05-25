import { useState, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import AdminLayout from '../../components/AdminLayout';
import { ADMIN_MENU_ITEMS } from '../../constants/adminMenu';
import { useAdminMenuSections } from '../../hooks/useAdminMenuSections';
import { supabase } from '../../lib/supabase';
import { useQuery } from '@tanstack/react-query';

const TICKET_PRICE = 85_000;

// ── Types ────────────────────────────────────────────────────────────────────

interface TicketRow {
  id: number;
  ticket_code: string | null;
  valid_date: string;
  time_slot: string | null;
  status: string;
  created_at: string;
  used_at: string | null;
  tickets: { name: string } | null;
}

type TicketRowRaw = TicketRow & {
  tickets: { name: string }[] | { name: string } | null;
};

interface ProductOrderRow {
  id: number;
  order_number: string;
  total: number;
  payment_status: string | null;
  pickup_status: string | null;
  paid_at: string | null;
  created_at: string | null;
  profiles: { name?: string; email?: string } | null;
  order_product_items: {
    id: number;
    quantity: number;
    price: number;
    subtotal: number;
    product_variants?: {
      name?: string;
      products?: { name?: string } | null;
    } | null;
  }[];
}

interface PrintOrderRow {
  id: number;
  doku_order_id: string | null;
  amount: number;
  status: string | null;
  paid_at: string | null;
  created_at: string | null;
  customer_name: string | null;
  customer_email: string | null;
  queue_number: string | null;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);
}

function formatDate(iso: string | null) {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Jakarta' });
}

function formatDatetime(iso: string | null) {
  if (!iso) return '-';
  return new Date(iso).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
}

function downloadCSV(filename: string, rows: string[][], headers: string[]) {
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const lines = [headers.map(escape).join(','), ...rows.map(r => r.map(escape).join(','))];
  const blob = new Blob(['\uFEFF' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

function useTicketSales(enabled: boolean) {
  return useQuery({
    queryKey: ['sales-report-tickets'],
    enabled,
    queryFn: async () => {
      let allData: TicketRowRaw[] = [];
      let page = 0;
      const pageSize = 1000;
      while (true) {
        const { data, error } = await supabase
          .from('purchased_tickets')
          .select('id, ticket_code, valid_date, time_slot, status, created_at, used_at, tickets(name)')
          .eq('status', 'used')
          .order('created_at', { ascending: false })
          .range(page * pageSize, (page + 1) * pageSize - 1);
        if (error) throw error;
        allData = [...allData, ...((data ?? []) as TicketRowRaw[])];
        if (!data || data.length < pageSize) break;
        page++;
      }
      // Normalize tickets from array to object
      return allData.map(d => ({
        ...d,
        tickets: Array.isArray(d.tickets) ? d.tickets[0] : d.tickets,
      })) as TicketRow[];
    },
  });
}

function useProductSales(enabled: boolean) {
  return useQuery({
    queryKey: ['sales-report-products'],
    enabled,
    queryFn: async () => {
      let allData: any[] = [];
      let page = 0;
      const pageSize = 1000;
      while (true) {
        const { data, error } = await supabase
          .from('order_products')
          .select('id, order_number, total, payment_status, pickup_status, paid_at, created_at, profiles(name,email), order_product_items(id,quantity,price,subtotal,product_variants(name,products(name)))')
          .eq('payment_status', 'paid')
          .eq('pickup_status', 'completed')
          .order('paid_at', { ascending: false, nullsFirst: false })
          .range(page * pageSize, (page + 1) * pageSize - 1);
        if (error) throw error;
        allData = [...allData, ...(data ?? [])];
        if (!data || data.length < pageSize) break;
        page++;
      }
      return allData as unknown as ProductOrderRow[];
    },
  });
}

function usePrintSales(enabled: boolean) {
  return useQuery({
    queryKey: ['sales-report-print'],
    enabled,
    queryFn: async () => {
      // First check: get count of ALL rows
      const { count, error: countError } = await supabase
        .from('print_orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'paid');
      
      console.log('print_orders total rows in DB (status=paid):', count);
      if (countError) console.error('Count error:', countError);

      let allData: any[] = [];
      let page = 0;
      const pageSize = 1000;
      while (true) {
        const { data, error } = await supabase
          .from('print_orders')
          .select('id, doku_order_id, amount, status, paid_at, created_at, customer_name, customer_email, queue_number')
          .eq('status', 'paid')
          .order('paid_at', { ascending: false, nullsFirst: false })
          .range(page * pageSize, (page + 1) * pageSize - 1);
        
        if (error) {
          console.error('Print orders query error:', error);
          throw error;
        }
        
        console.log(`Print page ${page}:`, data?.length ?? 0, 'items');
        if (data && data.length > 0) {
          console.log('Sample print row:', JSON.stringify(data[0]));
        }
        allData = [...allData, ...(data ?? [])];
        if (!data || data.length < pageSize) break;
        page++;
      }
      console.log('Total prints loaded from query:', allData.length);
      return allData as unknown as PrintOrderRow[];
    },
  });
}

export default function SalesReport() {
  const { signOut, session, isAdmin } = useAuth();
  const menuSections = useAdminMenuSections();
  const queryEnabled = !!session && isAdmin;

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const today = `${year}-${month}-${day}`;
  const firstOfMonth = `${year}-${month}-01`;

  const [from, setFrom] = useState(firstOfMonth);
  const [to,   setTo]   = useState(today);
  const [tab, setTab] = useState<'tickets' | 'products' | 'prints'>('tickets');
  const [ticketPage, setTicketPage] = useState(1);
  const [productPage, setProductPage] = useState(1);
  const [printPage, setPrintPage] = useState(1);

  const { data: tickets  = [], isLoading: ticketsLoading,  error: ticketsError  } = useTicketSales(queryEnabled);
  const { data: products = [], isLoading: productsLoading, error: productsError } = useProductSales(queryEnabled);
  const { data: prints   = [], isLoading: printsLoading,   error: printsError   } = usePrintSales(queryEnabled);

  const queryError = ticketsError || productsError || printsError;
  const isAuthError = queryError instanceof Error &&
    (queryError.message.includes('JWT') ||
     queryError.message.includes('token') ||
     queryError.message.includes('401') ||
     queryError.message.includes('403') ||
     queryError.message.includes('400'));

  // ── Client-side date filter ───────────────────────────────────────────
  // Convert date strings to UTC timestamps for consistent filtering
  const getUTCTimestamp = (dateStr: string, isEnd: boolean = false): number => {
    if (!dateStr) return isEnd ? Infinity : 0;
    const [year, month, day] = dateStr.split('-').map(Number);
    // Create UTC date
    const date = new Date(Date.UTC(year, month - 1, day, isEnd ? 23 : 0, isEnd ? 59 : 0, isEnd ? 59 : 0, isEnd ? 999 : 0));
    return date.getTime();
  };
  
  const fromMs = getUTCTimestamp(from, false);
  const toMs   = getUTCTimestamp(to, true);

  const filteredTickets = useMemo(() =>
    tickets.filter(t => {
      const ms = new Date(t.created_at).getTime();
      return ms >= fromMs && ms <= toMs;
    }),
    [tickets, fromMs, toMs]
  );

  const filteredProducts = useMemo(() =>
    products.filter(o => {
      // Use paid_at for date filtering (when money was actually received)
      const dateStr = o.paid_at || o.created_at;
      if (!dateStr) return false;
      const ms = new Date(dateStr).getTime();
      // Filter out test orders with test prices (1000 or 10)
      const hasTestPrice = o.order_product_items.some(item => item.price === 1000 || item.price === 10);
      return ms >= fromMs && ms <= toMs && !hasTestPrice;
    }),
    [products, fromMs, toMs]
  );

  const filteredPrints = useMemo(() =>
    prints.filter(p => {
      // Use paid_at for date filtering (when payment was confirmed) - must match DOKU date
      const dateStr = p.paid_at || p.created_at;
      if (!dateStr) return false;
      const ms = new Date(dateStr).getTime();
      return ms >= fromMs && ms <= toMs;
    }),
    [prints, fromMs, toMs]
  );

  // ── Pagination ───────────────────────────────────────────────────
  const ITEMS_PER_PAGE = 100;
  
  const ticketPagination = useMemo(() => {
    const total = filteredTickets.length;
    const totalPages = Math.ceil(total / ITEMS_PER_PAGE);
    const page = Math.max(1, Math.min(ticketPage, totalPages));
    const start = (page - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return {
      data: filteredTickets.slice(start, end),
      page,
      totalPages,
      total,
      start,
    };
  }, [filteredTickets, ticketPage]);

  const productPagination = useMemo(() => {
    const total = filteredProducts.length;
    const totalPages = Math.ceil(total / ITEMS_PER_PAGE);
    const page = Math.max(1, Math.min(productPage, totalPages));
    const start = (page - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return {
      data: filteredProducts.slice(start, end),
      page,
      totalPages,
      total,
      start,
    };
  }, [filteredProducts, productPage]);

  const printPagination = useMemo(() => {
    const total = filteredPrints.length;
    const totalPages = Math.ceil(total / ITEMS_PER_PAGE);
    const page = Math.max(1, Math.min(printPage, totalPages));
    const start = (page - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return {
      data: filteredPrints.slice(start, end),
      page,
      totalPages,
      total,
      start,
    };
  }, [filteredPrints, printPage]);

  // ── Summaries ────────────────────────────────────────────────────────────
  const ticketStats = useMemo(() => {
    const paid = filteredTickets.length;
    const revenue = paid * TICKET_PRICE;
    console.log(`[SalesReport] Tickets - Count: ${paid}, Revenue: ${revenue}`);
    return { paid, revenue, used: paid };
  }, [filteredTickets]);
  
  // Reset pages when filters change
  useMemo(() => {
    setTicketPage(1);
    setProductPage(1);
    setPrintPage(1);
  }, [from, to]);
  
  const productStats = useMemo(() => {
    const productOrders = filteredProducts.length;
    const productRevenue = filteredProducts.reduce((s, o) => s + (o.total || 0), 0);
    const items = filteredProducts.reduce((s, o) => s + o.order_product_items.reduce((ss, i) => ss + i.quantity, 0), 0);
    console.log(`[SalesReport] Products - Count: ${productOrders}, Revenue: ${productRevenue}, Items: ${items}`);
    return { orders: productOrders, revenue: productRevenue, items };
  }, [filteredProducts]);

  const printStats = useMemo(() => {
    const orders = filteredPrints.length;
    const revenue = filteredPrints.reduce((s, p) => s + (p.amount || 0), 0);
    console.log(`[SalesReport] Prints - Count: ${orders}, Revenue: ${revenue}`);
    return { orders, revenue };
  }, [filteredPrints]);

  const totalRevenue = ticketStats.revenue + productStats.revenue + printStats.revenue;
  console.log(`[SalesReport] TOTAL REVENUE: ${totalRevenue} (Tickets: ${ticketStats.revenue} + Products: ${productStats.revenue} + Prints: ${printStats.revenue})`);

  // ── CSV Exports ──────────────────────────────────────────────────────────
  function exportTicketsCSV() {
    const headers = ['No', 'Kode Tiket', 'Nama Tiket', 'Tanggal Valid', 'Sesi', 'Status', 'Harga (Rp)', 'Dibuat', 'Dipakai'];
    const rows = filteredTickets.map((t, i) => [
      String(i + 1),
      t.ticket_code ?? '-',
      t.tickets?.name ?? '-',
      formatDate(t.valid_date),
      t.time_slot ?? '-',
      t.status,
      String(TICKET_PRICE),
      formatDatetime(t.created_at),
      formatDatetime(t.used_at),
    ]);
    // Add empty row and total row
    rows.push(['', '', '', '', '', '', '', '', '']);
    rows.push(['', '', 'TOTAL', '', '', '', String(ticketStats.revenue), '', '']);
    const ts = new Date().toISOString().slice(0, 10);
    downloadCSV(`laporan-tiket-${ts}.csv`, rows, headers);
  }

  function exportProductsCSV() {
    const headers = ['No', 'No. Order', 'Nama Customer', 'Email', 'Total (Rp)', 'Status', 'Tanggal Bayar', 'Dibuat'];
    const rows = filteredProducts.map((o, i) => [
      String(i + 1),
      o.order_number,
      o.profiles?.name ?? '-',
      o.profiles?.email ?? '-',
      String(o.total),
      o.pickup_status ?? '-',
      formatDatetime(o.paid_at),
      formatDatetime(o.created_at),
    ]);
    // Add empty row and total row
    rows.push(['', '', '', '', '', '', '', '']);
    rows.push(['', 'TOTAL', '', '', String(productStats.revenue), '', '', '']);
    const ts = new Date().toISOString().slice(0, 10);
    downloadCSV(`laporan-produk-${ts}.csv`, rows, headers);
  }

  function exportPrintsCSV() {
    const headers = ['No', 'Doku Order ID', 'Nama Customer', 'Email', 'Amount (Rp)', 'Status', 'Tanggal Bayar', 'Dibuat'];
    const rows = filteredPrints.map((p, i) => [
      String(i + 1),
      p.doku_order_id ?? '-',
      p.customer_name ?? '-',
      p.customer_email ?? '-',
      String(p.amount),
      p.status ?? '-',
      formatDatetime(p.paid_at),
      formatDatetime(p.created_at),
    ]);
    // Add empty row and total row
    rows.push(['', '', '', '', '', '', '', '']);
    rows.push(['', 'TOTAL', '', '', String(printStats.revenue), '', '', '']);
    const ts = new Date().toISOString().slice(0, 10);
    downloadCSV(`laporan-cetak-${ts}.csv`, rows, headers);
  }

  const isLoading = tab === 'tickets' ? ticketsLoading : tab === 'products' ? productsLoading : printsLoading;

  return (
    <AdminLayout
      menuItems={ADMIN_MENU_ITEMS}
      menuSections={menuSections}
      defaultActiveMenuId="sales-report"
      title="Laporan Penjualan"
      onLogout={signOut}
    >
      {/* ── Auth / Query Error Banner ──────────────────────────── */}
      {queryError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-start gap-3">
          <span className="material-symbols-outlined text-red-500 text-2xl flex-shrink-0">error</span>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-red-800 text-sm">
              {isAuthError ? 'Sesi habis — silakan login ulang' : 'Gagal memuat data'}
            </p>
            <p className="text-red-600 text-xs mt-1">
              {isAuthError
                ? 'Token autentikasi tidak valid. Klik "Keluar" lalu login kembali untuk melanjutkan.'
                : (queryError instanceof Error ? queryError.message : 'Terjadi kesalahan saat mengambil data.')}
            </p>
          </div>
          {isAuthError && (
            <button
              onClick={signOut}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 transition-colors flex-shrink-0"
            >
              <span className="material-symbols-outlined text-sm">logout</span>
              Keluar
            </button>
          )}
        </div>
      )}
      {/* ── Summary Cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total Pendapatan', value: formatRupiah(totalRevenue), icon: 'payments', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
          { label: 'Tiket Terpakai', value: `${ticketStats.paid} tiket`, icon: 'confirmation_number', color: 'text-violet-600', bg: 'bg-violet-50 border-violet-200' },
          { label: 'Pendapatan Tiket', value: formatRupiah(ticketStats.revenue), icon: 'local_activity', color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
          { label: 'Pendapatan Produk', value: formatRupiah(productStats.revenue), icon: 'shopping_bag', color: 'text-pink-600', bg: 'bg-pink-50 border-pink-200' },
        { label: 'Pendapatan Cetak', value: formatRupiah(printStats.revenue), icon: 'print', color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200' },
        ].map(card => (
          <div key={card.label} className={`rounded-xl border ${card.bg} p-4 flex flex-col gap-2`}>
            <div className="flex items-center gap-2">
              <span className={`material-symbols-outlined text-xl ${card.color}`}>{card.icon}</span>
              <p className="text-xs text-gray-500">{card.label}</p>
            </div>
            <p className="text-xl font-black text-gray-900 leading-tight">{card.value}</p>
          </div>
        ))}
      </div>

      {/* ── Filter Bar ────────────────────────────────────────────── */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <span className="material-symbols-outlined text-gray-400 hidden sm:block">filter_list</span>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label className="text-xs text-gray-500 whitespace-nowrap">Dari</label>
          <input
            type="date"
            value={from}
            onChange={e => setFrom(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-main-500"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label className="text-xs text-gray-500 whitespace-nowrap">Sampai</label>
          <input
            type="date"
            value={to}
            onChange={e => setTo(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-main-500"
          />
        </div>
        <button
          onClick={() => { setFrom(firstOfMonth); setTo(today); }}
          className="text-xs text-gray-500 hover:text-gray-800 transition-colors flex items-center gap-1 ml-auto"
        >
          <span className="material-symbols-outlined text-sm">restart_alt</span>
          Reset
        </button>
      </div>

      {/* ── Tabs + Export ─────────────────────────────────────────── */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 gap-2 flex-wrap">
          {/* Tab Switcher */}
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setTab('tickets')}
              className={`px-4 py-1.5 rounded-md text-sm font-bold transition-colors ${tab === 'tickets' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">confirmation_number</span>
                Tiket ({ticketStats.paid})
              </span>
            </button>
            <button
              onClick={() => setTab('products')}
              className={`px-4 py-1.5 rounded-md text-sm font-bold transition-colors ${tab === 'products' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">shopping_bag</span>
                Produk ({productStats.orders})
              </span>
            </button>
            <button
              onClick={() => setTab('prints')}
              className={`px-4 py-1.5 rounded-md text-sm font-bold transition-colors ${tab === 'prints' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">print</span>
                Cetak ({printStats.orders})
              </span>
            </button>
          </div>

          {/* Export Button */}
          <button
            onClick={tab === 'tickets' ? exportTicketsCSV : tab === 'products' ? exportProductsCSV : exportPrintsCSV}
            disabled={isLoading || (tab === 'tickets' ? tickets.length === 0 : tab === 'products' ? products.length === 0 : prints.length === 0)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-bold rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            Export CSV
          </button>
        </div>

        {/* ── Tickets Table ──────────────────────────────────────── */}
        {tab === 'tickets' && (
          <>
            <div className="px-4 py-2 bg-violet-50 border-b border-violet-100 flex items-center gap-2">
              <span className="text-xs text-violet-700">
                Harga per tiket: <strong>{formatRupiah(TICKET_PRICE)}</strong>
              </span>
              <span className="text-xs text-gray-400">·</span>
              <span className="text-xs text-violet-700">
                Total: <strong>{formatRupiah(ticketStats.revenue)}</strong>
              </span>
              <span className="text-xs text-gray-400">·</span>
              <span className="text-xs text-violet-700">
                Sudah masuk: <strong>{ticketStats.used}</strong>
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {['No', 'Kode Tiket', 'Nama Tiket', 'Tanggal Valid', 'Sesi', 'Status', 'Harga', 'Dibuat'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}>
                        {Array.from({ length: 8 }).map((_, j) => (
                          <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse w-20" /></td>
                        ))}
                      </tr>
                    ))
                  ) : ticketPagination.data.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-10 text-center text-gray-400">
                        <span className="material-symbols-outlined text-4xl mb-2 block">inbox</span>
                        Tidak ada data tiket di periode ini
                      </td>
                    </tr>
                  ) : ticketPagination.data.map((t, i) => (
                    <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-500 text-xs">{ticketPagination.start + i + 1}</td>
                      <td className="px-4 py-3 font-mono font-semibold text-gray-900 text-xs">{t.ticket_code ?? '-'}</td>
                      <td className="px-4 py-3 text-gray-700">{t.tickets?.name ?? '-'}</td>
                      <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{formatDate(t.valid_date)}</td>
                      <td className="px-4 py-3 text-gray-600">{t.time_slot?.slice(0, 5) ?? '-'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                          t.status === 'active'  ? 'bg-green-100 text-green-700' :
                          t.status === 'used'    ? 'bg-blue-100 text-blue-700' :
                          t.status === 'expired' ? 'bg-gray-100 text-gray-500' :
                          'bg-red-100 text-red-700'
                        }`}>{t.status}</span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-900 whitespace-nowrap">{formatRupiah(TICKET_PRICE)}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{formatDate(t.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!isLoading && ticketPagination.data.length > 0 && (
              <div className="px-4 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-4 text-xs text-gray-600">
                  <span>
                    Menampilkan <strong>{ticketPagination.start + 1}–{Math.min(ticketPagination.start + ITEMS_PER_PAGE, ticketPagination.total)}</strong> dari <strong>{ticketPagination.total}</strong> tiket
                  </span>
                  <span>·</span>
                  <span className="font-bold text-gray-900">{formatRupiah(ticketStats.revenue)}</span>
                </div>
                
                {ticketPagination.totalPages > 1 && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setTicketPage(p => Math.max(1, p - 1))}
                      disabled={ticketPagination.page === 1}
                      className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                      Sebelumnya
                    </button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: ticketPagination.totalPages }).map((_, i) => {
                        const pageNum = i + 1;
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setTicketPage(pageNum)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                              ticketPagination.page === pageNum
                                ? 'bg-violet-600 text-white'
                                : 'border border-gray-300 text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    
                    <button
                      onClick={() => setTicketPage(p => Math.min(ticketPagination.totalPages, p + 1))}
                      disabled={ticketPagination.page === ticketPagination.totalPages}
                      className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Berikutnya
                      <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* ── Products Table ─────────────────────────────────────── */}
        {tab === 'products' && (
          <>
            <div className="px-4 py-2 bg-blue-50 border-b border-blue-100 flex items-center gap-2 flex-wrap">
              <span className="text-xs text-blue-700">
                Total: <strong>{productStats.orders}</strong>
              </span>
              <span className="text-xs text-gray-400">·</span>
              <span className="text-xs text-blue-700">
                Item: <strong>{productStats.items}</strong>
              </span>
              <span className="text-xs text-gray-400">·</span>
              <span className="text-xs text-blue-700">
                Revenue: <strong>{formatRupiah(productStats.revenue)}</strong>
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {['No', 'No. Order', 'Customer', 'Total', 'Status', 'Tanggal Bayar', 'Dibuat'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {productsLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}>
                        {Array.from({ length: 7 }).map((_, j) => (
                          <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse w-20" /></td>
                        ))}
                      </tr>
                    ))
                  ) : productPagination.data.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center text-gray-400">
                        <span className="material-symbols-outlined text-4xl mb-2 block">inbox</span>
                        Tidak ada pesanan produk di periode ini
                      </td>
                    </tr>
                  ) : (
                    productPagination.data.map((o, i) => (
                      <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-gray-500 text-xs">{productPagination.start + i + 1}</td>
                        <td className="px-4 py-3 font-mono font-semibold text-gray-900 text-xs">{o.order_number}</td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900 text-xs">{o.profiles?.name ?? '-'}</p>
                          <p className="text-gray-400 text-xs">{o.profiles?.email ?? ''}</p>
                        </td>
                        <td className="px-4 py-3 font-bold text-gray-900 whitespace-nowrap">{formatRupiah(o.total)}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                            o.pickup_status === 'completed' ? 'bg-green-100 text-green-700' :
                            o.pickup_status === 'pending_pickup' ? 'bg-orange-100 text-orange-700' :
                            'bg-gray-100 text-gray-500'
                          }`}>{o.pickup_status ?? '-'}</span>
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{formatDate(o.paid_at)}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{formatDate(o.created_at)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {!isLoading && productPagination.data.length > 0 && (
              <div className="px-4 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-4 text-xs text-gray-600">
                  <span>
                    Menampilkan <strong>{productPagination.start + 1}–{Math.min(productPagination.start + ITEMS_PER_PAGE, productPagination.total)}</strong> dari <strong>{productPagination.total}</strong> pesanan
                  </span>
                  <span>·</span>
                  <span className="font-bold text-gray-900">{formatRupiah(productStats.revenue)}</span>
                </div>
                
                {productPagination.totalPages > 1 && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setProductPage(p => Math.max(1, p - 1))}
                      disabled={productPagination.page === 1}
                      className="flex items-center gap-1 px-3 py-1.5 border border-blue-300 rounded-lg text-sm font-medium text-blue-700 hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:border-gray-300 disabled:text-gray-700 disabled:hover:bg-gray-100"
                    >
                      <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                      Sebelumnya
                    </button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: productPagination.totalPages }).map((_, i) => {
                        const pageNum = i + 1;
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setProductPage(pageNum)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                              productPagination.page === pageNum
                                ? 'bg-blue-600 text-white'
                                : 'border border-gray-300 text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    
                    <button
                      onClick={() => setProductPage(p => Math.min(productPagination.totalPages, p + 1))}
                      disabled={productPagination.page === productPagination.totalPages}
                      className="flex items-center gap-1 px-3 py-1.5 border border-blue-300 rounded-lg text-sm font-medium text-blue-700 hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:border-gray-300 disabled:text-gray-700 disabled:hover:bg-gray-100"
                    >
                      Berikutnya
                      <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* ── Prints Table ──────────────────────────────────────── */}
        {tab === 'prints' && (
          <>
            <div className="px-4 py-2 bg-orange-50 border-b border-orange-100 flex items-center gap-2 flex-wrap">
              <span className="text-xs text-orange-700">
                Total: <strong>{printStats.orders}</strong>
              </span>
              <span className="text-xs text-gray-400">·</span>
              <span className="text-xs text-orange-700">
                Revenue: <strong>{formatRupiah(printStats.revenue)}</strong>
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {['No', 'Doku Order ID', 'Nama Customer', 'Email', 'Amount', 'Status', 'Tanggal Bayar', 'Dibuat'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {printsLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}>
                        {Array.from({ length: 8 }).map((_, j) => (
                          <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse w-20" /></td>
                        ))}
                      </tr>
                    ))
                  ) : printPagination.data.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-10 text-center text-gray-400">
                        <span className="material-symbols-outlined text-4xl mb-2 block">inbox</span>
                        Tidak ada pesanan cetak di periode ini
                      </td>
                    </tr>
                  ) : (
                    printPagination.data.map((p, i) => (
                      <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-gray-500 text-xs">{printPagination.start + i + 1}</td>
                        <td className="px-4 py-3 font-mono font-semibold text-gray-900 text-xs">{p.doku_order_id ?? '-'}</td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900 text-xs">{p.customer_name ?? '-'}</p>
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-xs">{p.customer_email ?? '-'}</td>
                        <td className="px-4 py-3 font-bold text-gray-900 whitespace-nowrap">{formatRupiah(p.amount)}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                            p.status === 'paid' ? 'bg-green-100 text-green-700' :
                            p.status === 'PRINTED' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-500'
                          }`}>{p.status ?? '-'}</span>
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{formatDate(p.paid_at)}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{formatDate(p.created_at)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {!isLoading && printPagination.data.length > 0 && (
              <div className="px-4 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-4 text-xs text-gray-600">
                  <span>
                    Menampilkan <strong>{printPagination.start + 1}–{Math.min(printPagination.start + ITEMS_PER_PAGE, printPagination.total)}</strong> dari <strong>{printPagination.total}</strong> pesanan
                  </span>
                  <span>·</span>
                  <span className="font-bold text-gray-900">{formatRupiah(printStats.revenue)}</span>
                </div>
                
                {printPagination.totalPages > 1 && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPrintPage(p => Math.max(1, p - 1))}
                      disabled={printPagination.page === 1}
                      className="flex items-center gap-1 px-3 py-1.5 border border-orange-300 rounded-lg text-sm font-medium text-orange-700 hover:bg-orange-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:border-gray-300 disabled:text-gray-700 disabled:hover:bg-gray-100"
                    >
                      <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                      Sebelumnya
                    </button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: printPagination.totalPages }).map((_, i) => {
                        const pageNum = i + 1;
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setPrintPage(pageNum)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                              printPagination.page === pageNum
                                ? 'bg-orange-600 text-white'
                                : 'border border-gray-300 text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    
                    <button
                      onClick={() => setPrintPage(p => Math.min(printPagination.totalPages, p + 1))}
                      disabled={printPagination.page === printPagination.totalPages}
                      className="flex items-center gap-1 px-3 py-1.5 border border-orange-300 rounded-lg text-sm font-medium text-orange-700 hover:bg-orange-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:border-gray-300 disabled:text-gray-700 disabled:hover:bg-gray-100"
                    >
                      Berikutnya
                      <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}
