import { serve } from "../_shared/deps.ts";
import {
  assertDokuCheckoutModeGuard,
  buildDokuRequestHeaders,
  createDokuRequestId,
  createDokuRequestTimestamp,
  extractDokuCheckoutResponse,
  getDokuApiBaseUrl,
  getDokuCheckoutPath,
  getDokuCheckoutSdkUrl,
  mergeDokuPaymentData,
  sanitizeDokuString,
  summarizeDokuHttpResponse,
} from "../_shared/doku.ts";
import {
  handleCors,
  json,
  jsonError,
  jsonErrorWithDetails,
} from "../_shared/http.ts";
import { checkRateLimit } from "../_shared/rate-limit.ts";
import {
  getAllowedAppOrigins,
  getDokuEnv,
  getPublicAppUrl,
} from "../_shared/env.ts";
import { createServiceClient } from "../_shared/supabase.ts";
import { requireAuthenticatedRequest } from "../_shared/auth.ts";

interface CreateRentalCheckoutRequest {
  customerName: string;
  customerPhone?: string;
  rentalDate: string;
  shoeSize: string;
  durationHours: number;
  pricePerHour?: number;
}

interface CreateRentalCheckoutResponse {
  success: boolean;
  rentalId: number;
  invoiceNumber: string;
  totalPrice: number;
  paymentUrl: string;
  paymentId: string;
  checkoutSdkUrl: string;
  expiresAt: string | null;
}

const DEFAULT_PRICE_PER_HOUR = 85000;
const PAYMENT_EXPIRY_MINUTES = 15;

function generateInvoiceNumber(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `RBL-${timestamp}-${random}`;
}

function calculateExpiryTime(): string {
  const expiry = new Date();
  expiry.setMinutes(expiry.getMinutes() + PAYMENT_EXPIRY_MINUTES);
  return expiry.toISOString();
}

