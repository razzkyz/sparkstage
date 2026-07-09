import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface NfcUser {
  id: string;
  nama: string;
  email: string | null;
  uid_nfc: string | null;
  saldo: number;
  status: 'active' | 'inactive' | 'lost';
  created_at: string;
  updated_at: string;
}

export interface NfcTopupTransaction {
  id: string;
  nfc_user_id: string;
  nominal: number;
  saldo_sebelum: number;
  saldo_sesudah: number;
  admin_id: string;
  created_at: string;
}

export interface NfcPaymentTransaction {
  id: string;
  nfc_user_id: string;
  total: number;
  saldo_sebelum: number;
  saldo_sesudah: number;
  status: string;
  created_at: string;
}

// Hooks for Admin & Kasir

export const useNfcUsers = () => {
  return useQuery({
    queryKey: ['nfc_users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('nfc_users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as NfcUser[];
    },
  });
};

export const useNfcUserByUid = (uid: string) => {
  return useQuery({
    queryKey: ['nfc_users', 'uid', uid],
    queryFn: async () => {
      if (!uid) return null;
      const { data, error } = await supabase
        .from('nfc_users')
        .select('*')
        .eq('uid_nfc', uid)
        .eq('status', 'active')
        .maybeSingle();

      if (error) throw error;
      return data as NfcUser | null;
    },
    enabled: !!uid,
  });
};

export const useCreateNfcUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (user: Partial<NfcUser>) => {
      const { data, error } = await supabase
        .from('nfc_users')
        .insert([user])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nfc_users'] });
    },
  });
};

export const useUpdateNfcUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<NfcUser> & { id: string }) => {
      const { data, error } = await supabase
        .from('nfc_users')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nfc_users'] });
    },
  });
};

export const useProcessNfcTopup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ uid_nfc, nominal, admin_id }: { uid_nfc: string; nominal: number; admin_id: string }) => {
      const { data, error } = await supabase.rpc('nfc_process_topup', {
        p_uid_nfc: uid_nfc,
        p_nominal: nominal,
        p_admin_id: admin_id,
      });

      if (error) throw error;
      if (data && typeof data === 'object' && !data.success) {
        throw new Error(data.message || 'Topup failed');
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nfc_users'] });
      queryClient.invalidateQueries({ queryKey: ['nfc_topup_transactions'] });
    },
  });
};

export const useProcessNfcPayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ uid_nfc, items }: { uid_nfc: string; items: any[] }) => {
      const { data, error } = await supabase.rpc('nfc_process_payment', {
        p_uid_nfc: uid_nfc,
        p_items: items,
      });

      if (error) throw error;
      if (data && typeof data === 'object' && !data.success) {
        throw new Error(data.message || 'Payment failed');
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nfc_users'] });
      queryClient.invalidateQueries({ queryKey: ['nfc_payment_transactions'] });
    },
  });
};

export const useNfcTopupHistory = () => {
  return useQuery({
    queryKey: ['nfc_topup_transactions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('nfc_topup_transactions')
        .select(`
          *,
          nfc_users(nama, uid_nfc)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data;
    },
  });
};

export const useNfcPaymentHistory = () => {
  return useQuery({
    queryKey: ['nfc_payment_transactions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('nfc_payment_transactions')
        .select(`
          *,
          nfc_users(nama, uid_nfc)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data;
    },
  });
};
