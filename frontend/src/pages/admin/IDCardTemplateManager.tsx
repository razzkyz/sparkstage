import React, { useState, useEffect } from "react";
import AdminLayout from '../../components/AdminLayout';
import { ADMIN_MENU_ITEMS } from '../../constants/adminMenu';
import { useAdminMenuSections } from '../../hooks/useAdminMenuSections';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { uploadToR2, validateImageFile } from '../../lib/r2Upload';

export default function IDCardTemplateManager() {
  const { signOut } = useAuth();
  const menuSections = useAdminMenuSections();
  const [templates, setTemplates] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    const { data } = await supabase.from('id_card_templates').select('*').order('created_at', { ascending: false });
    if (data) setTemplates(data);
  };

  const handleEdit = (template: any) => {
    setEditingId(template.id);
    setFormData(JSON.parse(JSON.stringify(template)));
  };

  const handleCreateNew = () => {
    setEditingId('new');
    setFormData({
      name: 'Template Baru',
      front_image_url: '',
      back_image_url: '',
      config_front: {
        photo: { top: '22px', left: '20px', width: '125px', height: '160px', borderRadius: '0px' },
        name:  { top: '92px', left: '175px', width: '130px', fontSize: '12px', color: '#c2185b' },
        zodiac:{ top: '124px', left: '175px', width: '130px', fontSize: '11px', color: '#c2185b' },
        hobby: { top: '155px', left: '175px', width: '130px', fontSize: '11px', color: '#c2185b' }
      },
      config_back: {
        barcode: { bottom: '15px', right: '15px', width: '80px', height: '30px' },
        serial:  { bottom: '48px', right: '15px', width: '80px', fontSize: '9px', color: '#c2185b' }
      },
      is_active: true
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, side: 'front' | 'back') => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const validation = validateImageFile(file);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    setIsUploading(true);
    try {
      // Use a dummy productId 99999 for template assets
      const publicUrl = await uploadToR2({ file, productId: 99999 });
      setFormData((prev: any) => ({
        ...prev,
        [side === 'front' ? 'front_image_url' : 'back_image_url']: publicUrl
      }));
    } catch (err) {
      alert("Gagal mengupload gambar ke R2.");
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (editingId === 'new') {
        await supabase.from('id_card_templates').insert([formData]);
      } else {
        await supabase.from('id_card_templates').update(formData).eq('id', editingId);
      }
      alert('Tersimpan!');
      setEditingId(null);
      fetchTemplates();
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan.');
    } finally {
      setIsSaving(false);
    }
  };

  const updateConfigFront = (element: string, key: string, value: string) => {
    setFormData((prev: any) => ({
      ...prev,
      config_front: {
        ...prev.config_front,
        [element]: { ...prev.config_front[element], [key]: value }
      }
    }));
  };

  const updateConfigBack = (element: string, key: string, value: string) => {
    setFormData((prev: any) => ({
      ...prev,
      config_back: {
        ...prev.config_back,
        [element]: { ...prev.config_back[element], [key]: value }
      }
    }));
  };

  return (
    <AdminLayout menuItems={ADMIN_MENU_ITEMS} menuSections={menuSections} defaultActiveMenuId="id-card-templates" title="Template ID Card" onLogout={signOut}>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Manajemen Template ID Card</h1>
          {!editingId && (
            <button onClick={handleCreateNew} className="bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700">
              + Template Baru
            </button>
          )}
        </div>

        {!editingId ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map(t => (
              <div key={t.id} className="bg-white border rounded-xl overflow-hidden shadow-sm">
                <img src={t.front_image_url} alt="Front" className="w-full h-40 object-cover bg-neutral-100" />
                <div className="p-4">
                  <h3 className="font-semibold text-lg">{t.name}</h3>
                  <div className="flex justify-between items-center mt-4">
                    <span className={`text-xs px-2 py-1 rounded-full ${t.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {t.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                    <button onClick={() => handleEdit(t)} className="text-blue-600 text-sm font-medium hover:underline">Edit ⚙️</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white p-6 rounded-xl border space-y-6 shadow-sm">
            <div className="flex justify-between items-center border-b pb-4">
              <h2 className="text-xl font-bold">Edit Template</h2>
              <button onClick={() => setEditingId(null)} className="text-gray-500 hover:text-gray-700">Tutup ✕</button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* KOLOM KIRI: FORM */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nama Template</label>
                  <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 border rounded-md" />
                </div>

                <div className="space-y-2 p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                  <h3 className="font-semibold border-b pb-2">Desain Sisi Depan</h3>
                  <label className="block text-sm font-medium mt-2">Gambar Background (Depan)</label>
                  <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'front')} className="text-sm" />
                  {isUploading && <span className="text-xs text-blue-600">Uploading...</span>}
                  
                  <div className="space-y-4 mt-4">
                    <div>
                      <h4 className="font-medium text-sm text-pink-600 mb-1">Koordinat Area Foto</h4>
                      <div className="grid grid-cols-4 gap-2">
                        <input type="text" value={formData.config_front.photo.top} onChange={e => updateConfigFront('photo', 'top', e.target.value)} placeholder="Top" className="w-full px-2 py-1 text-sm border rounded" />
                        <input type="text" value={formData.config_front.photo.left} onChange={e => updateConfigFront('photo', 'left', e.target.value)} placeholder="Left" className="w-full px-2 py-1 text-sm border rounded" />
                        <input type="text" value={formData.config_front.photo.width} onChange={e => updateConfigFront('photo', 'width', e.target.value)} placeholder="Width" className="w-full px-2 py-1 text-sm border rounded" />
                        <input type="text" value={formData.config_front.photo.height} onChange={e => updateConfigFront('photo', 'height', e.target.value)} placeholder="Height" className="w-full px-2 py-1 text-sm border rounded" />
                      </div>
                      <div className="mt-2">
                        <label className="block text-xs text-pink-500 mb-1">Rounded Corner (0px = kotak, 10px = sedikit melengkung, 50% = bulat penuh)</label>
                        <input type="text" value={formData.config_front.photo.borderRadius} onChange={e => updateConfigFront('photo', 'borderRadius', e.target.value)} placeholder="0px" className="w-full px-2 py-1 text-sm border rounded" />
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-sm text-pink-600 mb-1">Koordinat Teks Nama</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <input type="text" value={formData.config_front.name.top} onChange={e => updateConfigFront('name', 'top', e.target.value)} placeholder="Top (px)" className="w-full px-2 py-1 text-sm border rounded" />
                        <input type="text" value={formData.config_front.name.left} onChange={e => updateConfigFront('name', 'left', e.target.value)} placeholder="Left (px)" className="w-full px-2 py-1 text-sm border rounded" />
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-sm text-pink-600 mb-1">Koordinat Teks Zodiak</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <input type="text" value={formData.config_front.zodiac.top} onChange={e => updateConfigFront('zodiac', 'top', e.target.value)} placeholder="Top (px)" className="w-full px-2 py-1 text-sm border rounded" />
                        <input type="text" value={formData.config_front.zodiac.left} onChange={e => updateConfigFront('zodiac', 'left', e.target.value)} placeholder="Left (px)" className="w-full px-2 py-1 text-sm border rounded" />
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-sm text-pink-600 mb-1">Koordinat Teks Hobby</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <input type="text" value={formData.config_front.hobby.top} onChange={e => updateConfigFront('hobby', 'top', e.target.value)} placeholder="Top (px)" className="w-full px-2 py-1 text-sm border rounded" />
                        <input type="text" value={formData.config_front.hobby.left} onChange={e => updateConfigFront('hobby', 'left', e.target.value)} placeholder="Left (px)" className="w-full px-2 py-1 text-sm border rounded" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                  <h3 className="font-semibold border-b pb-2">Desain Sisi Belakang</h3>
                  <label className="block text-sm font-medium mt-2">Gambar Background (Belakang)</label>
                  <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'back')} className="text-sm" />
                  
                  <div className="space-y-4 mt-4">
                    <div>
                      <h4 className="font-medium text-sm text-blue-600 mb-1">Koordinat Barcode</h4>
                      <div className="grid grid-cols-4 gap-2">
                        <input type="text" value={formData.config_back.barcode.bottom} onChange={e => updateConfigBack('barcode', 'bottom', e.target.value)} placeholder="Bottom" className="w-full px-2 py-1 text-sm border rounded" />
                        <input type="text" value={formData.config_back.barcode.right} onChange={e => updateConfigBack('barcode', 'right', e.target.value)} placeholder="Right" className="w-full px-2 py-1 text-sm border rounded" />
                        <input type="text" value={formData.config_back.barcode.width} onChange={e => updateConfigBack('barcode', 'width', e.target.value)} placeholder="Width" className="w-full px-2 py-1 text-sm border rounded" />
                        <input type="text" value={formData.config_back.barcode.height} onChange={e => updateConfigBack('barcode', 'height', e.target.value)} placeholder="Height" className="w-full px-2 py-1 text-sm border rounded" />
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-sm text-blue-600 mb-1">Koordinat Teks Serial</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <input type="text" value={formData.config_back.serial.bottom} onChange={e => updateConfigBack('serial', 'bottom', e.target.value)} placeholder="Bottom (px)" className="w-full px-2 py-1 text-sm border rounded" />
                        <input type="text" value={formData.config_back.serial.right} onChange={e => updateConfigBack('serial', 'right', e.target.value)} placeholder="Right (px)" className="w-full px-2 py-1 text-sm border rounded" />
                      </div>
                    </div>
                  </div>
                </div>

                <button onClick={handleSave} disabled={isSaving || isUploading} className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50">
                  {isSaving ? 'Menyimpan...' : 'Simpan Template'}
                </button>
              </div>

              {/* KOLOM KANAN: PREVIEW LIVE */}
              <div>
                <h3 className="font-semibold mb-2">Live Preview (Depan)</h3>
                <div className="relative shadow-xl rounded-lg overflow-hidden border bg-neutral-100 mb-8" style={{ width: '324px', height: '204px' }}>
                  {formData.front_image_url && <img src={formData.front_image_url} alt="Bg" className="absolute inset-0 w-full h-full object-fill z-10" />}
                  
                  {/* Photo mock */}
                  <div className="absolute bg-gray-300 flex items-center justify-center text-xs text-gray-500 z-20 overflow-hidden" style={formData.config_front.photo}>Foto</div>
                  
                  <div className="absolute font-bold whitespace-nowrap z-30" style={{...formData.config_front.name, lineHeight: 'normal'}}>Nama Customer</div>
                  <div className="absolute font-semibold whitespace-nowrap z-30" style={{...formData.config_front.zodiac, lineHeight: 'normal'}}>Zodiak</div>
                  <div className="absolute font-semibold whitespace-nowrap z-30" style={{...formData.config_front.hobby, lineHeight: 'normal'}}>Hobby</div>
                </div>

                <h3 className="font-semibold mb-2">Live Preview (Belakang)</h3>
                <div className="relative shadow-xl rounded-lg overflow-hidden border bg-neutral-100" style={{ width: '324px', height: '204px' }}>
                  {formData.back_image_url && <img src={formData.back_image_url} alt="Bg Back" className="absolute inset-0 w-full h-full object-fill z-10" />}
                  
                  <div className="absolute bg-black/80 flex items-center justify-center text-[10px] text-white z-20 rounded" style={formData.config_back.barcode}>[BARCODE]</div>
                  <div className="absolute font-mono font-bold text-center whitespace-nowrap z-30" style={{...formData.config_back.serial, lineHeight: 'normal'}}>SPARK-123</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
