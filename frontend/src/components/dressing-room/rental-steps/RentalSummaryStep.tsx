import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, FileText, Loader2 } from 'lucide-react';
import { formatCurrency } from '../../../utils/formatters';
import type { RentalFormData } from '../RentalFlowModal';
import { RentalProductGallery } from '../RentalProductGallery';
import { invokeSupabaseFunction } from '../../../lib/supabaseFunctionInvoke';
import { supabase } from '../../../lib/supabase';

interface RentalSummaryStepProps {
  rentalData: RentalFormData;
  onPrev: () => void;
}

export default function RentalSummaryStep({
  rentalData,
  onPrev,
}: RentalSummaryStepProps) {
  const [agreedToTC, setAgreedToTC] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Calculate costs
  const totalRentalCost = rentalData.look.items.reduce((sum, item) => {
    const dailyRate = item.product_variant?.price || 0;
    return sum + dailyRate * rentalData.durationDays;
  }, 0);

  const totalDeposit = rentalData.look.items.reduce((sum, item) => {
    const price = item.product_variant?.price || 0;
    const deposit = item.product_variant?.deposit_amount || Math.ceil(price * 0.75);
    return sum + deposit;
  }, 0);

  const totalAmount = totalRentalCost + totalDeposit;

  const handleConfirm = async () => {
    setIsProcessing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const items = rentalData.look.items.map((item) => ({
        productVariantId: item.product_variant_id,
        productName: item.product_variant?.name || item.label || 'Unknown',
        dailyRate: item.product_variant?.price || 0,
        depositAmount: item.product_variant?.deposit_amount || Math.ceil((item.product_variant?.price || 0) * 0.75),
        quantity: 1,
        initialCondition: rentalData.initialCondition?.[item.id],
      }));

      const data = await invokeSupabaseFunction<{
        payment_provider: string;
        payment_url: string;
        payment_sdk_url: string;
        payment_due_date: string;
        order_number: string;
        order_id: number;
      }>({
        functionName: 'create-doku-rental-checkout',
        body: {
          items,
          durationDays: rentalData.durationDays,
          rentalStartTime: rentalData.rentalStartTime.toISOString(),
          rentalEndTime: rentalData.rentalEndTime.toISOString(),
          customerName: rentalData.customerData.fullName,
          customerEmail: rentalData.customerData.email,
          customerPhone: rentalData.customerData.phone,
          customerAddress: rentalData.customerData.address,
          initialCondition: rentalData.initialCondition,
        },
        headers: { Authorization: `Bearer ${session.access_token}` },
        fallbackMessage: 'Failed to create payment checkout',
      });

      // Redirect to DOKU payment page
      if (data.payment_url) {
        window.location.href = data.payment_url;
      }
    } catch (error) {
      console.error('Payment checkout error:', error);
      alert(error instanceof Error ? error.message : 'Failed to create payment checkout');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      {/* Step indicator */}
      <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-gray-500">
        <span className="h-2 w-2 rounded-full bg-main-500" />
        <span>Step 4: Summary & Konfirmasi</span>
      </div>

      {/* Product Gallery */}
      <RentalProductGallery look={rentalData.look} showPricing={true} durationDays={rentalData.durationDays} />

      {/* Summary sections */}
      <div className="max-h-96 space-y-4 overflow-y-auto">
        {/* Rental Period */}
        <div className="rounded-lg border border-gray-200 p-4">
          <h4 className="font-bold text-sm uppercase tracking-wider text-gray-900 mb-3">
            📅 Periode Sewa
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Mulai:</span>
              <span className="font-semibold text-gray-900">
                {rentalData.rentalStartTime.toLocaleDateString('id-ID', {
                  weekday: 'short',
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Kembali:</span>
              <span className="font-semibold text-gray-900">
                {rentalData.rentalEndTime.toLocaleDateString('id-ID', {
                  weekday: 'short',
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
            <div className="flex justify-between text-main-600 font-bold">
              <span>Durasi:</span>
              <span>{rentalData.durationDays} hari</span>
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="rounded-lg border border-gray-200 p-4">
          <h4 className="font-bold text-sm uppercase tracking-wider text-gray-900 mb-3">
            👕 Items yang Disewa ({rentalData.look.items.length})
          </h4>
          <div className="space-y-2">
            {rentalData.look.items.map((item) => {
              const dailyRate = item.product_variant?.price || 0;
              const deposit = item.product_variant?.deposit_amount || Math.ceil(dailyRate * 0.75);
              const totalItemCost = dailyRate * rentalData.durationDays;

              return (
                <div key={item.id} className="rounded-lg bg-gray-50 p-3 text-sm space-y-1">
                  <p className="font-semibold text-gray-900">
                    {item.label || item.product_variant?.name}
                  </p>
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>Sewa:</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(totalItemCost)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-yellow-700 bg-yellow-50 px-2 py-1 rounded">
                    <span>Deposit:</span>
                    <span className="font-semibold">{formatCurrency(deposit)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Customer Info */}
        <div className="rounded-lg border border-gray-200 p-4">
          <h4 className="font-bold text-sm uppercase tracking-wider text-gray-900 mb-3">
            👤 Data Customer
          </h4>
          <div className="space-y-2 text-sm">
            <div>
              <p className="text-gray-600 text-xs">Nama</p>
              <p className="font-semibold text-gray-900">{rentalData.customerData.fullName}</p>
            </div>
            <div>
              <p className="text-gray-600 text-xs">Email</p>
              <p className="font-semibold text-gray-900">{rentalData.customerData.email}</p>
            </div>
            <div>
              <p className="text-gray-600 text-xs">No HP</p>
              <p className="font-semibold text-gray-900">{rentalData.customerData.phone}</p>
            </div>
          </div>
        </div>

        {/* Total Cost */}
        <div className="rounded-lg bg-main-50 p-4 border border-main-200">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total Sewa ({rentalData.durationDays} hari):</span>
              <span className="font-bold text-gray-900">{formatCurrency(totalRentalCost)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total Deposit:</span>
              <span className="font-bold text-yellow-700">{formatCurrency(totalDeposit)}</span>
            </div>
            <div className="border-t border-main-200 pt-2 flex justify-between">
              <span className="font-bold text-gray-900">Total Bayar:</span>
              <span className="text-2xl font-black text-main-600">{formatCurrency(totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* T&C Agreement */}
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
          <button
            type="button"
            onClick={() => setAgreedToTC(!agreedToTC)}
            className="w-full flex items-start gap-3 p-3 -m-3"
          >
            <div className="shrink-0 pt-1">
              <div
                className={`h-5 w-5 rounded border-2 flex items-center justify-center transition-all ${
                  agreedToTC
                    ? 'bg-main-500 border-main-500'
                    : 'border-gray-300 bg-white'
                }`}
              >
                {agreedToTC && <Check className="w-3 h-3 text-white" />}
              </div>
            </div>
            <div className="text-left flex-1">
              <p className="font-semibold text-sm text-gray-900">
                Saya setuju dengan Syarat & Ketentuan
              </p>
              <p className="text-xs text-gray-600 mt-1">
                ✓ Telah membaca T&C deposit
                <br />✓ Bertanggung jawab atas kondisi barang
                <br />✓ Akan mengembalikan tepat waktu
              </p>
            </div>
          </button>
        </div>

        {/* Invoice Info */}
        <div className="rounded-lg bg-gray-50 p-4 text-xs text-gray-700 space-y-2 flex items-start gap-3">
          <FileText className="w-4 h-4 shrink-0 text-gray-400 mt-0.5" />
          <div>
            <p className="font-semibold text-gray-900">Invoice & Konfirmasi</p>
            <p className="mt-1">Invoice sewa akan dikirim ke email & WhatsApp. Simpan invoice untuk keperluan pengembalian dan klaim refund.</p>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onPrev}
          className="flex-1 px-4 py-3 border border-gray-300 bg-white text-sm font-bold uppercase tracking-wider text-gray-900 hover:bg-gray-50 transition-colors"
        >
          Kembali
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={!agreedToTC || isProcessing}
          className={`flex-1 px-4 py-3 text-sm font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
            agreedToTC
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Memproses...
            </>
          ) : (
            '✓ Konfirmasi Sewa'
          )}
        </button>
      </div>
    </motion.div>
  );
}
