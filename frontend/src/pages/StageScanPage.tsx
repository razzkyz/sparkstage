import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { createQuerySignal } from '../lib/fetchers';

type Stage = {
  id: number;
  code: string;
  name: string;
  description: string | null;
  zone: string | null;
  status: string;
};

type ScanState = 'idle' | 'scanning' | 'success' | 'error' | 'inactive';

/* ─── Loading Skeleton ───────────────────────────────────────── */
const ScanLoadingScreen = () => (
  <div className="min-h-screen bg-gradient-to-br from-[#fff1f6] to-white flex items-center justify-center p-4">
    <div className="text-center">
      <div className="relative mx-auto mb-8 h-24 w-24">
        <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
        <div className="absolute inset-2 animate-ping rounded-full bg-primary/30" style={{ animationDelay: '150ms' }} />
        <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-xl border border-primary/20">
          <span className="material-symbols-outlined text-4xl text-primary">qr_code_scanner</span>
        </div>
      </div>
      <p className="text-lg font-bold text-gray-900">Memproses QR Code...</p>
      <p className="mt-1 text-sm text-gray-500">Mohon tunggu sebentar</p>
    </div>
  </div>
);

/* ─── Login Prompt ───────────────────────────────────────────── */
const LoginPromptScreen = ({ stageName, onRetry }: { stageName?: string; onRetry: () => void }) => (
  <div className="min-h-screen bg-gradient-to-br from-[#fff1f6] to-white flex items-center justify-center p-4">
    <div className="w-full max-w-sm">
      <div className="rounded-2xl border border-primary/20 bg-white p-8 shadow-2xl shadow-primary/10 text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
          <span className="material-symbols-outlined text-4xl text-primary">lock_person</span>
        </div>
        <h2 className="mb-2 text-2xl font-black text-gray-900">Login Diperlukan</h2>
        {stageName && (
          <p className="mb-1 text-sm font-semibold text-primary">Stage: {stageName}</p>
        )}
        <p className="mb-6 text-sm text-gray-500">
          Login terlebih dahulu agar kunjungan kamu tercatat dan stage gallery bisa diakses.
        </p>
        <button
          onClick={onRetry}
          className="w-full rounded-xl bg-primary py-3.5 text-sm font-bold text-white shadow-lg shadow-primary/30 hover:bg-primary/90 transition-all active:scale-95"
        >
          Login Sekarang
        </button>
        <Link
          to="/"
          className="mt-3 block text-center text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  </div>
);

/* ─── Error Screen ───────────────────────────────────────────── */
const ErrorScreen = ({ message, onRetry }: { message: string; onRetry: () => void }) => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
    <div className="w-full max-w-sm">
      <div className="rounded-2xl border border-red-100 bg-white p-8 shadow-xl text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-50">
          <span className="material-symbols-outlined text-4xl text-red-500">error_outline</span>
        </div>
        <h2 className="mb-2 text-xl font-bold text-gray-900">Scan Gagal</h2>
        <p className="mb-6 text-sm text-gray-500">{message}</p>
        <div className="space-y-2">
          <button
            onClick={onRetry}
            className="w-full rounded-xl border border-gray-200 bg-white py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Coba Lagi
          </button>
          <Link
            to="/"
            className="block w-full rounded-xl bg-gray-900 py-3 text-sm font-semibold text-white hover:bg-gray-800 transition-colors"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    </div>
  </div>
);

/* ─── Inactive Stage Screen ──────────────────────────────────── */
const InactiveScreen = ({ stage }: { stage: Stage }) => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
    <div className="w-full max-w-sm text-center">
      <div className="rounded-2xl border border-orange-100 bg-white p-8 shadow-xl">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-orange-50">
          <span className="material-symbols-outlined text-4xl text-orange-500">construction</span>
        </div>
        <p className="mb-1 text-xs font-mono text-gray-400">{stage.code}</p>
        <h2 className="mb-2 text-xl font-bold text-gray-900">{stage.name}</h2>
        <p className="mb-6 text-sm text-gray-500">
          Stage ini sedang dalam <strong>{stage.status === 'maintenance' ? 'perawatan' : 'nonaktif'}</strong>. Silakan kunjungi stage lain.
        </p>
        <Link
          to="/on-stage"
          className="block w-full rounded-xl bg-gray-900 py-3 text-sm font-semibold text-white hover:bg-gray-800 transition-colors"
        >
          Lihat Stage Lain
        </Link>
      </div>
    </div>
  </div>
);

