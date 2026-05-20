import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

export interface ReferralCode {
  code: string
  total_referrals: number
  total_bonus_points: number
  code_is_active: boolean
  code_expires_at: string | null
  code_created_at: string
}

export interface ReferredUser {
  referred_user_id: string
  referred_user_email: string
  referral_code: string
  points_awarded: number
  referred_at: string
}

/**
 * Hook to manage user's referral code
 */
export function useReferralCode() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  // Get referral code stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['referral-stats', user?.id],
    queryFn: async () => {
      if (!user?.id) return null

      try {
        const { data } = await supabase.rpc('get_referral_stats', {
          p_user_id: user.id,
        })

        return data?.[0] as ReferralCode | null
      } catch (error) {
        console.error('Error fetching referral stats:', error)
        return null
      }
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Get referred users
  const { data: referredUsers = [], isLoading: referralsLoading } = useQuery({
    queryKey: ['referred-users', user?.id],
    queryFn: async () => {
      if (!user?.id) return []

      try {
        const { data } = await supabase.rpc('get_referred_users', {
          p_user_id: user.id,
        })

        return (data || []) as ReferredUser[]
      } catch (error) {
        console.error('Error fetching referred users:', error)
        return []
      }
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  })

  // Create new referral code
  const createCode = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Not authenticated')

      const { data, error } = await supabase.rpc('create_referral_code', {
        p_user_id: user.id,
        p_max_uses: null,
        p_expires_at: null,
      })

      if (error) throw error
      return data?.[0]
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referral-stats', user?.id] })
    },
  })

  return {
    stats,
    referredUsers,
    statsLoading: statsLoading || referralsLoading,
    createCode,
  }
}

/**
 * Hook to apply a referral code during checkout/signup
 */
export function useApplyReferralCode() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const applyCode = useMutation({
    mutationFn: async (code: string) => {
      if (!user?.id) throw new Error('Not authenticated')

      const { data, error } = await supabase.rpc('apply_referral_code', {
        p_code: code.toUpperCase(),
        p_referred_user_id: user.id,
      })

      if (error) throw error

      const result = data?.[0]
      if (!result.success) {
        throw new Error(result.message)
      }

      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loyalty-points', user?.id] })
      queryClient.invalidateQueries({ queryKey: ['referral-stats'] })
    },
  })

  return { applyCode }
}

/**
 * Hook to manage customer loyalty points (admin)
 */
export interface LoyaltyPointsRecord {
  user_id: string
  email: string
  current_points: number
  tier_level: number
  tier_name: string
}

export function useAdminLoyaltyPoints() {
  const queryClient = useQueryClient()

  // Fetch all customers with loyalty points
  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['admin-loyalty-customers'],
    queryFn: async () => {
      try {
        const { data: users, error } = await supabase.rpc('get_all_users_for_admin')
        if (error) throw error

        // Get loyalty points for each user
        const { data: points } = await supabase
          .from('customer_loyalty_points')
          .select('user_id, current_points, tier_level, tier_name')

        return (
          users?.map((u: any) => {
            const pointsRecord = points?.find((p) => p.user_id === u.user_id)
            return {
              user_id: u.user_id,
              email: u.email || '',
              current_points: pointsRecord?.current_points || 0,
              tier_level: pointsRecord?.tier_level || 0,
              tier_name: pointsRecord?.tier_name || 'Bronze',
            }
          }) || []
        )
      } catch (error) {
        console.error('Error fetching loyalty customers:', error)
        return []
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  })

  // Award bonus points to customer
  const awardPoints = useMutation({
    mutationFn: async ({ userId, points, reason }: { userId: string; points: number; reason: string }) => {
      const { data, error } = await supabase
        .from('loyalty_points_transactions')
        .insert({
          user_id: userId,
          points,
          transaction_type: 'admin_bonus',
          description: reason,
          created_at: new Date().toISOString(),
        })

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-loyalty-customers'] })
    },
  })

  // Deduct points from customer
  const deductPoints = useMutation({
    mutationFn: async ({ userId, points, reason }: { userId: string; points: number; reason: string }) => {
      const { data, error } = await supabase
        .from('loyalty_points_transactions')
        .insert({
          user_id: userId,
          points: -points,
          transaction_type: 'admin_deduction',
          description: reason,
          created_at: new Date().toISOString(),
        })

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-loyalty-customers'] })
    },
  })

  return {
    customers,
    isLoading,
    awardPoints,
    deductPoints,
  }
}
