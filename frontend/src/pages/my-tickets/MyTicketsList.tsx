import { useNavigate } from 'react-router-dom';
import type { TFunction } from 'i18next';
import type { TicketOrderListItem } from '../../hooks/useMyTicketOrders';
import { MyTicketCard } from './MyTicketCard';

type MyTicketsListProps = {
  orders: TicketOrderListItem[];
  expandedOrder: number | null;
  syncingOrderId: number | null;
  getStatusBadge: (order: TicketOrderListItem) => {
    label: string;
    tone: 'yellow' | 'green' | 'gray' | 'red';
  };
  onToggleExpand: (orderId: number) => void;
  onSyncStatus: (order: TicketOrderListItem) => void;
  onCancelOrder: (order: TicketOrderListItem) => void;
  t: TFunction;
};

export function MyTicketsList({
  orders,
  expandedOrder,
  syncingOrderId,
  getStatusBadge,
  onToggleExpand,
  onSyncStatus,
  onCancelOrder,
  t,
}: MyTicketsListProps) {
  const navigate = useNavigate();

  return (
    <>
      {orders.map((order) => (
        <MyTicketCard
          key={order.id}
          order={order}
          isExpanded={expandedOrder === order.id}
          isSyncing={syncingOrderId === order.id}
          onToggleExpand={() => onToggleExpand(order.id)}
          onPayNow={() => navigate(`/booking-success?order_id=${encodeURIComponent(order.order_number)}&pending=1`)}
          onCancel={() => void onCancelOrder(order)}
          onSyncStatus={() => void onSyncStatus(order)}
          onViewDetails={() => navigate(`/booking-success?order_id=${encodeURIComponent(order.order_number)}`)}
          statusBadge={getStatusBadge(order)}
          t={t}
        />
      ))}
    </>
  );
}