/* ─── Success Screen ─────────────────────────────────────────── */
const SuccessScreen = ({ stage, scannedAt }: { stage: Stage; scannedAt: Date }) => {
  const [secondsLeft, setSecondsLeft] = useState(5);
  const navigate = useNavigate();

  useEffect(() => {
    if (secondsLeft <= 0) {
      navigate(`/stage/${stage.code}`);
      return;
    }
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft, navigate, stage.code]);

  const circumference = 2 * Math.PI * 20; // r=20
  const progress = (secondsLeft / 5) * circumference;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fff1f6] via-white to-[#fff1f6] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Success card */}
        <div className="rounded-2xl border border-green-100 bg-white p-8 shadow-2xl shadow-green-500/10 text-center">
          {/* Checkmark icon */}
          <div className="relative mx-auto mb-6 h-24 w-24">
            <div className="absolute inset-0 animate-ping rounded-full bg-green-500/15" />
            <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-emerald-500 shadow-xl shadow-green-500/30">
              <span className="material-symbols-outlined text-5xl text-white" style={{ fontVariationSettings: "'FILL' 1" }}>
                check_circle
              </span>
            </div>
          </div>

          {/* Welcome text */}
          <div className="mb-5">
            <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-green-600">Scan Berhasil ✓</p>
            <h1 className="text-3xl font-black text-gray-900">Selamat Datang!</h1>
            <p className="mt-1 text-sm text-gray-500">Kunjunganmu sudah tercatat</p>
          </div>

          {/* Stage info */}
          <div className="mb-6 rounded-xl border border-gray-100 bg-gray-50 p-5">
            <div className="mb-2 flex items-center justify-center gap-1.5">
              <span className="material-symbols-outlined text-[14px] text-primary">location_on</span>
              <span className="text-xs font-mono text-gray-400">{stage.code}</span>
            </div>
            <h2 className="text-xl font-black text-gray-900">{stage.name}</h2>
            {stage.zone && (
              <p className="mt-1 text-sm text-gray-500">Zone: {stage.zone}</p>
            )}
            {stage.description && (
              <p className="mt-2 text-xs text-gray-400 leading-relaxed">{stage.description}</p>
            )}
            <p className="mt-3 text-[10px] text-gray-400">
              Scan pada {scannedAt.toLocaleTimeString('id-ID', {
                timeZone: 'Asia/Jakarta',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })} WIB
            </p>
          </div>

          {/* Action buttons */}
          <div className="space-y-2.5">
            <button
              onClick={() => navigate(`/stage/${stage.code}`)}
              className="group flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-bold text-white shadow-lg shadow-primary/30 hover:bg-primary/90 transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-[18px]">photo_library</span>
              Lihat Stage Gallery
            </button>
            <Link
              to="/"
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">home</span>
              Kembali ke Beranda
            </Link>
          </div>
        </div>

        {/* Auto-redirect countdown */}
        <div className="mt-4 flex items-center justify-center gap-3 text-sm text-gray-400">
          <svg width="44" height="44" className="-rotate-90">
            <circle cx="22" cy="22" r="20" fill="none" stroke="#f3f4f6" strokeWidth="3" />
            <circle
              cx="22" cy="22" r="20"
              fill="none"
              stroke="#ff4b86"
              strokeWidth="3"
              strokeDasharray={circumference}
              strokeDashoffset={circumference - progress}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
            <text
              x="22" y="22"
              textAnchor="middle"
              dominantBaseline="central"
              className="rotate-90 fill-gray-700 text-xs font-bold"
              style={{ transform: 'rotate(90deg)', transformOrigin: '22px 22px', fontSize: '12px', fontWeight: 700 }}
            >
              {secondsLeft}
            </text>
          </svg>
          <span>Otomatis menuju gallery dalam {secondsLeft}d...</span>
        </div>
      </div>
    </div>
  );
};

