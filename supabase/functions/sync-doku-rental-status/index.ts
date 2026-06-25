import { serve } from "../_shared/deps.ts";
import {
  fetchDokuOrderStatus,
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
import { requireAuthenticatedRequest } from "../_shared/auth.ts";

interface SyncRentalStatusRequest {
  rentalId: number;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return handleCors(req);
  }

  if (req.method !== "POST") {
    return jsonError(req, 405, "Method not allowed");
  }

  try {
    // Auth check
    const auth = await requireAuthenticatedRequest(req);
    if (!auth.user) {
      return jsonError(req, 401, "Unauthorized");
    }

    // Parse request
    const payload: SyncRentalStatusRequest = await req.json();

    if (!payload.rentalId) {
      return jsonError(req, 400, "rental_id is required");
    }

    // Create Supabase client
    const supabase = createServiceClient(
      req.headers.get("Authorization") ?? "",
    );

    // Get rental
    const { data: rental, error: fetchError } = await supabase
      .from("rentals")
      .select("*")
      .eq("id", payload.rentalId)
      .single();

    if (fetchError || !rental) {
      return jsonError(req, 404, "Rental not found");
    }

    // Don't sync if already paid
    if (rental.payment_status === "paid") {
      return json(req, {
        success: true,
        message: "Already paid",
        status: "paid",
      });
    }

    // Get DOKU environment
    const dokuEnv = getDokuEnv();

    // Fetch status from DOKU
    const statusResponse = await fetchDokuOrderStatus({
      clientId: dokuEnv.clientId,
      secretKey: dokuEnv.secretKey,
      isProduction: dokuEnv.isProduction,
      orderNumber: rental.invoice_number,
    });

    if (!statusResponse.ok) {
      console.error("[sync-doku-rental-status] DOKU API error:", statusResponse);
      return jsonError(req, 500, "Failed to fetch status from DOKU");
    }

    // Update rental with new status
    const updateData: Record<string, unknown> = {
      payment_status: statusResponse.provider_status,
      updated_at: new Date().toISOString(),
    };

    if (statusResponse.provider_status === "paid" && !rental.paid_at) {
      updateData.paid_at = new Date().toISOString();
    }

    const { error: updateError } = await supabase
      .from("rentals")
      .update(updateData)
      .eq("id", rental.id);

    if (updateError) {
      console.error("[sync-doku-rental-status] Failed to update rental:", updateError);
      return jsonError(req, 500, "Failed to update rental status");
    }

    return json(req, {
      success: true,
      message: "Status synced successfully",
      status: statusResponse.provider_status,
      rental_id: rental.id,
    });
  } catch (error) {
    console.error("[sync-doku-rental-status] Unhandled error:", error);
    return jsonError(req, 500, "Internal server error");
  }
});
