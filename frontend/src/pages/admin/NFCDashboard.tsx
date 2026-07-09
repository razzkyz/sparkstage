import React, { useState } from 'react';
import { useNfcUserByUid, useNfcUsers, useCreateNfcUser, useUpdateNfcUser, useDeleteNfcUser } from '../../hooks/useNfcSystem';
import { useAuth } from '../../contexts/AuthContext';
import { Ticket, PlusCircle, CreditCard, RefreshCw, Search, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import { ADMIN_MENU_ITEMS } from '../../constants/adminMenu';
import { useAdminMenuSections } from '../../hooks/useAdminMenuSections';

export default function NFCDashboard() {
  const [uidInput, setUidInput] = useState('');
  const [scannedUid, setScannedUid] = useState('');

  const { signOut } = useAuth();
  const menuSections = useAdminMenuSections();

  // All registered coins
  const { data: allCoins, isLoading: loadingCoins } = useNfcUsers();

  // Search result
  const { data: nfcUser, isLoading: loadingUser } = useNfcUserByUid(scannedUid);
  const createNfcUser = useCreateNfcUser();
  const updateNfcUser = useUpdateNfcUser();
  const deleteNfcUser = useDeleteNfcUser();
  
  const [initialBalance, setInitialBalance] = useState<number | ''>('');
  const [nominal, setNominal] = useState<number | ''>('');

  // Custom Modal State
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    type: 'success' | 'error' | 'confirm';
    title: string;
    message: string;
    onConfirm?: () => void;
  }>({ isOpen: false, type: 'success', title: '', message: '' });

  const showModal = (type: 'success' | 'error' | 'confirm', title: string, message: string, onConfirm?: () => void) => {
    setModalConfig({ isOpen: true, type, title, message, onConfirm });
  };
  const closeModal = () => setModalConfig(prev => ({ ...prev, isOpen: false }));

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (uidInput.trim()) {
      setScannedUid(uidInput.trim().toUpperCase());
      setUidInput(''); // Kosongkan input untuk koin berikutnya
    }
  };

  const handleDelete = () => {
    if (!nfcUser?.id) return;
    showModal('confirm', 'Hapus Koin', `Yakin ingin menghapus koin ${scannedUid}? Semua data saldonya akan hilang.`, async () => {
      try {
        await deleteNfcUser.mutateAsync(nfcUser.id);
        setScannedUid('');
        showModal('success', 'Berhasil', 'Koin berhasil dihapus.');
      } catch (err: any) {
        showModal('error', 'Gagal Menghapus', err.message || 'Terjadi kesalahan sistem');
      }
    });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (initialBalance === '' || (initialBalance as number) < 0) return showModal('error', 'Error', 'Jumlah bintang tidak valid');
    try {
      await createNfcUser.mutateAsync({
        uid_nfc: scannedUid,
        nama: `Coin ${scannedUid}`,
        email: null,
        saldo: Number(initialBalance),
        status: 'active',
      });
      setInitialBalance('');
      showModal('success', 'Berhasil', `Coin ${scannedUid} berhasil diaktifkan dengan nilai ${initialBalance} poin`);
    } catch (err: any) {
      showModal('error', 'Gagal Mengaktifkan', err.message || 'Gagal mengaktifkan coin');
    }
  };

  const handleTopup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (nominal === '' || (nominal as number) < 0) return showModal('error', 'Error', 'Nilai poin tidak valid');
    if (!nfcUser?.id) return showModal('error', 'Error', 'Data coin tidak ditemukan');
    try {
      await updateNfcUser.mutateAsync({
        id: nfcUser.id,
        saldo: Number(nominal),
      });
      setNominal('');
      showModal('success', 'Berhasil', `Berhasil menetapkan nilai ${nominal} poin ke coin ${scannedUid}`);
    } catch (err: any) {
      showModal('error', 'Gagal', err.message || 'Gagal menetapkan nilai poin');
    }
  };


  return (
    <AdminLayout
      menuItems={ADMIN_MENU_ITEMS}
      menuSections={menuSections}
      defaultActiveMenuId="nfc-cashless"
      title="NFC Cashless Dashboard"
      onLogout={signOut}
    >
      <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6 sm:space-y-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-indigo-500" />
            NFC Cashless Dashboard
          </h1>
          <button
            onClick={() => { setScannedUid(''); setUidInput(''); }}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50 text-sm font-medium"
          >
            <RefreshCw className="w-4 h-4" /> Reset
          </button>
        </div>

        {/* UID Input */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-1">Cari / Deteksi Coin</h2>
          <p className="text-sm text-gray-500 mb-4">Pastikan kursor ketik Anda berada di kotak bawah ini, lalu tempelkan koin ke scanner Anda.</p>
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 w-full sm:max-w-lg">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={uidInput}
                onChange={e => setUidInput(e.target.value)}
                placeholder=""
                className="w-full pl-10 pr-3 py-2 border border-indigo-200 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 bg-white font-mono text-lg shadow-sm"
                autoFocus
              />
            </div>
            <button
              type="submit"
              className="w-full sm:w-auto px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
            >
              Cari
            </button>
          </form>

        </div>

        {/* Search Result */}
        {scannedUid && loadingUser && (
          <div className="text-center py-6 text-gray-500 animate-pulse">Memeriksa data coin...</div>
        )}

        {/* Coin Baru → Aktifkan */}
        {scannedUid && !loadingUser && !nfcUser && (
          <div className="p-4 sm:p-6 border border-amber-200 bg-amber-50 rounded-xl shadow-sm">
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <div className="bg-amber-100 p-3 rounded-full text-amber-600 flex-shrink-0">
                <PlusCircle className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-amber-800 mb-1">Coin Baru! Belum Terdaftar</h2>
                <p className="text-amber-700 text-sm mb-4">
                  UID: <span className="font-mono bg-amber-100 px-2 py-0.5 rounded text-base font-bold">{scannedUid}</span>
                </p>
                <form onSubmit={handleRegister} className="space-y-4 max-w-sm">
                  <p className="text-sm text-amber-900">Isi saldo bintang awal untuk mengaktifkan coin ini:</p>
                  <div className="relative">
                    <input type="number" value={initialBalance} onChange={e => setInitialBalance(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="Jumlah manual..." min={0}
                      className="w-full rounded-md border border-gray-300 shadow-sm focus:border-amber-500 pl-3 pr-10 py-2" />
                    <span className="absolute right-3 top-2.5 text-gray-400">★</span>
                  </div>
                  <button type="submit" disabled={createNfcUser.isPending || initialBalance === ''}
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white rounded-md py-2 font-medium transition-colors disabled:opacity-50">
                    {createNfcUser.isPending ? 'Mengaktifkan...' : '✓ Aktifkan Coin'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Coin Aktif → Tetapkan Nilai */}
        {scannedUid && !loadingUser && nfcUser && (
          <div className="p-4 sm:p-6 border border-green-200 bg-green-50 rounded-xl shadow-sm">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-green-100 p-3 rounded-full text-green-600">
                    <Ticket className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-green-800">Coin Ditemukan ✓</h2>
                    <p className="text-green-700 font-mono text-sm mb-2">UID: <span className="font-bold">{scannedUid}</span></p>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-inner border border-green-100">
                  <p className="text-sm text-gray-500 mb-1">Nilai Poin Saat Ini</p>
                  <p className="text-4xl font-black text-indigo-600 flex items-center gap-2">
                    <span className="text-yellow-400 text-3xl">★</span> {nfcUser.saldo}
                  </p>
                </div>
              </div>

              <div className="flex-1 border-t md:border-t-0 md:border-l border-green-200 pt-4 md:pt-0 md:pl-6">
                <h3 className="text-lg font-semibold text-green-800 mb-3">Tetapkan Nilai Poin</h3>
                <form onSubmit={handleTopup} className="space-y-4">
                  <div className="relative">
                    <input type="number" value={nominal} onChange={e => setNominal(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="Masukkan nilai poin..." min={0}
                      className="w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 pl-3 pr-10 py-2" />
                    <span className="absolute right-3 top-2.5 text-gray-400">★</span>
                  </div>
                  <button type="submit" disabled={updateNfcUser.isPending || nominal === ''}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-md py-2 font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50">
                    <CreditCard className="w-4 h-4" />
                    {updateNfcUser.isPending ? 'Menyimpan...' : 'Tetapkan Nilai'}
                  </button>
                  <div className="pt-2">
                    <button 
                      type="button"
                      onClick={handleDelete}
                      disabled={deleteNfcUser.isPending}
                      className="w-full text-sm py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-md transition-colors border border-red-200 font-medium"
                    >
                      {deleteNfcUser.isPending ? 'Menghapus...' : 'Hapus Koin Ini Secara Permanen'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* === TABEL DAFTAR SEMUA COIN === */}
        <div>
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="text-yellow-400">★</span> Daftar Semua Coin Terdaftar
          </h2>
          {loadingCoins ? (
            <div className="text-center py-8 text-gray-400 animate-pulse">Memuat data coin...</div>
          ) : !allCoins || allCoins.length === 0 ? (
            <div className="text-center py-12 text-gray-400 bg-gray-50 border border-dashed border-gray-200 rounded-xl">
               Belum ada coin yang terdaftar.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
              <table className="min-w-full divide-y divide-gray-200 bg-white">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">#</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">UID Coin</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Nilai Poin</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Terdaftar</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {allCoins.map((coin, idx) => (
                    <tr key={coin.id} className={`hover:bg-indigo-50 transition-colors ${scannedUid === coin.uid_nfc ? 'bg-indigo-50 border-l-4 border-indigo-500' : ''}`}>
                      <td className="px-4 py-3 text-sm text-gray-400">{idx + 1}</td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-sm font-semibold text-gray-800">{coin.uid_nfc ?? '-'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          coin.status === 'active' ? 'bg-green-100 text-green-800' :
                          coin.status === 'lost' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {coin.status === 'active' ? '● Aktif' : coin.status === 'lost' ? '● Hilang' : '● Nonaktif'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-lg font-black text-indigo-600 flex items-center justify-end gap-1">
                          <span className="text-yellow-400">★</span> {coin.saldo}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {new Date(coin.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => { setUidInput(coin.uid_nfc ?? ''); setScannedUid(coin.uid_nfc?.toUpperCase() ?? ''); }}
                          className="text-xs px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors font-medium"
                        >
                          Ubah Nilai
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {/* --- CUSTOM MODAL POPUP --- */}
      {modalConfig.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full mb-4">
                {modalConfig.type === 'success' && <CheckCircle2 className="w-12 h-12 text-green-500" />}
                {modalConfig.type === 'error' && <XCircle className="w-12 h-12 text-red-500" />}
                {modalConfig.type === 'confirm' && <AlertCircle className="w-12 h-12 text-amber-500" />}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{modalConfig.title}</h3>
              <p className="text-gray-500 text-sm">{modalConfig.message}</p>
            </div>
            
            <div className="bg-gray-50 px-6 py-4 flex gap-3 justify-end">
              {modalConfig.type === 'confirm' ? (
                <>
                  <button
                    onClick={closeModal}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 w-full"
                  >
                    Batal
                  </button>
                  <button
                    onClick={() => {
                      if (modalConfig.onConfirm) modalConfig.onConfirm();
                      closeModal();
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 w-full"
                  >
                    Ya, Hapus
                  </button>
                </>
              ) : (
                <button
                  onClick={closeModal}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 w-full"
                >
                  Tutup
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </AdminLayout>
  );
}
