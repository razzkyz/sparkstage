import { beforeEach, describe, expect, it, vi } from 'vitest'

let capturedHandler: ((req: Request) => Promise<Response>) | null = null

const createServiceClient = vi.fn()
const handleCors = vi.fn(() => null)
const getCorsHeaders = vi.fn(() => ({}))
const jsonErrorWithDetails = vi.fn((_req: Request, status: number, payload: unknown) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  }))
const verifyDokuSignature = vi.fn()
const mapDokuStatus = vi.fn()
const processProductOrderTransition = vi.fn()
const processTicketOrderTransition = vi.fn()
const logWebhookEvent = vi.fn()

vi.mock('../_shared/deps.ts', () => ({
  serve: (handler: (req: Request) => Promise<Response>) => {
    capturedHandler = handler
  },
}))

vi.mock('../_shared/http.ts', () => ({
  getCorsHeaders: (...args: unknown[]) => getCorsHeaders(...args),
  handleCors: (...args: unknown[]) => handleCors(...args),
  jsonErrorWithDetails: (...args: unknown[]) => jsonErrorWithDetails(...args),
}))

vi.mock('../_shared/env.ts', () => ({
  getDokuEnv: () => ({
    clientId: 'client-id',
    secretKey: 'secret-key',
    isProduction: true,
  }),
  getSupabaseEnv: () => ({
    url: 'https://example.supabase.co',
    supabaseUrl: 'https://example.supabase.co',
    serviceRoleKey: 'service-role',
  }),
}))

vi.mock('../_shared/supabase.ts', () => ({
  createServiceClient: (...args: unknown[]) => createServiceClient(...args),
}))

vi.mock('../_shared/doku.ts', () => ({
  mapDokuStatus: (...args: unknown[]) => mapDokuStatus(...args),
  verifyDokuSignature: (...args: unknown[]) => verifyDokuSignature(...args),
}))

vi.mock('../_shared/payment-processors.ts', () => ({
  processProductOrderTransition: (...args: unknown[]) => processProductOrderTransition(...args),
  processTicketOrderTransition: (...args: unknown[]) => processTicketOrderTransition(...args),
}))

vi.mock('../_shared/payment-effects.ts', () => ({
  logWebhookEvent: (...args: unknown[]) => logWebhookEvent(...args),
}))

function createSupabaseWebhookClient(state: {
  existingWebhook?: unknown[]
  productOrder?: Record<string, unknown> | null
  ticketOrder?: Record<string, unknown> | null
}) {
  return {
    from(table: string) {
      const filters = new Map<string, unknown>()

      const chain = {
        select() {
          return chain
        },
        eq(column: string, value: unknown) {
          filters.set(column, value)
          return chain
        },
        async single() {
          if (table === 'order_products') {
            return {
              data: filters.get('order_number') === state.productOrder?.order_number ? state.productOrder : null,
              error: null,
            }
          }

          if (table === 'orders') {
            return {
              data: filters.get('order_number') === state.ticketOrder?.order_number ? state.ticketOrder : null,
              error: state.ticketOrder ? null : { message: 'Order not found' },
            }
          }

          return { data: null, error: null }
        },
        async limit() {
          if (table === 'webhook_logs') {
            return {
              data: state.existingWebhook ?? [],
              error: null,
            }
          }

          return { data: [], error: null }
        },
      }

      return chain
    },
  }
}

async function loadHandler() {
  capturedHandler = null
  await vi.resetModules()
  await import('./index.ts')
  if (!capturedHandler) {
    throw new Error('doku-webhook handler was not captured')
  }
  return capturedHandler
}

async function readJson(response: Response) {
  return response.json() as Promise<Record<string, unknown>>
}

describe('doku-webhook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    verifyDokuSignature.mockResolvedValue(true)
    mapDokuStatus.mockReturnValue('paid')
    processProductOrderTransition.mockResolvedValue({
      order: null,
      updateError: null,
      effectError: null,
      applied: true,
      skippedReason: null,
    })
    processTicketOrderTransition.mockResolvedValue({
      order: null,
      updateError: null,
      effectError: null,
      applied: true,
      skippedReason: null,
    })
  })

  it('returns idempotent ok when the same successful webhook status was already logged', async () => {
    createServiceClient.mockReturnValue(
      createSupabaseWebhookClient({
        existingWebhook: [{ id: 1 }],
      })
    )

    const handler = await loadHandler()
    const response = await handler(
      new Request('https://example.supabase.co/functions/v1/doku-webhook', {
        method: 'POST',
        headers: {
          'Client-Id': 'client-id',
          'Request-Id': 'req-1',
          'Request-Timestamp': '2026-04-25T12:00:00Z',
          Signature: 'valid-signature',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          order: {
            invoice_number: 'ORD-1',
            status: 'ORDER_PAID',
          },
          transaction: {
            status: 'SUCCESS',
          },
        }),
      })
    )

    expect(response.status).toBe(200)
    expect(await readJson(response)).toEqual({ status: 'ok', idempotent: true })
    expect(processProductOrderTransition).not.toHaveBeenCalled()
    expect(processTicketOrderTransition).not.toHaveBeenCalled()
  })

  it('routes product orders through the product processor and logs both processing events', async () => {
    createServiceClient.mockReturnValue(
      createSupabaseWebhookClient({
        existingWebhook: [],
        productOrder: {
          id: 44,
          user_id: 'user-44',
          order_number: 'PROD-44',
          status: 'awaiting_payment',
          payment_status: 'pending',
          pickup_code: null,
          pickup_status: null,
          pickup_expires_at: null,
          total: 1000,
          stock_released_at: null,
          voucher_id: null,
          voucher_code: null,
          discount_amount: 0,
        },
      })
    )

    const handler = await loadHandler()
    const response = await handler(
      new Request('https://example.supabase.co/functions/v1/doku-webhook', {
        method: 'POST',
        headers: {
          'Client-Id': 'client-id',
          'Request-Id': 'req-2',
          'Request-Timestamp': '2026-04-25T12:00:00Z',
          Signature: 'valid-signature',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          order: {
            invoice_number: 'PROD-44',
            amount: 1000,
            status: 'ORDER_PAID',
          },
          transaction: {
            status: 'SUCCESS',
          },
        }),
      })
    )

    expect(response.status).toBe(200)
    expect(processProductOrderTransition).toHaveBeenCalledWith(
      expect.objectContaining({
        nextStatus: 'paid',
        grossAmount: 1000,
        order: expect.objectContaining({
          order_number: 'PROD-44',
        }),
      })
    )
    expect(logWebhookEvent).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        orderNumber: 'PROD-44',
        eventType: 'product_order_processed',
        success: true,
      })
    )
    expect(logWebhookEvent).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        orderNumber: 'PROD-44',
        eventType: 'doku_status:paid',
        success: true,
      })
    )
  })
})
