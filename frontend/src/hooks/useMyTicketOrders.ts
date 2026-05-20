import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export type TicketOrder = {
  id: number;
  order_number: string;
  status: string;
  total: number;
  created_at: string;
  order_items?: Array<{
    id: number;
    ticket_name?: string;
  }>;
};

export function useMyTicketOrders(userId: string | null | undefined) {
  const enabled = typeof userId === 'string' && userId.length > 0;

  return useQuery({
    queryKey: enabled ? ['myTicketOrders', userId] : ['myTicketOrders', 'invalid'],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(
          `
          id,
          order_number,
          status,
          total,
          created_at,
          order_items (
            id,
            ticket_name
          )
        `
        )
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[useMyTicketOrders] Error fetching orders:', error);
        throw error;
      }
      
      console.log('[useMyTicketOrders] Fetched orders:', data);
      return (data || []) as TicketOrder[];
    },
  });
}
