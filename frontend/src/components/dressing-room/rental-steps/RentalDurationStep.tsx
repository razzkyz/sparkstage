import { useState } from 'react';
import { motion } from 'framer-motion';
import { formatCurrency } from '../../../utils/formatters';
import type { DressingRoomLook } from '../../../hooks/useDressingRoomCollection';
import type { RentalFormData } from '../RentalFlowModal';
import { RentalProductGallery } from '../RentalProductGallery';

interface RentalDurationStepProps {
  look: DressingRoomLook;
  defaultDuration: number;
  onNext: (data: Partial<RentalFormData>) => void;
  onClose: () => void;
}

export default function RentalDurationStep({
  look,
  defaultDuration,
  onNext,
  onClose,
}: RentalDurationStepProps) {
  const [durationDays, setDurationDays] = useState(defaultDuration);
  const [rentalStartTime] = useState(new Date());

  // Calculate rental end time
  const rentalEndTime = new Date(rentalStartTime);
  rentalEndTime.setDate(rentalEndTime.getDate() + durationDays);

  // Daily rental fee per item - new pricing
  const DAILY_FEE_PER_ITEM = 35000; // 35k per day per item

  // Calculate total rental cost (daily rate × number of items × duration)
  const totalRentalCost = look.items.length * DAILY_FEE_PER_ITEM * durationDays;

  // Calculate total product price
  const totalProductPrice = look.items.reduce((sum, item) => {
    const price = item.product_variant?.price || 0;
    return sum + price;
  }, 0);

  // Calculate total deposit - fixed 50k per item
  const totalDeposit = look.items.length * 50000; // Fixed 50k deposit per item

  const totalAmount = totalProductPrice + totalRentalCost + totalDeposit;

  const handleNext = () => {
    onNext({
      durationDays,
      rentalStartTime,
      rentalEndTime,
    });
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
        <span>Step 1: Durasi Sewa</span>
      </div>

      {/* Product Gallery */}
      <RentalProductGallery look={look} showPricing={true} durationDays={durationDays} />

      {/* Duration selection */}
      <div className="space-y-4">
        <h3 className="font-bold uppercase tracking-wider text-gray-900">Pilih Durasi Sewa</h3>
        
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-7">
          {[1, 2, 3, 4, 5, 6, 7].map((days) => (
            <button
              key={days}
              type="button"
              onClick={() => setDurationDays(days)}
              className={`py-3 px-2 rounded-lg border-2 font-bold transition-all text-sm ${
                durationDays === days
                  ? 'border-main-500 bg-main-50 text-main-600'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
              }`}
            >
              {days} {days === 1 ? 'hari' : 'hari'}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline info */}
      <div className="rounded-lg bg-gray-50 p-4 space-y-2">
        <div className="text-sm">
          <p className="text-gray-600">Mulai Sewa:</p>
          <p className="font-bold text-gray-900">
            {rentalStartTime.toLocaleDateString('id-ID', {
              weekday: 'short',
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
        <div className="text-sm">
          <p className="text-gray-600">Harus Kembali:</p>
          <p className="font-bold text-gray-900">
            {rentalEndTime.toLocaleDateString('id-ID', {
              weekday: 'short',
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
      </div>

      {/* Items list with pricing */}
      <div className="space-y-3">
        <h4 className="font-bold uppercase tracking-wider text-gray-900 text-sm">
          Detail Harga {durationDays} Hari
        </h4>
        <div className="max-h-64 space-y-2 overflow-y-auto">
          {look.items.map((item) => {
            const price = item.product_variant?.price || 0;
            const dailyFee = DAILY_FEE_PER_ITEM;
            const deposit = 50000; // Fixed 50k deposit per item
            const rentalCost = dailyFee * durationDays;
            const itemTotal = price + deposit + rentalCost;

            return (
              <div key={item.id} className="rounded-lg border border-gray-200 p-3 text-sm">
                <div className="mb-2 flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {item.label || item.product_variant?.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {item.product_variant?.product?.name}
                    </p>
                  </div>
                </div>
                <div className="space-y-1 text-xs text-gray-600 border-t border-gray-100 pt-2">
                  <div className="flex justify-between">
                    <span>Harga:</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(price)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sewa/hari:</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(dailyFee)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total sewa ({durationDays} hari):</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(rentalCost)}</span>
                  </div>
                  <div className="flex justify-between bg-yellow-50 px-2 py-1 rounded">
                    <span>Deposit:</span>
                    <span className="font-semibold text-yellow-700">{formatCurrency(deposit)}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-1 mt-1 flex justify-between font-bold">
                    <span>Total Item:</span>
                    <span className="text-main-600">{formatCurrency(itemTotal)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary */}
      <div className="rounded-lg bg-main-50 p-4 border border-main-200">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Total Harga Produk:</span>
            <span className="font-semibold text-gray-900">{formatCurrency(totalProductPrice)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Total Sewa ({durationDays} hari):</span>
            <span className="font-semibold text-gray-900">{formatCurrency(totalRentalCost)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Total Deposit:</span>
            <span className="font-bold text-yellow-700">{formatCurrency(totalDeposit)}</span>
          </div>
          <div className="border-t border-main-200 pt-2 flex justify-between">
            <span className="font-bold text-gray-900">Total Bayar:</span>
            <span className="text-lg font-black text-main-600">{formatCurrency(totalAmount)}</span>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 px-4 py-3 border border-gray-300 bg-white text-sm font-bold uppercase tracking-wider text-gray-900 hover:bg-gray-50 transition-colors"
        >
          Batal
        </button>
        <button
          type="button"
          onClick={handleNext}
          className="flex-1 px-4 py-3 bg-main-500 text-sm font-bold uppercase tracking-wider text-white hover:bg-main-600 transition-colors"
        >
          Lanjut
        </button>
      </div>
    </motion.div>
  );
}
