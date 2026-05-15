import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { APIError } from '../lib/fetchers';
import { queryKeys } from '../lib/queryKeys';
import { useEffect } from 'react';
import { toLocalDateString, nowWIB } from '../utils/timezone';

export type CashierSalesStats = {
  // Tiket sales
  ticketSalesToday: number;
  ticketRevenueToday: number;
  ticketSalesMonth: number;
  ticketRevenueMonth: number;
  
  // Product sales
  productSalesToday: number;
  productRevenueToday: number;
  productSalesMonth: number;
  productRevenueMonth: number;
};

export function useCashierSalesStats() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.cashierSalesStats(),
    queryFn: async ({ signal }) => {
      const now = nowWIB();
      const todayKey = toLocalDateString(now);
      const monthStart = `${todayKey.substring(0, 7)}-01`;
      
      const [ticketToday, ticketMonth, productToday, productMonth] = await Promise.all([
        // Ticket sales today
        supabase
          .from('order_items')
          .select('id, price', { count: 'exact' })
          .abortSignal(signal)
          .gte('created_at', `${todayKey}T00:00:00+07:00`)
          .lt('created_at', `${todayKey}T23:59:59+07:00`),
        
        // Ticket sales this month
        supabase
          .from('order_items')
          .select('id, price', { count: 'exact' })
          .abortSignal(signal)
          .gte('created_at', `${monthStart}T00:00:00+07:00`),
        
        // Product sales today
        supabase
          .from('order_product_items')
          .select('id, price', { count: 'exact' })
          .abortSignal(signal)
          .gte('created_at', `${todayKey}T00:00:00+07:00`)
          .lt('created_at', `${todayKey}T23:59:59+07:00`),
        
        // Product sales this month
        supabase
          .from('order_product_items')
          .select('id, price', { count: 'exact' })
          .abortSignal(signal)
          .gte('created_at', `${monthStart}T00:00:00+07:00`),
      ]);

      if (ticketToday.error || ticketMonth.error || productToday.error || productMonth.error) {
        const err = new Error('Failed to load cashier sales stats') as APIError;
        err.status = 500;
        err.info = {
          ticketToday: ticketToday.error,
          ticketMonth: ticketMonth.error,
          productToday: productToday.error,
          productMonth: productMonth.error,
        };
        throw err;
      }

      // Calculate revenues
      const calculateRevenue = (rows: Array<{ price: number | string }> | null) => {
        if (!rows) return 0;
        return rows.reduce((sum, row) => sum + Number(row.price || 0), 0);
      };

      return {
        ticketSalesToday: ticketToday.count || 0,
        ticketRevenueToday: calculateRevenue(ticketToday.data),
        ticketSalesMonth: ticketMonth.count || 0,
        ticketRevenueMonth: calculateRevenue(ticketMonth.data),
        productSalesToday: productToday.count || 0,
        productRevenueToday: calculateRevenue(productToday.data),
        productSalesMonth: productMonth.count || 0,
        productRevenueMonth: calculateRevenue(productMonth.data),
      };
    },
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    staleTime: 0,
  });

  useEffect(() => {
    let invalidateTimeoutId: ReturnType<typeof setTimeout> | null = null;
    const scheduleInvalidate = () => {
      if (invalidateTimeoutId) return;
      invalidateTimeoutId = setTimeout(() => {
        invalidateTimeoutId = null;
        void queryClient.invalidateQueries({ queryKey: queryKeys.cashierSalesStats() });
      }, 700);
    };

    const channel = supabase
      .channel('cashier_sales_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_items' }, scheduleInvalidate)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_product_items' }, scheduleInvalidate)
      .subscribe();

    return () => {
      if (invalidateTimeoutId) {
        clearTimeout(invalidateTimeoutId);
      }
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return query;
}
