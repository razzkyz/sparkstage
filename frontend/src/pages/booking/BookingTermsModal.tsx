import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

type BookingTermsModalProps = {
  open: boolean;
  onClose: () => void;
  onAgree: () => void;
};

const TERMS = [
  'Harap tiba 15 menit sebelum sesi Anda dimulai.',
  'Booking hanya berlaku untuk tanggal dan waktu yang dipilih.',
  'Setiap tiket berlaku untuk satu orang.',
  'Ini adalah pengalaman sesi bersama dengan peserta lain.',
  'Durasi pengalaman adalah 2,5 jam termasuk 15 tahap.',
  'Tidak diizinkan membawa makanan atau minuman dari luar.',
  'Tiket yang sudah dibeli tidak dapat dibatalkan, dikembalikan, maupun di-reschedule.',
  'Pembelian tiket on the spot tetap mengikuti sesi dan slot waktu yang sedang berjalan serta ketersediaan sesi.',
  'Keterlambatan hadir dapat mengurangi durasi pengalaman sesuai waktu sesi yang berjalan.',
  'Anak di bawah 5 tahun tidak perlu membeli tiket.',
  '🧦 WAJIB membawa kaos kaki untuk area lepas alas kaki & penggunaan costume sepatu.',
];

/** Each bullet delay: 120 ms apart, starting after a 200 ms header delay */
const ITEM_BASE_DELAY_MS = 200;
const ITEM_STAGGER_MS = 90;

