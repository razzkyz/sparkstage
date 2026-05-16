import { formatCurrency } from '../../utils/formatters';
import type { PaymentBookingDetails } from './paymentTypes';

type PaymentCustomerFormProps = {
  bookingDetails: PaymentBookingDetails;
  loading: boolean;
  checkoutReady: boolean;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  onChangeCustomerName: (value: string) => void;
  onChangeCustomerPhone: (value: string) => void;
  onPay: () => void;
};

export function PaymentCustomerForm({
  bookingDetails,
  loading,
  checkoutReady,
  customerName,
  customerPhone,
  customerEmail,
  onChangeCustomerName,
  onChangeCustomerPhone,
  onPay,
}: PaymentCustomerFormProps) {
  const nameInputId = 'payment-customer-name';
  const phoneInputId = 'payment-customer-phone';
  const emailInputId = 'payment-customer-email';

  return (
    <div className="bg-white p-6 rounded-xl border border-rose-100 shadow-sm">
      <h1 className="text-2xl font-bold mb-6">Complete Payment</h1>

      <div className="space-y-5 mb-8">
        <div className="space-y-1.5">
          <label htmlFor={nameInputId} className="text-sm font-semibold text-neutral-950">
            Your Name <span className="text-red-500">*</span>
          </label>
          <input
            id={nameInputId}
            type="text"
            value={customerName}
            onChange={(event) => onChangeCustomerName(event.target.value)}
            className="w-full rounded-lg border border-rose-100 focus:ring-primary focus:border-primary text-sm py-3 px-4"
            placeholder="Enter your full name"
            disabled={loading}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor={phoneInputId} className="text-sm font-semibold text-neutral-950">
            WhatsApp Number <span className="text-amber-500">*Untuk Reminder</span>
          </label>
          <input
            id={phoneInputId}
            type="tel"
            value={customerPhone}
            onChange={(event) => onChangeCustomerPhone(event.target.value)}
            className="w-full rounded-lg border border-rose-100 focus:ring-primary focus:border-primary text-sm py-3 px-4"
            placeholder="628XXXXXXXX"
            disabled={loading}
          />
          <p className="text-xs text-amber-600">
            Masukan +628xxxx. Kami akan mengirim reminder ke WhatsApp ini untuk datang lebih awal.
          </p>
        </div>

        <div className="space-y-1.5">
          <label htmlFor={emailInputId} className="text-sm font-semibold text-neutral-950">Email</label>
          <input
            id={emailInputId}
            type="email"
            value={customerEmail}
            className="w-full rounded-lg border border-rose-100 text-sm py-3 px-4 bg-gray-50"
            disabled
          />
          <p className="text-xs text-rose-700">Used to identify your booking.</p>
        </div>
      </div>

      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
        <div className="flex items-start gap-3">
          <span className="material-symbols-outlined text-blue-500">info</span>
          <div>
            <p className="text-sm font-medium text-blue-800">Secure Payment via DOKU Checkout</p>
            <p className="text-xs text-blue-600 mt-1">
              The DOKU payment popup will open after you continue. Complete payment there, then return here to view your order status.
            </p>
          </div>
        </div>
      </div>

      {/* SPARK CLUB Points Info */}
      {bookingDetails.quantity > 0 && (
        <div
          className="mb-4 rounded-xl px-4 py-3 flex items-center gap-3"
          style={{ background: 'linear-gradient(135deg, #fff0f5, #ffe4ef)', border: '1px solid rgba(255,75,134,0.2)' }}
        >
          <span className="text-2xl flex-shrink-0">⭐</span>
          <div className="min-w-0">
            <p className="text-sm font-bold" style={{ color: '#e63d75' }}>
              Kamu akan dapat {(bookingDetails.quantity * 20).toLocaleString()} SPARK CLUB Points!
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {bookingDetails.quantity} tiket × 20 poin — bisa ditukar jadi diskon belanja di SPARK CLUB 🎁
            </p>
          </div>
        </div>
      )}

      <button
        onClick={onPay}
        disabled={loading || !bookingDetails.ticketId || !bookingDetails.price || !checkoutReady}
        className="w-full bg-[#ff4b86] hover:bg-[#e63d75] disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <span className="material-symbols-outlined animate-spin">progress_activity</span>
            Processing...
          </>
        ) : (
          <>
            <span className="material-symbols-outlined text-[20px]">lock</span>
            Pay {formatCurrency(bookingDetails.total)} Now
          </>
        )}
      </button>

      <div className="mt-6 pt-6 border-t border-rose-100">
        <p className="text-xs text-center text-rose-700 mb-3">Supported Payment Methods</p>
        <div className="flex justify-center items-center gap-4 flex-wrap opacity-60">
          <div className="px-3 py-1 bg-slate-900 rounded text-white text-[10px] font-bold">Cards</div>
          <div className="px-3 py-1 bg-blue-700 rounded text-white text-[10px] font-bold">VA</div>
          <div className="px-3 py-1 bg-emerald-600 rounded text-white text-[10px] font-bold">E-Wallet</div>
          <div className="px-3 py-1 bg-orange-500 rounded text-white text-[10px] font-bold">OTO</div>
          <div className="px-3 py-1 bg-gray-800 rounded text-white text-[10px] font-bold">QRIS</div>
        </div>
      </div>
    </div>
  );
}
