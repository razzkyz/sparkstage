import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, User, Phone, CreditCard, Share, FileText, CheckCircle, CameraOff } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import QRScannerModal from '../../components/admin/QRScannerModal';
import { useToast } from '../../components/Toast';
import { ADMIN_MENU_ITEMS, ADMIN_MENU_SECTIONS } from '../../constants/adminMenu';
import { useAuth } from '../../contexts/AuthContext';

interface CustomerData {
  qrCode: string;
  customerName: string;
  customerPhone: string;
  bankEwallet: string;
  socialMedia: string;
  ktpPhoto?: string;
  conditionChecklist: {
    noStain: boolean;
    noRip: boolean;
    noLoose: boolean;
    accessoriesComplete: boolean;
    goodCondition: boolean;
  };
  notes: string;
}

export default function DressingRoomScanPage() {
  const { signOut } = useAuth();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [showScanner, setShowScanner] = useState(false);
  const [scannedData, setScannedData] = useState<string>('');
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [customerData, setCustomerData] = useState<CustomerData>({
    qrCode: '',
    customerName: '',
    customerPhone: '',
    bankEwallet: '',
    socialMedia: '',
    conditionChecklist: {
      noStain: false,
      noRip: false,
      noLoose: false,
      accessoriesComplete: false,
      goodCondition: false,
    },
    notes: '',
  });

  // QR Scanner handler
  const handleScanSuccess = useCallback((result: string) => {
    setScannedData(result);
    setCustomerData(prev => ({ ...prev, qrCode: result }));
    setShowScanner(false);
    setShowCustomerForm(true);
    showToast('success', 'Berhasil! QR Code berhasil di-scan.');
  }, [showToast]);

  // File upload handler
  const handleKtpUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setCustomerData(prev => ({ ...prev, ktpPhoto: result }));
      };
      reader.readAsDataURL(file);
    }
  }, []);

  // Form handlers
  const handleInputChange = useCallback((field: keyof CustomerData, value: string) => {
    setCustomerData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleConditionCheck = useCallback((field: keyof CustomerData['conditionChecklist']) => {
    setCustomerData(prev => ({
      ...prev,
      conditionChecklist: {
        ...prev.conditionChecklist,
        [field]: !prev.conditionChecklist[field]
      }
    }));
  }, []);

  const handleSubmit = useCallback(async () => {
    // Validate required fields
    if (!customerData.customerName || !customerData.customerPhone || !customerData.bankEwallet) {
      showToast('error', 'Mohon lengkapi semua field yang wajib diisi');
      return;
    }

    // Validate condition checklist
    const allConditionsChecked = Object.values(customerData.conditionChecklist).every(Boolean);
    if (!allConditionsChecked) {
      showToast('error', 'Mohon centang semua checklist kondisi barang');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Simulate API call - replace with actual API
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('Customer data submitted:', customerData);
      showToast('success', 'Data customer berhasil disimpan!');
      
      // Reset form
      setCustomerData({
        qrCode: '',
        customerName: '',
        customerPhone: '',
        bankEwallet: '',
        socialMedia: '',
        conditionChecklist: {
          noStain: false,
          noRip: false,
          noLoose: false,
          accessoriesComplete: false,
          goodCondition: false,
        },
        notes: '',
      });
      setScannedData('');
      setShowCustomerForm(false);
      
    } catch (error) {
      console.error('Error submitting data:', error);
      showToast('error', 'Terjadi kesalahan saat menyimpan data');
    } finally {
      setIsSubmitting(false);
    }
  }, [customerData, showToast]);

  return (
    <AdminLayout
      title="Scan QR Customer"
      subtitle="Scan QR dan input data customer dressing room"
      menuItems={ADMIN_MENU_ITEMS}
      menuSections={ADMIN_MENU_SECTIONS}
      defaultActiveMenuId="dressing-room-scan"
      onLogout={signOut}
    >
      <div className="max-w-4xl mx-auto">
        {/* QR Scanner Modal */}
        <QRScannerModal
          isOpen={showScanner}
          title="Scan QR Code Customer"
          closeOnSuccess={true}
          closeOnError={false}
          onScan={handleScanSuccess}
          onClose={() => setShowScanner(false)}
        />
        <AnimatePresence mode="wait">
          {!showCustomerForm ? (
            // QR Scanner View
            <motion.div
              key="scanner"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Scanner Section */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Upload className="w-5 h-5 text-main-600" />
                  Scan QR Code Customer
                </h3>
                
                {/* Scanner Controls */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowScanner(true)}
                    className="flex-1 bg-main-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-main-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Upload className="w-5 h-5" />
                    Mulai Scan
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 bg-gray-100 text-gray-700 px-4 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                  >
                    <Upload className="w-5 h-5" />
                    Upload QR
                  </button>
                </div>

                {/* Manual QR Input */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Atau masukkan QR Code secara manual:
                  </label>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={scannedData}
                      onChange={(e) => setScannedData(e.target.value)}
                      placeholder="Masukkan QR Code (contoh: PRD-001)..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-main-500 focus:border-main-500"
                    />
                    <button
                      onClick={() => handleScanSuccess(scannedData)}
                      disabled={!scannedData.trim()}
                      className="bg-main-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-main-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Lanjut
                    </button>
                  </div>
                </div>
              </div>

              {/* Tabel Data Customer */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-main-600" />
                  Data Customer
                </h4>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 px-3 font-semibold text-gray-700">QR Code</th>
                        <th className="text-left py-2 px-3 font-semibold text-gray-700">Nama</th>
                        <th className="text-left py-2 px-3 font-semibold text-gray-700">No. Telepon</th>
                        <th className="text-left py-2 px-3 font-semibold text-gray-700">Bank/E-wallet</th>
                        <th className="text-left py-2 px-3 font-semibold text-gray-700">Social Media</th>
                        <th className="text-left py-2 px-3 font-semibold text-gray-700">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-3 font-mono text-xs">{scannedData || '-'}</td>
                        <td className="py-3 px-3">{customerData.customerName || '-'}</td>
                        <td className="py-3 px-3">{customerData.customerPhone || '-'}</td>
                        <td className="py-3 px-3">{customerData.bankEwallet || '-'}</td>
                        <td className="py-3 px-3">{customerData.socialMedia || '-'}</td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                            Pending
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Customer Data Table & Invoice */}
              {scannedData && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  {/* Customer Data Table */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <User className="w-5 h-5 text-main-600" />
                      Data Customer
                    </h4>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-2 px-3 font-semibold text-gray-700">QR Code</th>
                            <th className="text-left py-2 px-3 font-semibold text-gray-700">Nama</th>
                            <th className="text-left py-2 px-3 font-semibold text-gray-700">No. Telepon</th>
                            <th className="text-left py-2 px-3 font-semibold text-gray-700">Bank/E-wallet</th>
                            <th className="text-left py-2 px-3 font-semibold text-gray-700">Social Media</th>
                            <th className="text-left py-2 px-3 font-semibold text-gray-700">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-3 font-mono text-xs">{scannedData}</td>
                            <td className="py-3 px-3">{customerData.customerName || '-'}</td>
                            <td className="py-3 px-3">{customerData.customerPhone || '-'}</td>
                            <td className="py-3 px-3">{customerData.bankEwallet || '-'}</td>
                            <td className="py-3 px-3">{customerData.socialMedia || '-'}</td>
                            <td className="py-3 px-3">
                              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                                Pending
                              </span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Invoice Card */}
                  <div className="bg-gradient-to-br from-main-50 to-pink-50 rounded-xl shadow-sm border border-main-200 p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-main-600" />
                      Invoice
                    </h4>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center pb-3 border-b border-main-200">
                        <div>
                          <p className="font-semibold text-gray-900">PRD-{scannedData.slice(-3) || '001'}</p>
                          <p className="text-sm text-gray-600">Sewa Dressing Room</p>
                        </div>
                        <p className="font-bold text-gray-900">Rp 100.000</p>
                      </div>

                      <div className="flex justify-between items-center pb-3 border-b border-main-200">
                        <div>
                          <p className="font-semibold text-gray-900">Deposit</p>
                          <p className="text-sm text-gray-600">Jaminan pengembalian</p>
                        </div>
                        <p className="font-bold text-yellow-700">Rp 50.000</p>
                      </div>

                      <div className="flex justify-between items-start pt-3">
                        <p className="font-black text-gray-900">TOTAL PEMBAYARAN</p>
                        <p className="text-xl font-black text-main-600">Rp 150.000</p>
                      </div>

                      <div className="bg-white rounded-lg p-3 text-xs text-gray-600 space-y-1 mt-3">
                        <p>💰 Total pengembalian deposit: <span className="font-bold text-green-700">Rp 50.000</span></p>
                        <p>📝 Syarat: Barang dikembalikan dalam kondisi baik</p>
                        <p>⏰ Batas waktu: Sesuai durasi sewa</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          ) : (
            // Customer Form View
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Form Header */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <User className="w-5 h-5 text-main-600" />
                    Form Data Customer
                  </h3>
                  <button
                    onClick={() => setShowCustomerForm(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <CameraOff className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="bg-gray-50 px-3 py-2 rounded-lg">
                  <p className="text-sm text-gray-600">QR Code: <span className="font-mono text-gray-900">{scannedData}</span></p>
                </div>
              </div>

              {/* Customer Information Form */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h4 className="text-md font-semibold text-gray-900 mb-4">Informasi Customer</h4>
                
                <div className="space-y-4">
                  {/* Customer Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nama Customer <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={customerData.customerName}
                        onChange={(e) => handleInputChange('customerName', e.target.value)}
                        placeholder="Masukkan nama lengkap"
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-main-500 focus:border-main-500"
                      />
                    </div>
                  </div>

                  {/* Customer Phone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      No. Telepon <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="tel"
                        value={customerData.customerPhone}
                        onChange={(e) => handleInputChange('customerPhone', e.target.value)}
                        placeholder="Masukkan nomor telepon"
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-main-500 focus:border-main-500"
                      />
                    </div>
                  </div>

                  {/* Bank/E-wallet */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bank/E-wallet <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <select
                        value={customerData.bankEwallet}
                        onChange={(e) => handleInputChange('bankEwallet', e.target.value)}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-main-500 focus:border-main-500"
                      >
                        <option value="">Pilih Bank/E-wallet</option>
                        <option value="bca">BCA</option>
                        <option value="bni">BNI</option>
                        <option value="bri">BRI</option>
                        <option value="mandiri">Mandiri</option>
                        <option value="gopay">GoPay</option>
                        <option value="ovo">OVO</option>
                        <option value="dana">DANA</option>
                        <option value="shopeepay">ShopeePay</option>
                      </select>
                    </div>
                  </div>

                  {/* Social Media */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Social Media
                    </label>
                    <div className="relative">
                      <Share className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={customerData.socialMedia}
                        onChange={(e) => handleInputChange('socialMedia', e.target.value)}
                        placeholder="Instagram, TikTok, dll (opsional)"
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-main-500 focus:border-main-500"
                      />
                    </div>
                  </div>

                  {/* KTP Photo */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Foto KTP <span className="text-gray-400">(opsional)</span>
                    </label>
                    <div className="relative">
                      <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleKtpUpload}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-main-500 focus:border-main-500 file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-main-50 file:text-main-700 hover:file:bg-main-100"
                      />
                    </div>
                    {customerData.ktpPhoto && (
                      <div className="mt-2">
                        <img
                          src={customerData.ktpPhoto}
                          alt="KTP Preview"
                          className="h-32 w-auto rounded-lg border border-gray-200"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Condition Checklist */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h4 className="text-md font-semibold text-gray-900 mb-4">Checklist Kondisi Barang</h4>
                
                <div className="space-y-3">
                  {[
                    { key: 'noStain', label: 'Tidak ada noda/kotoran' },
                    { key: 'noRip', label: 'Tidak ada sobekan/robek' },
                    { key: 'noLoose', label: 'Tidak ada kancing longgar' },
                    { key: 'accessoriesComplete', label: 'Aksesoris lengkap' },
                    { key: 'goodCondition', label: 'Kondisi baik secara keseluruhan' },
                  ].map((item) => (
                    <label
                      key={item.key}
                      className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={customerData.conditionChecklist[item.key as keyof typeof customerData.conditionChecklist]}
                        onChange={() => handleConditionCheck(item.key as keyof typeof customerData.conditionChecklist)}
                        className="w-5 h-5 text-main-600 border-gray-300 rounded focus:ring-main-500"
                      />
                      <span className="text-sm font-medium text-gray-700">{item.label}</span>
                      {customerData.conditionChecklist[item.key as keyof typeof customerData.conditionChecklist] && (
                        <CheckCircle className="w-5 h-5 text-green-500 ml-auto" />
                      )}
                    </label>
                  ))}
                </div>

                {/* Notes */}
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Catatan Tambahan
                  </label>
                  <textarea
                    value={customerData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="Catatan kondisi barang atau informasi lainnya..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-main-500 focus:border-main-500"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCustomerForm(false)}
                  className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  Kembali
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex-1 bg-main-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-main-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Submit Data
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AdminLayout>
  );
}