async function persistRentalPaymentData(params: {
  supabase: ReturnType<typeof createServiceClient>;
  rentalId: number;
  paymentData: Record<string, unknown>;
  paymentId?: string | null;
  paymentUrl?: string | null;
  paymentExpiredAt?: string | null;
}) {
  const updateFields: Record<string, unknown> = {
    payment_data: params.paymentData,
    updated_at: new Date().toISOString(),
  };

  if (typeof params.paymentId !== "undefined") {
    updateFields.payment_id = params.paymentId;
  }

  if (typeof params.paymentUrl !== "undefined") {
    updateFields.payment_url = params.paymentUrl;
  }

  if (typeof params.paymentExpiredAt !== "undefined") {
    updateFields.payment_expired_at = params.paymentExpiredAt;
  }

  const { error } = await params.supabase
    .from("rentals")
    .update(updateFields)
    .eq("id", params.rentalId);

  if (error) {
    console.error(
      "[create-doku-rental-checkout] Failed to persist payment_data:",
      error,
    );
  }
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return handleCors(req);
  }

  if (req.method !== "POST") {
    return jsonError(req, 405, "Method not allowed");
  }

  const requestOrigin = req.headers.get("origin");
  let createdRentalId: number | null = null;

  try {
    // Rate limit check
    const rateLimitResult = await checkRateLimit({
      key: `rental-checkout:${requestOrigin || "unknown"}`,
      limit: 10,
      windowMs: 60000,
    });

    if (!rateLimitResult.allowed) {
      return jsonError(req, 429, "Too many requests");
    }

    // Auth check
    const auth = await requireAuthenticatedRequest(req);
    if (!auth.user) {
      return jsonError(req, 401, "Unauthorized");
    }

    // Get DOKU environment
    const dokuEnv = getDokuEnv();
    const publicAppUrl = getPublicAppUrl();
    const allowedOrigins = getAllowedAppOrigins();

    // Production mode guard
    assertDokuCheckoutModeGuard({
      isProduction: dokuEnv.isProduction,
      appUrl: publicAppUrl,
      requestOrigin,
      allowedOrigins,
      paymentMethodTypes: dokuEnv.paymentMethodTypes,
    });

    // Parse request body
    const payload: CreateRentalCheckoutRequest = await req.json();

    // Validate payload
    if (!payload.customerName?.trim()) {
      return jsonErrorWithDetails(req, 400, {
        error: "Customer name is required",
        field: "customerName",
      });
    }

    if (!payload.rentalDate) {
      return jsonErrorWithDetails(req, 400, {
        error: "Rental date is required",
        field: "rentalDate",
      });
    }

    if (!payload.shoeSize?.trim()) {
      return jsonErrorWithDetails(req, 400, {
        error: "Shoe size is required",
        field: "shoeSize",
      });
    }

    if (!payload.durationHours || payload.durationHours <= 0) {
      return jsonErrorWithDetails(req, 400, {
        error: "Duration hours must be greater than 0",
        field: "durationHours",
      });
    }

    // Calculate pricing
    const pricePerHour = payload.pricePerHour || DEFAULT_PRICE_PER_HOUR;
    const totalPrice = pricePerHour * payload.durationHours;

    // Generate invoice number
    const invoiceNumber = generateInvoiceNumber();
    const expiryTime = calculateExpiryTime();

    // Create Supabase client
    const supabase = createServiceClient(
      req.headers.get("Authorization") ?? "",
    );

    // Create rental order
    const { data: rental, error: rentalError } = await supabase
      .from("rentals")
      .insert({
        invoice_number: invoiceNumber,
        customer_name: payload.customerName.trim(),
        rental_date: payload.rentalDate,
        shoe_size: payload.shoeSize.trim(),
        duration_hours: payload.durationHours,
        price_per_hour: pricePerHour,
        total_price: totalPrice,
        payment_status: "pending",
        rental_status: "waiting_payment",
        payment_expired_at: expiryTime,
        created_by: auth.user.id,
      })
      .select("id, invoice_number")
      .single();

    if (rentalError || !rental) {
      console.error(
        "[create-doku-rental-checkout] Failed to create rental order:",
        rentalError?.message,
      );
      return jsonErrorWithDetails(req, 500, {
        error: "Failed to create rental order",
        details: rentalError?.message,
      });
    }

    createdRentalId = rental.id;

    // Prepare DOKU checkout request
    const requestId = createDokuRequestId();
    const requestTimestamp = createDokuRequestTimestamp();
    const requestTarget = getDokuCheckoutPath();

    const dokuPayload = {
      order: {
        invoice_number: invoiceNumber,
        amount: totalPrice,
        callback_url: `${publicAppUrl}/api/webhooks/doku-rental`,
        line_items: [
          {
            name: sanitizeDokuString(`Rental Rollerblade - ${payload.durationHours} Jam`, 255),
            price: totalPrice,
            quantity: 1,
          },
        ],
      },
      payment: {
        payment_due_date: PAYMENT_EXPIRY_MINUTES,
        payment_method_types: dokuEnv.paymentMethodTypes.includes("QRIS")
          ? ["QRIS"]
          : dokuEnv.paymentMethodTypes,
      },
      customer: {
        name: sanitizeDokuString(payload.customerName, 255),
        phone: payload.customerPhone
          ? sanitizeDokuString(payload.customerPhone, 20)
          : undefined,
      },
    };

    const dokuBody = JSON.stringify(dokuPayload);

    // Call DOKU API
    const dokuUrl = `${getDokuApiBaseUrl(dokuEnv.isProduction)}${requestTarget}`;
    const dokuHeaders = await buildDokuRequestHeaders({
      clientId: dokuEnv.clientId,
      requestId,
      requestTimestamp,
      requestTarget,
      secretKey: dokuEnv.secretKey,
      body: dokuBody,
    });

    const dokuResponse = await fetch(dokuUrl, {
      method: "POST",
      headers: {
        ...dokuHeaders,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: dokuBody,
    });

    const dokuData = await dokuResponse.json().catch(() => null);

    // Persist payment attempt
    const paymentAttempt = {
      timestamp: new Date().toISOString(),
      request_id: requestId,
      ...summarizeDokuHttpResponse(dokuResponse),
    };

    if (!dokuResponse.ok || !dokuData) {
      await persistRentalPaymentData({
        supabase,
        rentalId: rental.id,
        paymentData: mergeDokuPaymentData({
          existing: {},
          attempt: paymentAttempt,
        }),
      });

      console.error("[create-doku-rental-checkout] DOKU error:", dokuData);

      return jsonErrorWithDetails(req, 500, {
        error: "Failed to create payment checkout",
        details: dokuData,
      });
    }

    // Extract DOKU response
    const checkoutResponse = extractDokuCheckoutResponse(dokuData, requestId);

    if (!checkoutResponse.paymentUrl) {
      await persistRentalPaymentData({
        supabase,
        rentalId: rental.id,
        paymentData: mergeDokuPaymentData({
          existing: {},
          patch: dokuData,
          attempt: paymentAttempt,
        }),
      });

      return jsonErrorWithDetails(req, 500, {
        error: "No payment URL received from DOKU",
      });
    }

    // Update rental with payment info
    await persistRentalPaymentData({
      supabase,
      rentalId: rental.id,
      paymentData: mergeDokuPaymentData({
        existing: {},
        patch: dokuData,
        attempt: paymentAttempt,
      }),
      paymentId: checkoutResponse.paymentId,
      paymentUrl: checkoutResponse.paymentUrl,
      paymentExpiredAt: checkoutResponse.providerExpiresAt,
    });

    // Return success response
    const response: CreateRentalCheckoutResponse = {
      success: true,
      rentalId: rental.id,
      invoiceNumber: rental.invoice_number,
      totalPrice,
      paymentUrl: checkoutResponse.paymentUrl,
      paymentId: checkoutResponse.paymentId || requestId,
      checkoutSdkUrl: getDokuCheckoutSdkUrl(dokuEnv.isProduction),
      expiresAt: checkoutResponse.providerExpiresAt,
    };

    return json(req, response);
  } catch (error) {
    // Rollback on error
    if (createdRentalId) {
      const supabase = createServiceClient(
        req.headers.get("Authorization") ?? "",
      );
      await supabase.from("rentals").delete().eq("id", createdRentalId);
    }

    console.error("[create-doku-rental-checkout] Unhandled error:", error);

    return jsonError(req, 500, "Internal server error");
  }
});
