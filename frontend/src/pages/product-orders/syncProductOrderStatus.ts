import { getValidatedAccessToken, readCurrentAccessToken } from '../../auth/sessionAccess';
import { getSupabaseFunctionStatus } from '../../lib/supabaseFunctionError';
import { invokeSupabaseFunction } from '../../lib/supabaseFunctionInvoke';
import { withTimeout } from '../../utils/queryHelpers';
import type { ProductOrderDetail } from './types';

type SessionLike = { access_token?: string | null; expires_at?: number | null } | null;

type SyncProductOrderStatusOptions = {
  retryWithFreshToken?: () => Promise<string | null>;
};

export type SyncProductOrderStatusResponse = {
  order?: ProductOrderDetail | null;
};

export async function readCurrentProductOrderAccessToken() {
  return readCurrentAccessToken(8000, 'Session fetch timeout. Please try again.');
}

export async function getProductOrderAccessToken(params: {
  session: SessionLike;
  validateSession: () => Promise<boolean>;
}) {
  return getValidatedAccessToken({
    session: params.session,
    validateSession: params.validateSession,
    timeoutMs: 8000,
    timeoutMessage: 'Session fetch timeout. Please try again.',
  });
}

async function requestProductOrderSync(
  orderNumber: string,
  accessToken: string
): Promise<SyncProductOrderStatusResponse> {
  return withTimeout(
    invokeSupabaseFunction<SyncProductOrderStatusResponse>({
      functionName: 'sync-doku-product-status',
      body: { order_number: orderNumber },
      headers: { Authorization: `Bearer ${accessToken}` },
      fallbackMessage: 'Failed to sync status',
    }),
    15000,
    'Request timeout. Please try again.'
  );
}

export async function syncProductOrderStatus(
  orderNumber: string,
  accessToken: string,
  options: SyncProductOrderStatusOptions = {}
): Promise<SyncProductOrderStatusResponse> {
  try {
    return await requestProductOrderSync(orderNumber, accessToken);
  } catch (error) {
    if (getSupabaseFunctionStatus(error) === 401 && typeof options.retryWithFreshToken === 'function') {
      const freshToken = await options.retryWithFreshToken();
      if (freshToken) {
        return requestProductOrderSync(orderNumber, freshToken);
      }
    }
    // Di mode staging, kalau edge function belum di-deploy akan kena CORS/TypeError
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      console.warn('Sync function not available, ignoring to prevent UI crash in staging');
      return { order: null };
    }
    
    // Ignore 404 errors as well (missing function)
    if (getSupabaseFunctionStatus(error) === 404) {
      console.warn('Sync function 404, ignoring to prevent UI crash in staging');
      return { order: null };
    }

    throw error;
  }
}