/* ─── Main Component ─────────────────────────────────────────── */
const StageScanPage = () => {
  const { stageCode } = useParams<{ stageCode: string }>();
  const navigate = useNavigate();
  const [stage, setStage] = useState<Stage | null>(null);
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [scannedAt, setScannedAt] = useState<Date>(new Date());

  const performScan = useCallback(async () => {
    const { signal: timeoutSignal, cleanup } = createQuerySignal(undefined, 12000);
    try {
      setScanState('scanning');
      setShowLoginPrompt(false);

      // 1. Cek session user
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        // Belum login → ambil nama stage dulu untuk tampilkan di prompt
        const { data: stagePreview } = await supabase
          .from('stages')
          .select('id, code, name, description, zone, status')
          .eq('code', stageCode)
          .abortSignal(timeoutSignal)
          .single();

        if (stagePreview) setStage(stagePreview);
        setShowLoginPrompt(true);
        setScanState('idle');
        return;
      }

      // 2. Ambil data stage
      const { data: stageData, error: stageError } = await supabase
        .from('stages')
        .select('id, code, name, description, zone, status')
        .eq('code', stageCode)
        .abortSignal(timeoutSignal)
        .single();

      if (stageError || !stageData) {
        setErrorMessage('Stage tidak ditemukan. Pastikan QR code masih berlaku.');
        setScanState('error');
        return;
      }

      setStage(stageData);

      // 3. Cek status stage
      if (stageData.status !== 'active') {
        setScanState('inactive');
        return;
      }

      // 4. Rekam scan ke stage_scan_logs (untuk Scan Tracker admin)
      const now = new Date();
      const { error: scanLogError } = await supabase
        .from('stage_scan_logs')
        .insert({
          user_id: session.user.id,
          stage_id: stageData.id,
          scanned_at: now.toISOString(),
        })
        .abortSignal(timeoutSignal);

      if (scanLogError) {
        console.warn('stage_scan_logs insert warning:', scanLogError);
      }

      // 5. Juga catat ke stage_scans (foot-traffic counter)
      await supabase
        .from('stage_scans')
        .insert({
          stage_id: stageData.id,
          user_agent: navigator.userAgent,
          user_id: session.user.id,
        })
        .abortSignal(timeoutSignal);

      setScannedAt(now);
      setScanState('success');
    } catch (error) {
      const isTimeout = error instanceof Error && error.name === 'AbortError';
      setErrorMessage(
        isTimeout
          ? 'Koneksi timeout. Periksa internet dan coba lagi.'
          : 'Terjadi kesalahan. Silakan coba lagi.'
      );
      setScanState('error');
    } finally {
      cleanup();
    }
  }, [stageCode]);

  const handleLoginRedirect = useCallback(() => {
    navigate('/login', {
      replace: true,
      state: { returnTo: `/scan/${stageCode}` },
    });
  }, [navigate, stageCode]);

  useEffect(() => {
    if (stageCode) {
      performScan();
    }
  }, [stageCode, performScan]);

  // ── Render states ──────────────────────────────────────────
  if (scanState === 'scanning' || (scanState === 'idle' && !showLoginPrompt)) {
    return <ScanLoadingScreen />;
  }

  if (showLoginPrompt) {
    return (
      <LoginPromptScreen
        stageName={stage?.name}
        onRetry={handleLoginRedirect}
      />
    );
  }

  if (scanState === 'error') {
    return <ErrorScreen message={errorMessage} onRetry={performScan} />;
  }

  if (scanState === 'inactive' && stage) {
    return <InactiveScreen stage={stage} />;
  }

  if (scanState === 'success' && stage) {
    return <SuccessScreen stage={stage} scannedAt={scannedAt} />;
  }

  return <ScanLoadingScreen />;
};

export default StageScanPage;
