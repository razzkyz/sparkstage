import { serve } from "../_shared/deps.ts";
import {
  buildDokuRequestHeaders,
  createDokuRequestId,
  createDokuRequestTimestamp,
  getDokuApiBaseUrl,
  getDokuStatusPath,
  mapDokuStatus,
  verifyDokuSignature,
} from "../_shared/doku.ts";
import {
  handleCors,
  json,
  jsonError,
} from "../_shared/http.ts";
import {
  getDokuEnv,
} from "../_shared/env.ts";
import { createServiceClient } from "../_shared/supabase.ts";

interface DokuWebhookPayload {
  order?: {
    invoice_number?: string;
    status?: string;
  };
  transaction?: {
    status?: string;
  };
  payment?: {
    token_id?: string;
  };
}

async function processRentalPayment(params: {
  supabase: ReturnType<typeof createServiceClient>;
  invoiceNumber: string;
  status: string;
  paymentReference?: string;
}) {
  const { supabase, invoiceNumber, status, paymentReference } = params;

  // Get rental
  const { data: rental, error: fetchError } = await supabase
    .from("rentals")
    .select("*")
    .eq("invoice_number", invoiceNumber)
    .single();

  if (fetchError || !rental) {
    console.error("[doku-rental-webhook] Rental not found:", invoiceNumber);
    return { success: false, message: "Rental not found" };
  }

  // Don't downgrade from paid to pending
  if (rental.payment_status === "paid" && status === "pending") {
    console.log("[doku-rental-webhook] Ignoring downgrade from paid to pending");
    return { success: true, message: "Status unchanged (already paid)" };
  }

  // Update payment status
  const updateData: Record<string, unknown> = {
    payment_status: status,
    updated_at: new Date().toISOString(),
  };

  if (status === "paid") {
    updateData.paid_at = new Date().toISOString();
    if (paymentReference) {
      updateData.doku_payment_reference = paymentReference;
    }
  }

  if (status === "expired" || status === "failed") {
    // Keep waiting_payment status for failed/expired
    updateData.rental_status = "waiting_payment";
  }

  const { error: updateError } = await supabase
    .from("rentals")
    .update(updateData)
    .eq("id", rental.id);

  if (updateError) {
    console.error("[doku-rental-webhook] Failed to update rental:", updateError);
    return { success: false, message: "Failed to update rental" };
  }

  console.log(`[doku-rental-webhook] Updated rental ${invoiceNumber} to ${status}`);
  return { success: true, message: "Rental updated successfully" };
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return handleCors(req);
  }

  if (req.method !== "POST") {
    return jsonError(req, 405, "Method not allowed");
  }

  try {
    // Get DOKU environment
    const dokuEnv = getDokuEnv();

    // Read raw body for signature verification
    const rawBody = await req.text();
    let payload: DokuWebhookPayload;

    try {
      payload = JSON.parse(rawBody);
    } catch {
      return jsonError(req, 400, "Invalid JSON payload");
    }

    // Get signature headers
    const clientId = req.headers.get("Client-Id");
    const requestId = req.headers.get("Request-Id");
    const requestTimestamp = req.headers.get("Request-Timestamp");
    const signature = req.headers.get("Signature");
    const requestTarget = "/api/webhooks/doku-rental";

    if (!clientId || !requestId || !requestTimestamp || !signature) {
      console.error("[doku-rental-webhook] Missing signature headers");
      return jsonError(req, 400, "Missing signature headers");
    }

    // Verify signature
    const isValid = await verifyDokuSignature({
      clientId,
      requestId,
      requestTimestamp,
      requestTarget,
      secretKey: dokuEnv.secretKey,
      rawBody,
      providedSignature: signature,
    });

    if (!isValid) {
      console.error("[doku-rental-webhook] Invalid signature");
      return jsonError(req, 401, "Invalid signature");
    }

    // Extract data from payload
    const invoiceNumber = payload.order?.invoice_number;
    const orderStatus = payload.order?.status;
    const transactionStatus = payload.transaction?.status;
    const paymentReference = payload.payment?.token_id;

    if (!invoiceNumber) {
      return jsonError(req, 400, "Missing invoice_number");
    }

    // Map DOKU status to our status
    const mappedStatus = mapDokuStatus(transactionStatus, orderStatus);

    console.log(
      `[doku-rental-webhook] Processing ${invoiceNumber}: ${transactionStatus}/${orderStatus} -> ${mappedStatus}`,
    );

    // Create service client
    const supabase = createServiceClient("");

    // Process payment
    const result = await processRentalPayment({
      supabase,
      invoiceNumber,
      status: mappedStatus,
      paymentReference,
    });

    return json(req, {
      success: result.success,
      message: result.message,
    });
  } catch (error) {
    console.error("[doku-rental-webhook] Unhandled error:", error);
    return jsonError(req, 500, "Internal server error");
  }
});
