import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { PageTransition } from '../components/PageTransition';
import { useLoyaltyPoints, useLoyaltyHistory, getLoyaltyRank, getRankProgress, LOYALTY_RANKS } from '../hooks/useLoyaltyPoints';
import { formatCurrency } from '../utils/formatters';

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

const MyPointsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: pointsData, isLoading: pointsLoading } = useLoyaltyPoints(user?.id);
  const { data: history = [], isLoading: histLoading } = useLoyaltyHistory(user?.id);

  useEffect(() => {
    if (!user) navigate('/login', { state: { from: '/my-points' } });
  }, [user, navigate]);

  const totalPoints = pointsData?.total_points ?? 0;
  const rank = getLoyaltyRank(totalPoints);
  const progress = getRankProgress(totalPoints);
  const nextRank = LOYALTY_RANKS.find(r => r.minPoints > rank.minPoints) ?? null;
  const loading = pointsLoading || histLoading;

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50">
        {/* Header Hero */}
        <div
          className="relative overflow-hidden pb-20 pt-10 px-6"
          style={{ background: 'linear-gradient(135deg, #0f0520 0%, #1e0845 45%, #2d0a6b 100%)' }}
        >
          {/* Decorative orbs */}
          <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full opacity-10 blur-3xl pointer-events-none" style={{ background: 'radial-gradient(circle, #ff4b86, transparent)' }} />
          <div className="absolute bottom-0 right-1/4 w-72 h-72 rounded-full opacity-8 blur-3xl pointer-events-none" style={{ background: 'radial-gradient(circle, #a855f7, transparent)' }} />

          <div className="relative max-w-xl mx-auto text-center">
            {/* Rank icon */}
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center text-5xl mx-auto mb-4 shadow-2xl"
              style={{ background: rank.bgColor, border: `2px solid ${rank.borderColor}` }}
            >
              {rank.icon}
            </div>

            <p className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>SPARK CLUB</p>
            <h1 className="text-4xl font-black text-white mb-1">
              {loading
                ? <span className="inline-block w-32 h-10 rounded-lg animate-pulse" style={{ background: 'rgba(255,255,255,0.1)' }} />
                : <>{totalPoints.toLocaleString()} <span className="text-xl font-semibold" style={{ color: rank.color }}>Poin</span></>
              }
            </h1>
            <p className="text-sm font-bold mb-1" style={{ color: rank.color }}>{rank.icon} {rank.label}</p>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>1 tiket = 20 poin · 1 produk/rental = 20 poin · 1 poin = Rp 1 diskon</p>

            {/* Progress to next rank */}
            {nextRank && (
              <div className="mt-5">
                <div className="flex justify-between text-xs mb-1.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  <span>{totalPoints.toLocaleString()} poin</span>
                  <span>{nextRank.minPoints.toLocaleString()} poin → {nextRank.icon} {nextRank.label}</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${progress}%`,
                      background: `linear-gradient(90deg, ${rank.gradientFrom}, ${rank.gradientTo})`,
                    }}
                  />
                </div>
                <p className="text-xs mt-1.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  Butuh {(nextRank.minPoints - totalPoints).toLocaleString()} poin lagi untuk naik ke {nextRank.label}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Main content */}
        <div className="max-w-2xl mx-auto px-4 -mt-10 pb-16 space-y-6">

          {/* Rank tiers */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-900">Tingkatan Rank</h2>
            </div>
            <div className="grid grid-cols-2 gap-0 divide-x divide-y divide-gray-100">
              {LOYALTY_RANKS.map(r => {
                const isActive = r.name === rank.name;
                const isUnlocked = totalPoints >= r.minPoints;
                return (
                  <div
                    key={r.name}
                    className="p-4 flex flex-col items-center text-center transition-colors"
                    style={isActive ? { background: r.bgColor } : {}}
                  >
                    <span className="text-2xl mb-1" style={{ opacity: isUnlocked ? 1 : 0.3 }}>{r.icon}</span>
                    <p className="text-xs font-bold" style={{ color: isUnlocked ? r.color : '#9ca3af' }}>{r.label}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: 'rgba(0,0,0,0.4)' }}>
                      {r.maxPoints ? `${r.minPoints.toLocaleString()}–${r.maxPoints.toLocaleString()} poin` : `${r.minPoints.toLocaleString()}+ poin`}
                    </p>
                    {isActive && (
                      <span className="mt-1.5 text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full" style={{ background: r.borderColor, color: r.color }}>
                        Level Kamu
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick actions */}
          <div className="grid grid-cols-2 gap-3">
            <Link
              to="/shop"
              className="flex items-center justify-center gap-2 bg-white border border-gray-200 rounded-xl p-4 text-sm font-semibold text-gray-700 hover:border-pink-300 hover:text-pink-600 transition-colors shadow-sm"
            >
              <span className="text-lg">🛍️</span>
              Belanja di SPARK CLUB
            </Link>
            <Link
              to="/booking"
              className="flex items-center justify-center gap-2 bg-white border border-gray-200 rounded-xl p-4 text-sm font-semibold text-gray-700 hover:border-pink-300 hover:text-pink-600 transition-colors shadow-sm"
            >
              <span className="text-lg">🎫</span>
              Beli Tiket
            </Link>
          </div>

          {/* Points value info */}
          {totalPoints > 0 && (
            <div className="rounded-xl p-4 flex items-center gap-3" style={{ background: 'linear-gradient(135deg, #fff7ed, #fff1f2)', border: '1px solid rgba(255,75,134,0.2)' }}>
              <span className="text-2xl flex-shrink-0">💰</span>
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  Poin kamu setara <span className="text-pink-600 font-black">{formatCurrency(totalPoints)}</span> diskon
                </p>
                <p className="text-xs text-gray-500 mt-0.5">Gunakan saat checkout produk untuk langsung potong harga</p>
              </div>
            </div>
          )}

          {/* History */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900">Riwayat Poin</h2>
              <span className="text-xs text-gray-400">{history.length} transaksi</span>
            </div>

            {loading ? (
              <div className="divide-y divide-gray-50">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="px-5 py-4 flex items-center justify-between animate-pulse">
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 w-40 bg-gray-100 rounded" />
                      <div className="h-2.5 w-24 bg-gray-100 rounded" />
                    </div>
                    <div className="h-4 w-12 bg-gray-100 rounded" />
                  </div>
                ))}
              </div>
            ) : history.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <span className="text-4xl block mb-3">⭐</span>
                <p className="text-sm text-gray-500">Belum ada riwayat poin.</p>
                <p className="text-xs text-gray-400 mt-1">Beli tiket atau produk untuk mulai mengumpulkan poin!</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {history.map(item => (
                  <div key={item.id} className="px-5 py-4 flex items-center justify-between">
                    <div className="flex items-start gap-3 min-w-0">
                      <span className="text-lg flex-shrink-0 mt-0.5">
                        {item.points_change > 0 ? '✨' : '🎁'}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{item.reason}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{formatDate(item.created_at)}</p>
                      </div>
                    </div>
                    <span
                      className="text-sm font-black flex-shrink-0 ml-4"
                      style={{ color: item.points_change >= 0 ? '#22c55e' : '#ff4b86' }}
                    >
                      {item.points_change >= 0 ? '+' : ''}{item.points_change.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default MyPointsPage;
