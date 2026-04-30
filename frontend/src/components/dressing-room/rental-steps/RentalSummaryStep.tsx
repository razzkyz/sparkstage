import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, FileText, Loader2 } from 'lucide-react';
import { formatCurrency } from '../../../utils/formatters';
import type { RentalFormData } from '../RentalFlowModal';
import { RentalProductGallery } from '../RentalProductGallery';
import { useCart } from '../../../contexts/cartStore';
import { useNavigate } from 'react-router-dom';

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
  const { addItem } = useCart();
  const navigate = useNavigate();

  // Calculate costs - new pricing model
  const DAILY_FEE_PER_ITEM = 15000; // 15k per day per item

  // Calculate deposit based on product price
  const totalDeposit = rentalData.look.items.reduce((sum, item) => {
    const price = item.product_variant?.price || 0;
    // Deposit formula: 100k + (price - 150k) * 0.4, minimum 100k
    const deposit = 100000 + Math.max(0, (price - 150000) * 0.4);
    return sum + deposit;
  }, 0);

  const totalRentalCost = rentalData.look.items.length * DAILY_FEE_PER_ITEM * rentalData.durationDays;
  const totalAmount = totalDeposit + totalRentalCost;

  const handleConfirm = async () => {
    setIsProcessing(true);
    try {
      // Add all items to cart
      console.log('Rental data items:', rentalData.look.items);
      for (const item of rentalData.look.items) {
        console.log('Adding item to cart:', item);
        console.log('Product variant:', item.product_variant);
        console.log('Product:', item.product_variant?.product);
        if (!item.product_variant?.id || !item.product_variant?.name) continue;

        const price = item.product_variant.price || 0;
        const itemDailyFee = DAILY_FEE_PER_ITEM;
        const itemDeposit = 100000 + Math.max(0, (price - 150000) * 0.4);
        const itemTotalRentalCost = itemDailyFee * rentalData.durationDays;

        addItem(
          {
            productId: item.product_variant.product?.id || 0,
            productName: item.product_variant.product?.name || item.label || 'Unknown',
            productImageUrl: item.product_variant.product?.image_url || undefined,
            variantId: item.product_variant.id,
            variantName: item.product_variant.name,
            unitPrice: itemTotalRentalCost, // Total rental cost (daily fee × duration)
            isRental: true,
            rentalDailyRate: itemDailyFee,
            rentalDurationDays: rentalData.durationDays,
            depositAmount: itemDeposit,
          },
          1
        );
      }

      // Navigate to cart page
      navigate('/cart');
    } catch (error) {
      console.error('Failed to add to cart:', error);
      alert(error instanceof Error ? error.message : 'Failed to add items to cart');
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
              const price = item.product_variant?.price || 0;
              const itemDailyFee = DAILY_FEE_PER_ITEM;
              const itemDeposit = 100000 + Math.max(0, (price - 150000) * 0.4);
              const totalItemCost = itemDailyFee * rentalData.durationDays;

              return (
                <div key={item.id} className="rounded-lg bg-gray-50 p-3 text-sm space-y-1">
                  <p className="font-semibold text-gray-900">
                    {item.label || item.product_variant?.name}
                  </p>
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>Sewa ({itemDailyFee.toLocaleString()} × {rentalData.durationDays} hari):</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(totalItemCost)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-yellow-700 bg-yellow-50 px-2 py-1 rounded">
                    <span>Deposit:</span>
                    <span className="font-semibold">{formatCurrency(itemDeposit)}</span>
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