export function BookingTermsModal({ open, onClose, onAgree }: BookingTermsModalProps) {
  const [agreed, setAgreed] = useState(false);
  // "animate" flag — reset on every open so items re-stagger
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (open) {
      // Small tick so CSS transition picks up from opacity:0
      const t = setTimeout(() => setAnimate(true), 30);
      return () => clearTimeout(t);
    } else {
      setAnimate(false);
      setAgreed(false);
    }
  }, [open]);

  if (!open) return null;

  const handleClose = () => {
    setAgreed(false);
    onClose();
  };

  const handleAgree = () => {
    if (!agreed) return;
    setAgreed(false);
    onAgree();
  };

  const modal = (
    /* Overlay — rendered into document.body via portal, z-[200] beats navbar z-[110] */
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="terms-modal-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'max(env(safe-area-inset-top, 16px), 16px) max(env(safe-area-inset-right, 16px), 16px) max(env(safe-area-inset-bottom, 16px), 16px) max(env(safe-area-inset-left, 16px), 16px)',
        backgroundColor: 'rgba(0,0,0,0.72)',
        backdropFilter: 'blur(5px)',
        WebkitBackdropFilter: 'blur(5px)',
        // Overlay itself fades in
        opacity: animate ? 1 : 0,
        transition: 'opacity 0.25s ease',
      }}
      onClick={handleClose}
    >
      {/* Card */}
      <div
        style={{
          background: '#fff',
          borderRadius: '20px',
          boxShadow: '0 25px 60px rgba(0,0,0,0.35)',
          width: '100%',
          maxWidth: '480px',
          maxHeight: 'calc(100dvh - 32px)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          // Card slides up
          transform: animate ? 'translateY(0)' : 'translateY(28px)',
          opacity: animate ? 1 : 0,
          transition: 'transform 0.32s cubic-bezier(0.22,1,0.36,1), opacity 0.25s ease',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header — animates in first ── */}
        <div
          style={{
            background: 'linear-gradient(135deg, #ff2d72 0%, #ff4b86 55%, #ff7eb3 100%)',
            padding: '20px 24px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            flexShrink: 0,
            // Slides in from top, slightly delayed
            opacity: animate ? 1 : 0,
            transform: animate ? 'translateY(0)' : 'translateY(-12px)',
            transition: 'opacity 0.3s ease 0.05s, transform 0.35s cubic-bezier(0.22,1,0.36,1) 0.05s',
          }}
        >
          <div
            style={{
              flexShrink: 0,
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.22)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span className="material-symbols-outlined" style={{ color: '#fff', fontSize: '22px' }}>
              gavel
            </span>
          </div>
          <div>
            <h2
              id="terms-modal-title"
              style={{ color: '#fff', fontWeight: 900, fontSize: '17px', lineHeight: 1.2, margin: 0 }}
            >
              Ketentuan &amp; Keterangan Booking
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.82)', fontSize: '12px', margin: '4px 0 0' }}>
              Baca seluruh ketentuan sebelum melanjutkan
            </p>
          </div>
        </div>

        {/* ── Scrollable body ── */}
        <div style={{ overflowY: 'auto', flex: 1, minHeight: 0, padding: '20px 24px 8px' }}>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {TERMS.map((term, i) => {
              const delay = ITEM_BASE_DELAY_MS + i * ITEM_STAGGER_MS;
              return (
                <li
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    opacity: animate ? 1 : 0,
                    transform: animate ? 'translateX(0)' : 'translateX(-14px)',
                    transition: `opacity 0.3s ease ${delay}ms, transform 0.35s cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
                  }}
                >
                  <span
                    style={{
                      flexShrink: 0,
                      marginTop: '2px',
                      width: '20px',
                      height: '20px',
                      minWidth: '20px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #ff2d72, #ff7eb3)',
                      color: '#fff',
                      fontSize: '10px',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {i + 1}
                  </span>
                  <span style={{ color: '#374151', fontSize: '13.5px', lineHeight: 1.55 }}>{term}</span>
                </li>
              );
            })}
          </ul>

          {/* Final no-refund alert — animates last */}
          <div
            style={{
              marginTop: '16px',
              padding: '12px 14px',
              borderRadius: '12px',
              background: '#fff0f5',
              border: '1.5px solid #ff4b86',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              opacity: animate ? 1 : 0,
              transform: animate ? 'translateY(0)' : 'translateY(10px)',
              transition: `opacity 0.35s ease ${ITEM_BASE_DELAY_MS + TERMS.length * ITEM_STAGGER_MS}ms, transform 0.4s cubic-bezier(0.22,1,0.36,1) ${ITEM_BASE_DELAY_MS + TERMS.length * ITEM_STAGGER_MS}ms`,
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ color: '#ff4b86', fontSize: '18px', flexShrink: 0, marginTop: '1px' }}
            >
              error
            </span>
            <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#c4003a', lineHeight: 1.5 }}>
              🔴 Semua pembayaran bersifat final dan tidak dapat dikembalikan.
            </p>
          </div>
        </div>

        {/* ── Checkbox + Actions (sticky footer) ── */}
        <div
          style={{
            flexShrink: 0,
            padding: '14px 24px 20px',
            borderTop: '1px solid #f3f4f6',
            background: '#fff',
            opacity: animate ? 1 : 0,
            transition: `opacity 0.35s ease ${ITEM_BASE_DELAY_MS + (TERMS.length + 1) * ITEM_STAGGER_MS}ms`,
          }}
        >
          {/* Checkbox */}
          <label
            htmlFor="terms-checkbox"
            style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', marginBottom: '14px' }}
          >
            <input
              id="terms-checkbox"
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              style={{ marginTop: '2px', width: '16px', height: '16px', cursor: 'pointer', accentColor: '#ff4b86', flexShrink: 0 }}
            />
            <span style={{ fontSize: '13px', color: '#374151', lineHeight: 1.5 }}>
              Saya telah membaca dan <strong>menyetujui</strong> seluruh ketentuan di atas.
            </span>
          </label>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleClose}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '12px',
                border: '2px solid #e5e7eb',
                background: '#fff',
                fontSize: '13px',
                fontWeight: 700,
                color: '#6b7280',
                cursor: 'pointer',
                transition: 'background 0.15s',
              }}
              onMouseOver={(e) => (e.currentTarget.style.background = '#f9fafb')}
              onMouseOut={(e) => (e.currentTarget.style.background = '#fff')}
            >
              Batal
            </button>
            <button
              onClick={handleAgree}
              disabled={!agreed}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '12px',
                border: 'none',
                background: agreed
                  ? 'linear-gradient(135deg, #ff2d72 0%, #ff4b86 55%, #ff7eb3 100%)'
                  : '#e5e7eb',
                color: agreed ? '#fff' : '#9ca3af',
                fontSize: '13px',
                fontWeight: 800,
                cursor: agreed ? 'pointer' : 'not-allowed',
                boxShadow: agreed ? '0 4px 18px rgba(255,75,134,0.38)' : 'none',
                transition: 'background 0.2s, box-shadow 0.2s, color 0.2s',
              }}
            >
              ✓ Setuju &amp; Lanjut Bayar
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
