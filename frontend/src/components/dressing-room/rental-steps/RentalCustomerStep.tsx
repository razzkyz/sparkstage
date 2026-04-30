import { useState } from 'react';
import { motion } from 'framer-motion';
import type { RentalFormData } from '../RentalFlowModal';

interface RentalCustomerStepProps {
  defaultData: RentalFormData['customerData'];
  onNext: (data: Partial<RentalFormData>) => void;
  onPrev: () => void;
}

export default function RentalCustomerStep({
  defaultData,
  onNext,
  onPrev,
}: RentalCustomerStepProps) {
  const [formData, setFormData] = useState(defaultData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isPickup, setIsPickup] = useState(false);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) newErrors.fullName = 'Nama lengkap wajib diisi';
    if (!formData.email.trim()) newErrors.email = 'Email wajib diisi';
    if (!formData.email.includes('@')) newErrors.email = 'Email tidak valid';
    if (!formData.phone.trim()) newErrors.phone = 'No HP/WA wajib diisi';
    if (!formData.phone.startsWith('08')) newErrors.phone = 'No HP harus dimulai dengan 08';
    if (!isPickup && !formData.address.trim()) newErrors.address = 'Alamat wajib diisi';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateForm()) {
      onNext({ customerData: formData });
    }
  };

  const fields = [
    { key: 'fullName', label: 'Nama Lengkap', type: 'text', required: true },
    { key: 'email', label: 'Email', type: 'email', required: true },
    { key: 'phone', label: 'No HP / WhatsApp', type: 'tel', required: true, placeholder: '62812xxxxx' },
    { key: 'address', label: 'Alamat Pengiriman', type: 'textarea', required: true },
  ];

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
        <span>Step 3: Data Customer</span>
      </div>

      {/* Info */}
      <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-900 border border-blue-200">
        <p className="font-semibold mb-2">👤 Data Pribadi Wajib Lengkap</p>
        <p className="text-xs">Data ini digunakan untuk invoice dan reminder pengembalian. Pastikan semua terisi dengan benar.</p>
      </div>

      {/* Form */}
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {fields.map(({ key, label, type, required, placeholder }) => {
          const fieldKey = key as keyof typeof formData;
          const value = formData[fieldKey] || '';
          const error = errors[key];

          // Skip address field if pickup is selected
          if (key === 'address' && isPickup) return null;

          return (
            <div key={key}>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
              </label>

              {type === 'textarea' ? (
                <textarea
                  value={value}
                  onChange={(e) => handleChange(key, e.target.value)}
                  placeholder={placeholder}
                  className={`w-full px-4 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                    error
                      ? 'border-red-300 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-main-500'
                  }`}
                  rows={3}
                />
              ) : (
                <input
                  type={type}
                  value={value}
                  onChange={(e) => handleChange(key, e.target.value)}
                  placeholder={placeholder}
                  className={`w-full px-4 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                    error
                      ? 'border-red-300 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-main-500'
                  }`}
                />
              )}

              {error && (
                <p className="text-xs text-red-600 mt-1">{error}</p>
              )}
            </div>
          );
        })}

        {/* Pickup Checkbox */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="pickup"
            checked={isPickup}
            onChange={(e) => setIsPickup(e.target.checked)}
            className="w-4 h-4 text-main-600 border-gray-300 rounded focus:ring-main-500"
          />
          <label htmlFor="pickup" className="text-sm text-gray-700">
            Ambil di tempat (tidak perlu isi alamat)
          </label>
        </div>
      </div>

      {/* T&C */}
      <div className="rounded-lg bg-gray-50 p-4 text-xs text-gray-700 space-y-2">
        <p className="font-semibold text-gray-900">📋 Syarat & Ketentuan Deposit</p>
        <ul className="space-y-1 list-disc list-inside">
          <li><span className="font-semibold">Telat:</span> Rp 5.000 per jam</li>
          <li><span className="font-semibold">Bernoda:</span> -Rp 10.000</li>
          <li><span className="font-semibold">Kancing copot:</span> -Rp 10.000</li>
          <li><span className="font-semibold">Rusak parah/sobek:</span> Deposit item hangus</li>
          <li><span className="font-semibold">Kerusakan &gt; deposit:</span> Bayar selisih</li>
        </ul>
        <p className="text-[10px] text-gray-500 mt-2 italic">Refund = Deposit - Telat - Kerusakan</p>
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
          onClick={handleNext}
          className="flex-1 px-4 py-3 bg-main-500 text-sm font-bold uppercase tracking-wider text-white hover:bg-main-600 transition-colors"
        >
          Lanjut ke Summary
        </button>
      </div>
    </motion.div>
  );
}
