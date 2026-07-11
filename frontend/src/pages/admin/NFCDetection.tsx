import React, { useState, useEffect, useRef } from 'react';
import { useNfcUserByUid } from '../../hooks/useNfcSystem';
import { useAuth } from '../../contexts/AuthContext';
import { ScanFace, Search, Volume2, VolumeX, CheckCircle2, XCircle } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import { ADMIN_MENU_ITEMS } from '../../constants/adminMenu';
import { useAdminMenuSections } from '../../hooks/useAdminMenuSections';

export default function NFCDetection() {
  const [uidInput, setUidInput] = useState('');
  const [scannedUid, setScannedUid] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);

  const { signOut } = useAuth();
  const menuSections = useAdminMenuSections();

  // Search result
  const { data: nfcUser, isLoading: loadingUser, isSuccess, isError } = useNfcUserByUid(scannedUid);

  // Audio refs (Dummy paths, can be updated later by the user)
  const successAudioRef = useRef<HTMLAudioElement | null>(null);
  const failAudioRef = useRef<HTMLAudioElement | null>(null);

  const [connectionMode, setConnectionMode] = useState<'usb' | 'bluetooth'>('usb');

  useEffect(() => {
    // Initialize audio elements
    successAudioRef.current = new Audio('/sounds/berhasil.mpeg');
    failAudioRef.current = new Audio('/sounds/gagal.mpeg');
  }, []);

  useEffect(() => {
    if (scannedUid && !loadingUser) {
      if (nfcUser && nfcUser.status === 'active') {
        // UID exists and active -> Success
        if (soundEnabled && successAudioRef.current) {
          successAudioRef.current.currentTime = 0;
          successAudioRef.current.play().catch(e => console.warn("Audio play failed:", e));
        }
      } else if (isSuccess && !nfcUser) {
        // UID does not exist -> Fail
        if (soundEnabled && failAudioRef.current) {
          failAudioRef.current.currentTime = 0;
          failAudioRef.current.play().catch(e => console.warn("Audio play failed:", e));
        }
      } else if (isError) {
         // Error reading -> Fail
         if (soundEnabled && failAudioRef.current) {
          failAudioRef.current.currentTime = 0;
          failAudioRef.current.play().catch(e => console.warn("Audio play failed:", e));
        }
      }
    }
  }, [scannedUid, loadingUser, nfcUser, isSuccess, isError, soundEnabled]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (uidInput.trim()) {
      setScannedUid(uidInput.trim().toUpperCase());
      setUidInput(''); // Kosongkan input untuk koin berikutnya
    }
  };

  return (
    <AdminLayout
      menuItems={ADMIN_MENU_ITEMS}
      menuSections={menuSections}
      defaultActiveMenuId="nfc-detection"
      title="NFC Detection Dashboard"
      onLogout={signOut}
    >
      <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ScanFace className="w-6 h-6 text-indigo-600" />
            NFC Detection (Scanner)
          </h1>
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`flex items-center gap-2 px-4 py-2 border rounded-md text-sm font-medium transition-colors ${
              soundEnabled ? 'border-indigo-300 bg-indigo-50 text-indigo-700' : 'border-gray-300 bg-gray-50 text-gray-500'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            {soundEnabled ? 'Suara Aktif' : 'Suara Mati'}
          </button>
        </div>

        {/* UID Input Section */}
        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 rounded-xl p-4 sm:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
            <h2 className="text-lg font-semibold text-gray-800">Scan / Deteksi UID</h2>
            <div className="flex p-1 bg-indigo-100/50 rounded-lg w-full sm:w-auto">
              <button
                onClick={() => setConnectionMode('usb')}
                className={`flex-1 sm:flex-none px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${connectionMode === 'usb' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Kabel USB (PC)
              </button>
              <button
                onClick={() => setConnectionMode('bluetooth')}
                className={`flex-1 sm:flex-none px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${connectionMode === 'bluetooth' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Bluetooth (HP)
              </button>
            </div>
          </div>
          
          <div className="bg-white/60 p-3 rounded-lg mb-4 text-sm text-gray-600 border border-indigo-100">
            <p><strong>Panduan:</strong> Pastikan kursor berada di dalam kotak pencarian di bawah, lalu scan koin. Jika terdaftar akan berbunyi berhasil, jika tidak akan berbunyi gagal.</p>
          </div>
          
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 w-full sm:max-w-lg mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={uidInput}
                onChange={e => setUidInput(e.target.value)}
                placeholder="Scan koin di sini..."
                className="w-full pl-10 pr-3 py-3 border-2 border-indigo-200 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 bg-white font-mono text-xl shadow-sm text-center"
                autoFocus
              />
            </div>
            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold transition-colors shadow-md"
            >
              Scan
            </button>
          </form>
        </div>

        {/* Result Indicator */}
        {scannedUid && (
          <div className="mt-8 flex justify-center animate-in fade-in zoom-in duration-300">
            {loadingUser ? (
              <div className="text-center p-8 bg-white rounded-2xl shadow-sm border border-gray-100 w-full max-w-md">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                <p className="text-gray-500 font-medium">Memeriksa UID: <span className="font-mono text-gray-800">{scannedUid}</span></p>
              </div>
            ) : nfcUser && nfcUser.status === 'active' ? (
              <div className="text-center p-8 bg-green-50 rounded-2xl shadow-md border-2 border-green-200 w-full max-w-md transform transition-all">
                <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-4" />
                <h2 className="text-3xl font-black text-green-700 mb-2">BERHASIL</h2>
                <p className="text-green-600 font-medium text-lg mb-4">UID Terdaftar & Aktif</p>
                <div className="bg-white/60 py-2 px-4 rounded-lg inline-block">
                  <p className="font-mono text-2xl font-bold text-gray-800">{scannedUid}</p>
                </div>
                <div className="mt-4 flex items-center justify-center gap-2 text-xl font-bold text-green-700">
                  <span className="text-yellow-500">★</span> {nfcUser.saldo} Poin
                </div>
              </div>
            ) : (
              <div className="text-center p-8 bg-red-50 rounded-2xl shadow-md border-2 border-red-200 w-full max-w-md transform transition-all">
                <XCircle className="w-20 h-20 text-red-500 mx-auto mb-4" />
                <h2 className="text-3xl font-black text-red-700 mb-2">GAGAL</h2>
                <p className="text-red-600 font-medium text-lg mb-4">UID Tidak Terdaftar / Tidak Aktif</p>
                <div className="bg-white/60 py-2 px-4 rounded-lg inline-block">
                  <p className="font-mono text-2xl font-bold text-gray-800">{scannedUid}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
