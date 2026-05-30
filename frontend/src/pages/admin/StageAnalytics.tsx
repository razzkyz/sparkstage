import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import AdminLayout from '../../components/AdminLayout';
import { ADMIN_MENU_ITEMS } from '../../constants/adminMenu';
import { useAdminMenuSections } from '../../hooks/useAdminMenuSections';
import { TAB_RETURN_EVENT } from '../../constants/browserEvents';
import { useStageAnalytics, type StageAnalyticsTimeFilter, type StageAnalyticsData } from '../../hooks/useStageAnalytics';
import { useCurrentUserStageLocations } from '../../hooks/useCurrentUserStageLocations';
import { useRecentStageScans } from '../../hooks/useRecentStageScans';
import DashboardStatSkeleton from '../../components/skeletons/DashboardStatSkeleton';
import TableRowSkeleton from '../../components/skeletons/TableRowSkeleton';
import { useToast } from '../../components/Toast';
const EMPTY_STAGES: StageAnalyticsData[] = [];

const StageAnalytics = () => {
    const { signOut, isAdmin } = useAuth();
    const { showToast } = useToast();
    const menuSections = useAdminMenuSections();
    const [timeFilter, setTimeFilter] = useState<StageAnalyticsTimeFilter>('weekly');
    const lastToastErrorRef = useRef<string | null>(null);

    const { data, error, isLoading, isFetching, refetch, periodLabel } = useStageAnalytics(timeFilter, {
        enabled: isAdmin,
    });

    const { data: liveVisitors, isLoading: isLiveLoading, refetch: refetchLive } = useCurrentUserStageLocations({
        enabled: isAdmin,
    });

    const { data: recentScans, isLoading: isRecentScansLoading } = useRecentStageScans({
        enabled: isAdmin,
    });

    const getRelativeTime = (dateStr: string) => {
        const diffMs = Date.now() - new Date(dateStr).getTime();
        const diffSecs = Math.floor(diffMs / 1000);
        const diffMins = Math.floor(diffSecs / 60);
        const diffHours = Math.floor(diffMins / 60);
        if (diffSecs < 30) return 'Just now';
        if (diffMins < 1) return `${diffSecs}s ago`;
        if (diffMins < 60) return `${diffMins}m ago`;
        return `${diffHours}h ago`;
    };

    const stages = data ?? EMPTY_STAGES;

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const handleTabReturn = () => {
            refetch();
            refetchLive();
        };
        window.addEventListener(TAB_RETURN_EVENT, handleTabReturn);
        return () => {
            window.removeEventListener(TAB_RETURN_EVENT, handleTabReturn);
        };
    }, [refetch]);

    useEffect(() => {
        if (!error) return;
        const message = error instanceof Error ? error.message : 'Failed to load analytics data';
        if (lastToastErrorRef.current === message) return;
        lastToastErrorRef.current = message;
        showToast('error', message);
    }, [error, showToast]);

    const totalFootTraffic = useMemo(() => stages.reduce((sum, s) => sum + s.period_scans, 0), [stages]);
    const mostPopular = stages[0];
    const leastVisited = stages[stages.length - 1];
    const scansLabel = timeFilter === 'all' ? 'scans (all time)' : `scans this ${periodLabel}`;

    const getTrafficLevel = (scans: number, maxScans: number) => {
        const ratio = maxScans > 0 ? scans / maxScans : 0;
        if (ratio >= 0.7) return { label: 'High', color: 'text-primary' };
        if (ratio >= 0.4) return { label: 'Med', color: 'text-orange-400' };
        if (ratio >= 0.1) return { label: 'Low', color: 'text-gray-600' };
        return { label: 'Quiet', color: 'text-gray-600' };
    };

    const maxScans = mostPopular?.period_scans || 1;

    // Show error if not admin (this shouldn't happen due to ProtectedRoute, but just in case)
    if (!isAdmin) {
        return (
            <AdminLayout
                menuItems={ADMIN_MENU_ITEMS}
                menuSections={menuSections}
                defaultActiveMenuId="stage-analytics"
                title="Stage Analytics"
                onLogout={signOut}
            >
                <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-center min-h-[400px]">
                    <div className="text-center">
                        <span className="material-symbols-outlined text-6xl text-red-500 mb-4">block</span>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
                        <p className="text-gray-600">You need admin privileges to view this page.</p>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout
            menuItems={ADMIN_MENU_ITEMS}
            menuSections={menuSections}
            defaultActiveMenuId="stage-analytics"
            title="Stage Analytics"
            onLogout={signOut}
        >
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
                {/* Error Message */}
                {error && (
                    <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 flex items-center gap-3">
                        <span className="material-symbols-outlined text-red-500">error</span>
                        <div>
                            <p className="text-sm font-medium text-red-500">Error loading analytics</p>
                            <p className="text-xs text-red-400 mt-1">{error instanceof Error ? error.message : 'Failed to load analytics data'}</p>
                        </div>
                    </div>
                )}
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {isLoading ? (
                        Array.from({ length: 3 }).map((_, index) => <DashboardStatSkeleton key={`stage-analytics-stat-${index}`} />)
                    ) : (
                        <>
                            <div className="rounded-xl border border-gray-200 bg-white p-6 flex flex-col justify-between relative overflow-hidden group">
                                <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <span className="material-symbols-outlined text-6xl text-primary">trending_up</span>
                                </div>
                                <p className="text-sm text-gray-600 mb-2">Most Popular Stage</p>
                                <div className="flex items-baseline gap-2">
                                    <h3 className="text-2xl font-bold text-gray-900">{mostPopular?.name || 'N/A'}</h3>
                                    {mostPopular && mostPopular.period_change > 0 && (
                                        <span className="text-xs text-green-400 flex items-center bg-green-500/10 px-1.5 py-0.5 rounded border border-green-500/20">
                                            <span className="material-symbols-outlined text-xs mr-1">arrow_upward</span>
                                            {mostPopular.period_change}%
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-gray-500 mt-2">
                                    {(mostPopular?.period_scans || 0).toLocaleString()} {scansLabel}
                                </p>
                            </div>

                            <div className="rounded-xl border border-gray-200 bg-white p-6 flex flex-col justify-between relative overflow-hidden group">
                                <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <span className="material-symbols-outlined text-6xl text-gray-500">trending_down</span>
                                </div>
                                <p className="text-sm text-gray-600 mb-2">Least Visited</p>
                                <div className="flex items-baseline gap-2">
                                    <h3 className="text-2xl font-bold text-gray-900">{leastVisited?.name || 'N/A'}</h3>
                                    {leastVisited && leastVisited.period_change < 0 && (
                                        <span className="text-xs text-red-400 flex items-center bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20">
                                            <span className="material-symbols-outlined text-xs mr-1">arrow_downward</span>
                                            {Math.abs(leastVisited.period_change)}%
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-gray-500 mt-2">
                                    {(leastVisited?.period_scans || 0).toLocaleString()} {scansLabel}
                                </p>
                            </div>

                            <div className="rounded-xl border border-gray-200 bg-white p-6 flex flex-col justify-between relative overflow-hidden group">
                                <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <span className="material-symbols-outlined text-6xl text-gray-900">groups</span>
                                </div>
                                <p className="text-sm text-gray-600 mb-2">Total Foot Traffic</p>
                                <div className="flex items-baseline gap-2">
                                    <h3 className="text-2xl font-bold text-gray-900">{totalFootTraffic.toLocaleString()}</h3>
                                    <span className="text-xs text-gray-600 ml-1">Total Scans</span>
                                </div>
                                <p className="text-xs text-gray-500 mt-2">Across all {stages.length} stages</p>
                            </div>
                        </>
                    )}
                </div>

                {/* Leaderboard Table */}
                <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between">
                        <h3 className="text-lg font-bold text-gray-900">Stage Popularity Leaderboard</h3>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setTimeFilter('weekly')}
                                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${timeFilter === 'weekly'
                                        ? 'text-gray-900 bg-primary shadow-lg shadow-red-900/20'
                                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                                    }`}
                            >
                                Weekly
                            </button>
                            <button
                                onClick={() => setTimeFilter('monthly')}
                                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${timeFilter === 'monthly'
                                        ? 'text-gray-900 bg-primary shadow-lg shadow-red-900/20'
                                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                                    }`}
                            >
                                Monthly
                            </button>
                            <button
                                onClick={() => setTimeFilter('all')}
                                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${timeFilter === 'all'
                                        ? 'text-gray-900 bg-primary shadow-lg shadow-red-900/20'
                                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                                    }`}
                            >
                                All Time
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-600">
                            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                                <tr>
                                    <th className="px-6 py-4 font-semibold w-16 text-center">Rank</th>
                                    <th className="px-6 py-4 font-semibold">Stage Name</th>
                                    <th className="px-6 py-4 font-semibold w-1/3">Traffic Volume</th>
                                    <th className="px-6 py-4 font-semibold text-right">Scans</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {isLoading
                                    ? Array.from({ length: 8 }).map((_, idx) => (
                                        <TableRowSkeleton key={`stage-analytics-skel-${idx}`} columns={4} />
                                    ))
                                    : stages.map((stage, index) => {
                                        const traffic = getTrafficLevel(stage.period_scans, maxScans);
                                        const progressWidth = maxScans > 0 ? (stage.period_scans / maxScans) * 100 : 0;

                                        return (
                                            <tr key={stage.id} className="hover:bg-white/[0.02] transition-colors group">
                                                <td className="px-6 py-4 text-center">
                                                    <div
                                                        className={`inline-flex h-8 w-8 items-center justify-center rounded-full font-bold border ${index === 0
                                                                ? 'bg-red-50 text-primary border-primary/30'
                                                                : 'bg-gray-50 text-gray-700 border-gray-200'
                                                            }`}
                                                    >
                                                        {index + 1}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div>
                                                        <p className="font-bold text-gray-900 text-base">{stage.name}</p>
                                                        <p className="text-xs text-gray-500">{stage.zone || 'No zone'}</p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-full bg-gray-50 rounded-full h-2 overflow-hidden border border-gray-200">
                                                            <div
                                                                className="bg-gradient-to-r from-primary to-orange-500 h-2 rounded-full transition-all"
                                                                style={{ width: `${progressWidth}%` }}
                                                            ></div>
                                                        </div>
                                                        <span className={`text-xs font-bold ${traffic.color}`}>{traffic.label}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right font-mono text-gray-900">
                                                    {stage.period_scans.toLocaleString()}
                                                </td>
                                            </tr>
                                        );
                                    })}
                            </tbody>
                        </table>
                    </div>

                    <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
                        <p className="text-sm text-gray-500">Showing {stages.length} stages</p>
                        <button
                            onClick={() => refetch()}
                            disabled={isFetching}
                            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <span className={`material-symbols-outlined text-lg ${isFetching ? 'animate-spin' : ''}`}>{isFetching ? 'progress_activity' : 'refresh'}</span>
                            Refresh Data
                        </button>
                    </div>
                </div>

                {/* Live Visitors Panel */}
                <div className="rounded-xl border border-gray-200 bg-white overflow-hidden mt-6">
                    <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <h3 className="text-lg font-bold text-gray-900">Live Visitors</h3>
                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-50 border border-green-200">
                                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                                <span className="text-xs font-bold text-green-700">Real-time</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="p-6">
                        {isLiveLoading ? (
                            <div className="flex justify-center p-8">
                                <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
                            </div>
                        ) : !liveVisitors || liveVisitors.length === 0 ? (
                            <div className="text-center py-8">
                                <span className="material-symbols-outlined text-4xl text-gray-400 mb-2">sensor_door</span>
                                <p className="text-sm text-gray-500">Belum ada user yang terdeteksi scan di stage manapun dalam 4 jam terakhir.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {liveVisitors.map((v) => (
                                    <div key={v.user_id} className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50 hover:bg-white hover:border-gray-200 hover:shadow-sm transition-all">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-100 to-pink-50 flex items-center justify-center flex-shrink-0 border border-pink-200 text-pink-600 font-bold uppercase">
                                            {v.display_name.charAt(0)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-gray-900 truncate">{v.display_name}</p>
                                            <p className="text-xs text-gray-500 truncate mb-2">{v.email}</p>
                                            <div className="flex items-center gap-1.5">
                                                <span className="material-symbols-outlined text-[14px] text-primary">location_on</span>
                                                <span className="text-sm font-semibold text-gray-700">{v.stage_name}</span>
                                            </div>
                                            <p className="text-[10px] text-gray-400 mt-1">
                                                Scanned at {new Date(v.scanned_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Recent Scans Activity Feed */}
                <div className="rounded-xl border border-gray-200 bg-white overflow-hidden mt-6">
                    <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <h3 className="text-lg font-bold text-gray-900">Recent Scans Activity</h3>
                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200">
                                <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
                                <span className="text-xs font-bold text-blue-700">Auto-refresh 10s</span>
                            </div>
                        </div>
                        <span className="text-xs text-gray-400">50 scan terbaru dari semua stage</span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-600">
                            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                                <tr>
                                    <th className="px-6 py-4 font-semibold">User</th>
                                    <th className="px-6 py-4 font-semibold">Email</th>
                                    <th className="px-6 py-4 font-semibold">Stage</th>
                                    <th className="px-6 py-4 font-semibold text-right">Waktu Scan</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {isRecentScansLoading ? (
                                    Array.from({ length: 8 }).map((_, idx) => (
                                        <TableRowSkeleton key={`recent-scan-skel-${idx}`} columns={4} />
                                    ))
                                ) : !recentScans || recentScans.length === 0 ? (
                                    <tr>
                                        <td colSpan={4}>
                                            <div className="text-center py-12">
                                                <span className="material-symbols-outlined text-4xl text-gray-300 mb-2">qr_code_scanner</span>
                                                <p className="text-sm text-gray-400">Belum ada scan yang tercatat.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    recentScans.map((scan) => (
                                        <tr key={scan.scan_id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-100 to-pink-50 flex items-center justify-center flex-shrink-0 border border-pink-200 text-pink-600 font-bold uppercase text-xs">
                                                        {scan.display_name.charAt(0)}
                                                    </div>
                                                    <span className="font-semibold text-gray-900 truncate max-w-[160px]">{scan.display_name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-3">
                                                <span className="text-gray-500 text-xs truncate max-w-[200px] block">{scan.email}</span>
                                            </td>
                                            <td className="px-6 py-3">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="material-symbols-outlined text-[14px] text-primary">location_on</span>
                                                    <span className="font-semibold text-gray-800">{scan.stage_name}</span>
                                                    {scan.stage_zone && (
                                                        <span className="text-xs text-gray-400">· {scan.stage_zone}</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-3 text-right">
                                                <div className="flex flex-col items-end">
                                                    <span className="text-xs font-semibold text-gray-700">{getRelativeTime(scan.scanned_at)}</span>
                                                    <span className="text-[10px] text-gray-400">
                                                        {new Date(scan.scanned_at).toLocaleString('id-ID', {
                                                            day: '2-digit', month: 'short',
                                                            hour: '2-digit', minute: '2-digit',
                                                        })}
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {recentScans && recentScans.length > 0 && (
                        <div className="px-6 py-3 border-t border-gray-100 bg-gray-50">
                            <p className="text-xs text-gray-400">Menampilkan {recentScans.length} scan terbaru · Refresh otomatis setiap 10 detik</p>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
};

export default StageAnalytics;
