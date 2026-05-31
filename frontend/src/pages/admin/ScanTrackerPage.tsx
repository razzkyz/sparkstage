import { useMemo, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import AdminLayout from '../../components/AdminLayout';
import { ADMIN_MENU_ITEMS } from '../../constants/adminMenu';
import { useAdminMenuSections } from '../../hooks/useAdminMenuSections';
import { useScanTracker } from '../../hooks/useScanTracker';
import { useStages } from '../../hooks/useStages';
import TableRowSkeleton from '../../components/skeletons/TableRowSkeleton';

/* ─── helpers ───────────────────────────────────────────────── */
const formatDate = (iso: string) =>
  new Date(iso).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const getRelativeTime = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (s < 30) return 'Baru saja';
  if (m < 1) return `${s}d lalu`;
  if (h < 1) return `${m}m lalu`;
  if (d < 1) return `${h}j lalu`;
  return `${d}h lalu`;
};

const AVATAR_COLORS = [
  'from-rose-400 to-pink-500',
  'from-violet-400 to-purple-500',
  'from-sky-400 to-blue-500',
  'from-emerald-400 to-teal-500',
  'from-amber-400 to-orange-500',
  'from-indigo-400 to-blue-600',
];
const getAvatarColor = (name: string) =>
  AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];

/* ─── CSV export ─────────────────────────────────────────────── */
function downloadCSV(rows: ReturnType<typeof useScanTracker>['data']) {
  if (!rows || rows.length === 0) return;
  const headers = ['No', 'Nama', 'Email', 'Stage', 'Zone', 'Waktu Scan'];
  const csvRows = rows.map((r, i) => [
    i + 1,
    `"${r.display_name}"`,
    `"${r.email}"`,
    `"${r.stage_name}"`,
    `"${r.stage_zone ?? '-'}"`,
    `"${formatDate(r.scanned_at)}"`,
  ]);
  const csv = [headers.join(','), ...csvRows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `scan-tracker-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ─── component ─────────────────────────────────────────────── */
const ScanTrackerPage = () => {
  const { signOut, isAdmin } = useAuth();
  const menuSections = useAdminMenuSections();

  const [selectedStageId, setSelectedStageId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  const { data: stages = [] } = useStages({ enabled: isAdmin });

  const {
    data: scans,
    isLoading,
    isFetching,
    refetch,
  } = useScanTracker({
    enabled: isAdmin,
    stageId: selectedStageId,
    search,
    dateFrom: dateFrom || null,
    dateTo: dateTo || null,
    limit: 500,
  });

  /* per-stage summary for the summary cards */
  const stageSummary = useMemo(() => {
    if (!scans) return [];
    const map = new Map<number, { stage_name: string; stage_code: string; stage_zone: string | null; count: number }>();
    for (const s of scans) {
      const prev = map.get(s.stage_id);
      if (prev) prev.count += 1;
      else map.set(s.stage_id, { stage_name: s.stage_name, stage_code: s.stage_code, stage_zone: s.stage_zone, count: 1 });
    }
    return [...map.values()].sort((a, b) => b.count - a.count);
  }, [scans]);

  const uniqueUsers = useMemo(() => {
    if (!scans) return 0;
    return new Set(scans.map((s) => s.user_id)).size;
  }, [scans]);

  const hasFilters = selectedStageId !== null || search.trim() !== '' || dateFrom !== '' || dateTo !== '';

  const clearFilters = () => {
    setSelectedStageId(null);
    setSearch('');
    setDateFrom('');
    setDateTo('');
  };

  if (!isAdmin) {
    return (
      <AdminLayout
        menuItems={ADMIN_MENU_ITEMS}
        menuSections={menuSections}
        defaultActiveMenuId="scan-tracker"
        title="Scan Tracker"
        onLogout={signOut}
      >
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <span className="material-symbols-outlined mb-4 text-6xl text-red-500">block</span>
            <h2 className="mb-2 text-2xl font-bold text-gray-900">Akses Ditolak</h2>
            <p className="text-gray-600">Butuh hak admin untuk membuka halaman ini.</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      menuItems={ADMIN_MENU_ITEMS}
      menuSections={menuSections}
      defaultActiveMenuId="scan-tracker"
      title="Scan Tracker"
      subtitle="Lacak aktivitas scan pengunjung di setiap stage"
      onLogout={signOut}
    >
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">

        {/* ── Summary Stats ─────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {/* Total Scans */}
          <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-white p-5">
            <div className="absolute right-3 top-3 opacity-8">
              <span className="material-symbols-outlined text-5xl text-primary opacity-10">qr_code_scanner</span>
            </div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Total Scan</p>
            <p className="mt-1 text-3xl font-black text-gray-900">
              {isLoading ? '—' : (scans?.length ?? 0).toLocaleString('id-ID')}
            </p>
            <p className="mt-1 text-xs text-gray-400">entri ditampilkan</p>
          </div>
          {/* Unique Users */}
          <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-white p-5">
            <div className="absolute right-3 top-3">
              <span className="material-symbols-outlined text-5xl text-violet-400 opacity-10">group</span>
            </div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Unik Pengunjung</p>
            <p className="mt-1 text-3xl font-black text-gray-900">
              {isLoading ? '—' : uniqueUsers.toLocaleString('id-ID')}
            </p>
            <p className="mt-1 text-xs text-gray-400">user berbeda</p>
          </div>
          {/* Active Stages */}
          <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-white p-5">
            <div className="absolute right-3 top-3">
              <span className="material-symbols-outlined text-5xl text-emerald-400 opacity-10">location_on</span>
            </div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Stage Aktif</p>
            <p className="mt-1 text-3xl font-black text-gray-900">
              {isLoading ? '—' : stageSummary.length}
            </p>
            <p className="mt-1 text-xs text-gray-400">stage terscan</p>
          </div>
          {/* Most Active Stage */}
          <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-white p-5">
            <div className="absolute right-3 top-3">
              <span className="material-symbols-outlined text-5xl text-amber-400 opacity-10">trending_up</span>
            </div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Stage Terpopuler</p>
            <p className="mt-1 truncate text-xl font-black text-gray-900">
              {isLoading ? '—' : (stageSummary[0]?.stage_name ?? 'N/A')}
            </p>
            <p className="mt-1 text-xs text-gray-400">
              {stageSummary[0] ? `${stageSummary[0].count} scan` : 'belum ada data'}
            </p>
          </div>
        </div>

        {/* ── Per-Stage Mini Cards ───────────────────────────────── */}
        {!isLoading && stageSummary.length > 0 && (
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <p className="mb-3 text-sm font-bold text-gray-700">Distribusi Scan per Stage</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedStageId(null)}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                  selectedStageId === null
                    ? 'border-primary bg-red-50 text-primary'
                    : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300 hover:text-gray-800'
                }`}
              >
                <span className="material-symbols-outlined text-[12px]">layers</span>
                Semua Stage
              </button>
              {stageSummary.map((s) => {
                const stageRow = stages.find((st) => st.name === s.stage_name);
                return (
                  <button
                    key={s.stage_name}
                    onClick={() => setSelectedStageId(stageRow?.id ?? null)}
                    className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                      selectedStageId === stageRow?.id
                        ? 'border-primary bg-red-50 text-primary'
                        : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300 hover:text-gray-800'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[12px]">location_on</span>
                    {s.stage_name}
                    <span className={`ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                      selectedStageId === stageRow?.id ? 'bg-primary/10 text-primary' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {s.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Filters + Controls ────────────────────────────────── */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative min-w-[200px] flex-1">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                search
              </span>
              <input
                id="scan-tracker-search"
                type="text"
                placeholder="Cari nama atau email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-4 text-sm text-gray-800 placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Stage dropdown */}
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                location_on
              </span>
              <select
                id="scan-tracker-stage-filter"
                value={selectedStageId ?? ''}
                onChange={(e) => setSelectedStageId(e.target.value === '' ? null : Number(e.target.value))}
                className="appearance-none rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-8 text-sm text-gray-800 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">Semua Stage</option>
                {stages.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                expand_more
              </span>
            </div>

            {/* Date from */}
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                calendar_today
              </span>
              <input
                id="scan-tracker-date-from"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm text-gray-800 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                title="Dari tanggal"
              />
            </div>

            {/* Date to */}
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                event
              </span>
              <input
                id="scan-tracker-date-to"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm text-gray-800 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                title="Sampai tanggal"
              />
            </div>

            {/* Clear filters */}
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700 transition-colors"
              >
                <span className="material-symbols-outlined text-sm">filter_alt_off</span>
                Reset
              </button>
            )}

            {/* Spacer */}
            <div className="ml-auto flex items-center gap-2">
              {/* View toggle */}
              <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                <button
                  id="scan-tracker-view-table"
                  onClick={() => setViewMode('table')}
                  className={`flex items-center gap-1 px-3 py-2 text-xs font-medium transition-colors ${
                    viewMode === 'table' ? 'bg-gray-900 text-white' : 'bg-white text-gray-500 hover:text-gray-700'
                  }`}
                  title="Tampilan tabel"
                >
                  <span className="material-symbols-outlined text-sm">table_rows</span>
                </button>
                <button
                  id="scan-tracker-view-cards"
                  onClick={() => setViewMode('cards')}
                  className={`flex items-center gap-1 px-3 py-2 text-xs font-medium transition-colors ${
                    viewMode === 'cards' ? 'bg-gray-900 text-white' : 'bg-white text-gray-500 hover:text-gray-700'
                  }`}
                  title="Tampilan kartu"
                >
                  <span className="material-symbols-outlined text-sm">grid_view</span>
                </button>
              </div>

              {/* CSV Export */}
              <button
                id="scan-tracker-export-csv"
                onClick={() => downloadCSV(scans)}
                disabled={!scans || scans.length === 0}
                className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 hover:border-gray-300 hover:text-gray-800 transition-colors disabled:cursor-not-allowed disabled:opacity-40"
              >
                <span className="material-symbols-outlined text-sm">download</span>
                Export CSV
              </button>

              {/* Refresh */}
              <button
                id="scan-tracker-refresh"
                onClick={() => refetch()}
                disabled={isFetching}
                className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 hover:border-gray-300 hover:text-gray-800 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className={`material-symbols-outlined text-sm ${isFetching ? 'animate-spin' : ''}`}>
                  {isFetching ? 'progress_activity' : 'refresh'}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* ── Data: Table View ─────────────────────────────────── */}
        {viewMode === 'table' && (
          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <div className="flex items-center gap-3">
                <h3 className="text-base font-bold text-gray-900">Riwayat Scan</h3>
                <div className="flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-500" />
                  <span className="text-[10px] font-bold text-blue-700">Auto-refresh 15d</span>
                </div>
              </div>
              <span className="text-xs text-gray-400">
                {isLoading ? '…' : `${scans?.length ?? 0} entri`}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-gray-100 bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-400">
                  <tr>
                    <th className="px-6 py-3">Pengunjung</th>
                    <th className="px-6 py-3">Email</th>
                    <th className="px-6 py-3">Stage</th>
                    <th className="px-6 py-3">Zone</th>
                    <th className="px-6 py-3 text-right">Waktu Scan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {isLoading ? (
                    Array.from({ length: 10 }).map((_, i) => (
                      <TableRowSkeleton key={`scan-tracker-skel-${i}`} columns={5} />
                    ))
                  ) : !scans || scans.length === 0 ? (
                    <tr>
                      <td colSpan={5}>
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                          <span className="material-symbols-outlined mb-3 text-5xl text-gray-300">
                            qr_code_scanner
                          </span>
                          <p className="text-sm font-semibold text-gray-400">Belum ada data scan</p>
                          <p className="mt-1 text-xs text-gray-300">
                            {hasFilters ? 'Coba ubah filter pencarian.' : 'Scan pertama akan muncul di sini.'}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    scans.map((scan) => (
                      <tr key={scan.id} className="group hover:bg-gray-50 transition-colors">
                        {/* Name */}
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${getAvatarColor(scan.display_name)} text-xs font-bold uppercase text-white`}
                            >
                              {scan.display_name.charAt(0)}
                            </div>
                            <span className="max-w-[160px] truncate font-semibold text-gray-900">
                              {scan.display_name}
                            </span>
                          </div>
                        </td>
                        {/* Email */}
                        <td className="px-6 py-3">
                          <span className="max-w-[200px] truncate block text-xs text-gray-500">
                            {scan.email}
                          </span>
                        </td>
                        {/* Stage */}
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[14px] text-primary">
                              location_on
                            </span>
                            <span className="font-semibold text-gray-800">{scan.stage_name}</span>
                          </div>
                        </td>
                        {/* Zone */}
                        <td className="px-6 py-3">
                          {scan.stage_zone ? (
                            <span className="rounded-full border border-gray-200 bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
                              {scan.stage_zone}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-300">—</span>
                          )}
                        </td>
                        {/* Time */}
                        <td className="px-6 py-3 text-right">
                          <div className="flex flex-col items-end">
                            <span className="text-xs font-semibold text-gray-700">
                              {getRelativeTime(scan.scanned_at)}
                            </span>
                            <span className="mt-0.5 text-[10px] text-gray-400">
                              {formatDate(scan.scanned_at)}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {scans && scans.length > 0 && (
              <div className="border-t border-gray-100 bg-gray-50 px-6 py-3">
                <p className="text-xs text-gray-400">
                  Menampilkan <strong className="text-gray-600">{scans.length}</strong> scan ·{' '}
                  <strong className="text-gray-600">{uniqueUsers}</strong> pengunjung unik ·{' '}
                  <strong className="text-gray-600">{stageSummary.length}</strong> stage terscan
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── Data: Card View ──────────────────────────────────── */}
        {viewMode === 'cards' && (
          <div>
            {isLoading ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="h-28 animate-pulse rounded-xl border border-gray-200 bg-gray-100" />
                ))}
              </div>
            ) : !scans || scans.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white py-16 text-center">
                <span className="material-symbols-outlined mb-3 text-5xl text-gray-300">qr_code_scanner</span>
                <p className="text-sm font-semibold text-gray-400">Belum ada data scan</p>
                <p className="mt-1 text-xs text-gray-300">
                  {hasFilters ? 'Coba ubah filter pencarian.' : 'Scan pertama akan muncul di sini.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {scans.map((scan) => (
                  <div
                    key={scan.id}
                    className="flex items-start gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:border-gray-300 hover:shadow-md transition-all"
                  >
                    <div
                      className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${getAvatarColor(scan.display_name)} text-sm font-bold uppercase text-white shadow`}
                    >
                      {scan.display_name.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold text-gray-900">{scan.display_name}</p>
                      <p className="truncate text-xs text-gray-400">{scan.email}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="flex items-center gap-1 rounded-full border border-red-100 bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-primary">
                          <span className="material-symbols-outlined text-[11px]">location_on</span>
                          {scan.stage_name}
                        </span>
                        {scan.stage_zone && (
                          <span className="rounded-full border border-gray-200 bg-gray-100 px-2 py-0.5 text-[10px] text-gray-500">
                            {scan.stage_zone}
                          </span>
                        )}
                      </div>
                      <p className="mt-1.5 text-[10px] text-gray-400">
                        {getRelativeTime(scan.scanned_at)} · {formatDate(scan.scanned_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {scans && scans.length > 0 && (
              <p className="mt-4 text-center text-xs text-gray-400">
                {scans.length} scan · {uniqueUsers} pengunjung unik · {stageSummary.length} stage
              </p>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default ScanTrackerPage;
