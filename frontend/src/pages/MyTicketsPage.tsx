import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import TicketCardSkeleton from '../components/skeletons/TicketCardSkeleton';
import { PageTransition } from '../components/PageTransition';
import { useToast } from '../components/Toast';
import { MyTicketsEmptyState } from './my-tickets/MyTicketsEmptyState';
import { MyTicketsList } from './my-tickets/MyTicketsList';
import { MyTicketsTabs } from './my-tickets/MyTicketsTabs';
import { useMyTicketsView } from './my-tickets/useMyTicketsView';

export default function MyTicketsPage() {
  const navigate = useNavigate();
  const { user, session, getValidAccessToken, refreshSession } = useAuth();
  const { showToast } = useToast();
  const { t } = useTranslation();
  const {
    loading,
    isFetching,
    activeTab,
    expandedOrder,
    syncingOrderId,
    pendingOrders,
    activeOrders,
    historyOrders,
    displayOrders,
    setActiveTab,
    toggleExpand,
    handleSyncStatus,
    handleCancelOrder,
    handleHideOrder,
    getStatusBadge,
  } = useMyTicketsView({
    userId: user?.id,
    sessionToken: session?.access_token,
    getValidAccessToken,
    refreshSession,
    showToast,
    t,
  });

  if (loading) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-background-light flex items-center justify-center">
          <div className="max-w-5xl w-full px-8 grid grid-cols-1 md:grid-cols-2 gap-6 mt-24">
            <TicketCardSkeleton />
            <TicketCardSkeleton />
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-background-light flex flex-col">
        <main className="flex-grow w-full max-w-[1000px] mx-auto py-8 px-4 md:px-10 mt-24">
        {/* Breadcrumb */}
        <div className="mb-8">
          <div className="w-full flex gap-2 pb-4">
            <button onClick={() => navigate('/')} className="text-rose-700 text-sm font-medium hover:text-primary">
              {t('myTickets.breadcrumb.home')}
            </button>
            <span className="text-rose-700 text-sm">/</span>
            <button className="text-rose-700 text-sm font-medium hover:text-primary">
              {t('myTickets.breadcrumb.dashboard')}
            </button>
            <span className="text-rose-700 text-sm">/</span>
            <span className="text-neutral-950 text-sm font-medium">{t('myTickets.breadcrumb.myTickets')}</span>
          </div>

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-serif font-bold text-neutral-950 tracking-tight mb-2">
                {t('myTickets.title')}
              </h1>
              <p className="text-gray-600 font-medium">
                {t('myTickets.subtitle')}
              </p>
            </div>

            <MyTicketsTabs
              activeTab={activeTab}
              pendingCount={pendingOrders.length}
              activeCount={activeOrders.length}
              historyCount={historyOrders.length}
              isFetching={isFetching && !loading}
              onChange={setActiveTab}
              t={t}
            />
          </div>
        </div>

        {/* Expiry Warning Banner - Only show on Active tab */}
        {activeTab === 'active' && activeOrders.length > 0 && (
          <div className="mb-6 rounded-xl border-2 border-amber-200 bg-amber-50 p-4 md:p-5">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-amber-600 text-2xl flex-shrink-0 mt-0.5">
                info
              </span>
              <div className="flex-1">
                <h3 className="font-bold text-amber-900 text-base mb-1.5">
                  {t('myTickets.expiryWarning.title')}
                </h3>
                <p className="text-sm text-amber-800 leading-relaxed">
                  {t('myTickets.expiryWarning.message')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Disclaimer - Commercial fine print */}
        <div className="mb-6 px-4 py-3 bg-white border border-gray-200 rounded-lg shadow-sm">
          <p className="text-xs text-gray-700 italic leading-relaxed">
            {t('myTickets.disclaimer')}
          </p>
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {displayOrders.length > 0 ? (
            <MyTicketsList
              orders={displayOrders}
              expandedOrder={expandedOrder}
              syncingOrderId={syncingOrderId}
              getStatusBadge={getStatusBadge}
              onToggleExpand={toggleExpand}
              onSyncStatus={handleSyncStatus}
              onCancelOrder={handleCancelOrder}
              onHideOrder={handleHideOrder}
              t={t}
            />
          ) : (
            <MyTicketsEmptyState activeTab={activeTab} onBrowseEvents={() => navigate('/#booking')} t={t} />
          )}
        </div>
        </main>
      </div>
    </PageTransition>
  );
}
