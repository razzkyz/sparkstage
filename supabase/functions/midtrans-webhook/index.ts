import { serve } from '../_shared/deps.ts'
import { getCorsHeaders, handleCors, jsonErrorWithDetails } from '../_shared/http.ts'
import { getDokuEnv, getSupabaseEnv } from '../_shared/env.ts'
import { createServiceClient } from '../_shared/supabase.ts'
import { mapDokuStatus, verifyDokuSignature } from '../_shared/doku.ts'
import {
  processProductOrderTransition,
  processTicketOrderTransition,
} from '../_shared/payment-processors.ts'
import { logWebhookEvent, type TicketOrderItem } from '../_shared/payment-effects.ts'

function readHeader(headers: Headers, name: string) {
  return headers.get(name) ?? headers.get(name.toLowerCase()) ?? ''
}

serve(async (req) => {
  const corsResponse = handleCors(req, { allowAllOrigins: true })
  if (corsResponse) return corsResponse
  const corsHeaders = getCorsHeaders(req, { allowAllOrigins: true })

  let supabase: ReturnType<typeof createServiceClient> | null = null
  let orderNumber = ''
  let notification: unknown = null

  try {
    const { url: supabaseUrl, serviceRoleKey: supabaseServiceKey } = getSupabaseEnv()
    const dokuEnv = getDokuEnv()
    supabase = createServiceClient(supabaseUrl, supabaseServiceKey)

    const rawBody = await req.text()
    if (!rawBody.trim()) {
      return new Response(JSON.stringify({ error: 'Empty payload' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    try {
      notification = JSON.parse(rawBody)
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON payload' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const payload =
      typeof notification === 'object' && notification !== null
        ? (notification as Record<string, unknown>)
        : {}
    const orderPayload =
      typeof payload.order === 'object' && payload.order !== null
        ? (payload.order as Record<string, unknown>)
        : {}
    const transactionPayload =
      typeof payload.transaction === 'object' && payload.transaction !== null
        ? (payload.transaction as Record<string, unknown>)
        : {}

    orderNumber = String(orderPayload.invoice_number || '')
    const nowIso = new Date().toISOString()
    const clientId = readHeader(req.headers, 'Client-Id')
    const requestId = readHeader(req.headers, 'Request-Id')
    const requestTimestamp = readHeader(req.headers, 'Request-Timestamp')
    const providedSignature = readHeader(req.headers, 'Signature')

    if (!orderNumber) {
      return new Response(JSON.stringify({ error: 'Missing invoice_number' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (clientId !== dokuEnv.clientId) {
      await logWebhookEvent(supabase, {
        orderNumber,
        eventType: 'invalid_client_id',
        payload: notification,
        success: false,
        errorMessage: 'Invalid client id',
        processedAt: nowIso,
      })
      return new Response(JSON.stringify({ error: 'Invalid client id' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const isValidSignature = await verifyDokuSignature({
      clientId,
      requestId,
      requestTimestamp,
      requestTarget: new URL(req.url).pathname,
      secretKey: dokuEnv.secretKey,
      rawBody,
      providedSignature,
    })

    if (!requestId || !requestTimestamp || !providedSignature || !isValidSignature) {
      await logWebhookEvent(supabase, {
        orderNumber,
        eventType: 'invalid_signature',
        payload: notification,
        success: false,
        errorMessage: 'Invalid signature',
        processedAt: nowIso,
      })
      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const providerStatus = mapDokuStatus(transactionPayload.status, orderPayload.status)
    const idempotencyEventType = `doku_status:${providerStatus}`

    const { data: existingWebhook } = await supabase
      .from('webhook_logs')
      .select('id')
      .eq('order_number', orderNumber)
      .eq('event_type', idempotencyEventType)
      .eq('success', true)
      .limit(1)

    if (Array.isArray(existingWebhook) && existingWebhook.length > 0) {
      return new Response(JSON.stringify({ status: 'ok', idempotent: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: productOrder } = await supabase
      .from('order_products')
      .select('id, user_id, order_number, status, payment_status, pickup_code, pickup_status, pickup_expires_at, total, stock_released_at, voucher_id, voucher_code, discount_amount')
      .eq('order_number', orderNumber)
      .single()

    if (productOrder) {
      const result = await processProductOrderTransition({
        supabase,
        order: productOrder as {
          id: number
          user_id?: string | null
          order_number: string
          status?: string | null
          payment_status?: string | null
          pickup_code?: string | null
          pickup_status?: string | null
          pickup_expires_at?: string | null
          total?: unknown
          stock_released_at?: string | null
          voucher_id?: string | null
          voucher_code?: string | null
          discount_amount?: unknown
        },
        nextStatus: providerStatus,
        paymentData: notification,
        grossAmount: orderPayload.amount,
        nowIso,
        shouldSetPaidAt: true,
      })

      await logWebhookEvent(supabase, {
        orderNumber,
        eventType: 'product_order_processed',
        payload: {
          notification,
          next_status: providerStatus,
          applied: result.applied,
          skipped_reason: result.skippedReason,
        },
        success: !result.updateError && !result.effectError,
        errorMessage: result.updateError ?? result.effectError,
        processedAt: nowIso,
      })

      await logWebhookEvent(supabase, {
        orderNumber,
        eventType: idempotencyEventType,
        payload: notification,
        success: !result.updateError && !result.effectError,
        errorMessage: result.updateError ?? result.effectError,
        processedAt: nowIso,
      })

      if (result.updateError || result.effectError) {
        return jsonErrorWithDetails(
          req,
          500,
          {
            error: 'Failed to process product payment webhook',
            code: 'PRODUCT_WEBHOOK_FAILED',
            details: result.updateError ?? result.effectError,
          },
          { allowAllOrigins: true }
        )
      }

      return new Response(JSON.stringify({ status: 'ok' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, user_id, order_number, status, tickets_issued_at, capacity_released_at, order_items(*)')
      .eq('order_number', orderNumber)
      .single()

    if (orderError || !order) {
      await logWebhookEvent(supabase, {
        orderNumber,
        eventType: 'order_not_found',
        payload: notification,
        success: false,
        errorMessage: orderError?.message ?? 'Order not found',
        processedAt: nowIso,
      })
      return new Response(JSON.stringify({ error: 'Order not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const orderItemsRows = (order as { order_items?: unknown }).order_items
    const result = await processTicketOrderTransition({
      supabase,
      order: order as {
        id: number
        order_number: string
        user_id: string | null
        status?: string | null
        tickets_issued_at?: string | null
        capacity_released_at?: string | null
      },
      nextStatus: providerStatus,
      paymentData: notification,
      orderItems: Array.isArray(orderItemsRows) ? (orderItemsRows as TicketOrderItem[]) : undefined,
      nowIso,
    })

    await logWebhookEvent(supabase, {
      orderNumber,
      eventType: 'ticket_order_processed',
      payload: {
        notification,
        next_status: providerStatus,
        applied: result.applied,
        skipped_reason: result.skippedReason,
      },
      success: !result.updateError && !result.effectError,
      errorMessage: result.updateError ?? result.effectError,
      processedAt: nowIso,
    })

    await logWebhookEvent(supabase, {
      orderNumber,
      eventType: idempotencyEventType,
      payload: notification,
      success: !result.updateError && !result.effectError,
      errorMessage: result.updateError ?? result.effectError,
      processedAt: nowIso,
    })

    if (result.updateError || result.effectError) {
      return jsonErrorWithDetails(
        req,
        500,
        {
          error: 'Failed to process ticket payment webhook',
          code: 'TICKET_WEBHOOK_FAILED',
          details: result.updateError ?? result.effectError,
        },
        { allowAllOrigins: true }
      )
    }

    return new Response(JSON.stringify({ status: 'ok' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error processing notification:', error)
    if (supabase) {
      const message = error instanceof Error ? error.message : 'Internal server error'
      await logWebhookEvent(supabase, {
        orderNumber,
        eventType: 'exception',
        payload: notification,
        success: false,
        errorMessage: message,
        processedAt: new Date().toISOString(),
      })
    }
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
