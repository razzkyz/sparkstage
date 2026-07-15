import { useState, useEffect, useCallback } from "react";
import AdminLayout from "../../components/AdminLayout";
import { useAuth } from "../../contexts/AuthContext";
import { ADMIN_MENU_ITEMS } from "../../constants/adminMenu";
import { useAdminMenuSections } from "../../hooks/useAdminMenuSections";
import { 
  useOnStageSettings, 
  useUpdateOnStageSettings, 
  type OnStagePageSettings,
  type PromoSection
} from "../../hooks/useOnStageSettings";
import { useToast } from "../../components/Toast";
import { Save, Image as ImageIcon, Loader2, Plus, Trash2 } from "lucide-react";
import CmsAssetField from "../../components/admin/CmsAssetField";
import { uploadCmsAsset } from "../../lib/cmsAssetUpload";

const CMS_BUCKET = "onstage-assets";

export default function OnStagePageManager() {
  const { signOut } = useAuth();
  const menuSections = useAdminMenuSections();
  const { showToast } = useToast();

  const { data: settings, isLoading } = useOnStageSettings();
  const { mutateAsync: updateSettings, isPending: isSaving } = useUpdateOnStageSettings();

  const [formData, setFormData] = useState<Partial<OnStagePageSettings>>({});

  useEffect(() => {
    if (settings) {
      setFormData({
        ...settings,
        // Ensure promo_sections is initialized
        promo_sections: settings.promo_sections || [],
      });
    }
  }, [settings]);

  const handleChange = (field: keyof OnStagePageSettings, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // ═══ Promo Sections Helpers (Multiple Sections) ═══
  const promoSections = (formData.promo_sections as PromoSection[]) || [];

  const addPromoSection = () => {
    const newSection: PromoSection = {
      id: crypto.randomUUID(),
      subtitle: "",
      title: "",
      title_highlight: "",
      image_url: "",
      price: "",
      price_suffix: "",
      packages: [],
    };
    handleChange("promo_sections", [...promoSections, newSection]);
  };

  const updatePromoSection = (index: number, updates: Partial<PromoSection>) => {
    const next = [...promoSections];
    next[index] = { ...next[index], ...updates };
    handleChange("promo_sections", next);
  };

  const removePromoSection = (index: number) => {
    handleChange("promo_sections", promoSections.filter((_, i) => i !== index));
  };

  // Promo package helpers (individual items with add/remove) - PER SECTION
  const addPromoPackage = (sectionIndex: number) => {
    const section = promoSections[sectionIndex];
    updatePromoSection(sectionIndex, {
      packages: [...(section.packages || []), ""],
    });
  };

  const updatePromoPackage = (sectionIndex: number, pkgIndex: number, value: string) => {
    const section = promoSections[sectionIndex];
    const nextPackages = [...(section.packages || [])];
    nextPackages[pkgIndex] = value;
    updatePromoSection(sectionIndex, { packages: nextPackages });
  };

  const removePromoPackage = (sectionIndex: number, pkgIndex: number) => {
    const section = promoSections[sectionIndex];
    const nextPackages = (section.packages || []).filter((_, i) => i !== pkgIndex);
    updatePromoSection(sectionIndex, { packages: nextPackages });
  };

  const handleUploadImage = useCallback(async (file: File, callback: (url: string) => void) => {
    try {
      await uploadCmsAsset({
        file,
        bucket: CMS_BUCKET,
        prefix: 'onstage',
        kind: 'image',
        showToast,
        onUploaded: callback,
      });
    } catch (err: unknown) {
      showToast('error', err instanceof Error ? err.message : 'Gagal upload gambar');
    }
  }, [showToast]);

  // Carousel image helpers
  const carouselImages = (formData.carousel_images as string[]) || [];

  const addCarouselImage = () => {
    handleChange("carousel_images", [...carouselImages, ""]);
  };

  const updateCarouselImage = (index: number, url: string) => {
    const next = [...carouselImages];
    next[index] = url;
    handleChange("carousel_images", next);
  };

  const removeCarouselImage = (index: number) => {
    handleChange("carousel_images", carouselImages.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    try {
      await updateSettings(formData);
      showToast("success", "Pengaturan halaman On-Stage berhasil disimpan!");
    } catch (error) {
      console.error(error);
      showToast("error", "Gagal menyimpan pengaturan.");
    }
  };

  if (isLoading) {
    return (
      <AdminLayout
        menuItems={ADMIN_MENU_ITEMS}
        menuSections={menuSections}
        defaultActiveMenuId="onstage-page"
        title="On-Stage Page CMS"
        subtitle="Loading..."
        onLogout={signOut}
      >
        <div className="flex h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      menuItems={ADMIN_MENU_ITEMS}
      menuSections={menuSections}
      defaultActiveMenuId="onstage-page"
      title="On-Stage Page CMS"
      subtitle="Manage landing page content for On-Stage section"
      onLogout={signOut}
    >
      <div className="max-w-4xl space-y-6 pb-20">
        <div className="flex justify-between items-center pb-2 border-b border-gray-100">
          <p className="text-sm text-gray-500">
            Pastikan Anda mengklik <span className="font-bold text-primary">Simpan Perubahan</span> di bagian bawah setelah membuat perubahan.
          </p>
        </div>

        <div className="grid gap-6">
          {/* ═══ 1. Hero Banner Section ═══ */}
          <section className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2 border-b pb-2">
              <ImageIcon className="w-5 h-5 text-gray-500" />
              1. Hero Banner Section
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <CmsAssetField
                  label="Desktop Image"
                  value={formData.hero_image_url || ""}
                  onChange={(url) => handleChange("hero_image_url", url)}
                  onUpload={(file) => void handleUploadImage(file, (url) => handleChange("hero_image_url", url))}
                />
              </div>
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <CmsAssetField
                  label="Mobile Image"
                  value={formData.hero_image_mobile_url || ""}
                  onChange={(url) => handleChange("hero_image_mobile_url", url)}
                  onUpload={(file) => void handleUploadImage(file, (url) => handleChange("hero_image_mobile_url", url))}
                />
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Button Text (Line 1)</label>
                <input
                  type="text"
                  value={formData.hero_button_text_1 || ""}
                  onChange={(e) => handleChange("hero_button_text_1", e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Button Text (Line 2)</label>
                <input
                  type="text"
                  value={formData.hero_button_text_2 || ""}
                  onChange={(e) => handleChange("hero_button_text_2", e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Button Link URL</label>
                <input
                  type="text"
                  value={formData.hero_button_link || ""}
                  onChange={(e) => handleChange("hero_button_link", e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
                />
              </div>
            </div>
          </section>

          {/* ═══ 2. Image Carousel Section ═══ */}
          <section className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
            <div className="flex justify-between items-center border-b pb-2">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-gray-500" />
                2. Image Carousel Section
              </h2>
              <button
                type="button"
                onClick={addCarouselImage}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Tambah Gambar
              </button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {carouselImages.map((img, idx) => (
                <div key={idx} className="bg-gray-50 p-4 rounded-xl border border-gray-100 relative group pt-8">
                  <button
                    type="button"
                    onClick={() => removeCarouselImage(idx)}
                    className="absolute top-2 right-2 p-1.5 bg-white text-red-500 rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
                    title="Hapus Gambar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <CmsAssetField
                    label={`Carousel Image ${idx + 1}`}
                    value={img}
                    onChange={(url) => updateCarouselImage(idx, url)}
                    onUpload={(file) => void handleUploadImage(file, (url) => updateCarouselImage(idx, url))}
                  />
                </div>
              ))}
            </div>
            {carouselImages.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-8">
                Belum ada gambar carousel. Klik <span className="font-semibold">Tambah Gambar</span> untuk mulai menambahkan.
              </p>
            )}
          </section>

          {/* ═══ 3. Ticket Banner Section ═══ */}
          <section className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2 border-b pb-2">
              <ImageIcon className="w-5 h-5 text-gray-500" />
              3. Ticket Banner Section
            </h2>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Banner Title</label>
              <input
                type="text"
                value={formData.ticket_banner_title || ""}
                onChange={(e) => handleChange("ticket_banner_title", e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
              />
            </div>
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <CmsAssetField
                label="Ticket Banner Image"
                value={formData.ticket_banner_image_url || ""}
                onChange={(url) => handleChange("ticket_banner_image_url", url)}
                onUpload={(file) => void handleUploadImage(file, (url) => handleChange("ticket_banner_image_url", url))}
              />
            </div>
          </section>

          {/* ═══ 4. Promo Package Sections (Multiple) ═══ */}
          <section className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
            <div className="flex justify-between items-center border-b pb-2">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-gray-500" />
                4. Promo Package Sections
              </h2>
              <button
                type="button"
                onClick={addPromoSection}
                className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-lg flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Tambah Section
              </button>
            </div>

            {promoSections.length === 0 && (
              <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-400 mb-4">
                  Belum ada promo section. Klik <span className="font-semibold">Tambah Section</span> untuk mulai menambahkan.
                </p>
              </div>
            )}

            {promoSections.map((section, sectionIdx) => (
              <div key={section.id} className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-2xl border-2 border-gray-200 shadow-sm space-y-6 relative">
                {/* Section Header with Delete Button */}
                <div className="flex justify-between items-center border-b border-gray-200 pb-3">
                  <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <span className="bg-gradient-to-r from-pink-500 to-purple-500 text-white w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold">
                      {sectionIdx + 1}
                    </span>
                    Section {sectionIdx + 1}
                  </h3>
                  <button
                    type="button"
                    onClick={() => removePromoSection(sectionIdx)}
                    className="p-2 bg-white text-red-500 rounded-lg shadow-sm hover:bg-red-50 border border-gray-200 transition-colors flex items-center gap-2"
                    title="Hapus Section"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="text-sm font-semibold">Hapus Section</span>
                  </button>
                </div>

                {/* Section Fields */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Subtitle (Kecil di atas judul)</label>
                    <input
                      type="text"
                      value={section.subtitle}
                      onChange={(e) => updatePromoSection(sectionIdx, { subtitle: e.target.value })}
                      placeholder="SPARK STAGE"
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Main Title</label>
                    <input
                      type="text"
                      value={section.title}
                      onChange={(e) => updatePromoSection(sectionIdx, { title: e.target.value })}
                      placeholder="SPARKFROST"
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Title Highlight (Dalam kurung)</label>
                    <input
                      type="text"
                      value={section.title_highlight}
                      onChange={(e) => updatePromoSection(sectionIdx, { title_highlight: e.target.value })}
                      placeholder="(Winter Edition)"
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
                    />
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-gray-200">
                    <CmsAssetField
                      label="Promo Image"
                      value={section.image_url}
                      onChange={(url) => updatePromoSection(sectionIdx, { image_url: url })}
                      onUpload={(file) => void handleUploadImage(file, (url) => updatePromoSection(sectionIdx, { image_url: url }))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Harga</label>
                    <input
                      type="text"
                      value={section.price}
                      onChange={(e) => updatePromoSection(sectionIdx, { price: e.target.value })}
                      placeholder="Rp 475.000,00 IDR"
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Suffix Harga</label>
                    <input
                      type="text"
                      value={section.price_suffix}
                      onChange={(e) => updatePromoSection(sectionIdx, { price_suffix: e.target.value })}
                      placeholder="/Per Pax"
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
                    />
                  </div>
                </div>

                {/* Promo Packages - Individual Items */}
                <div className="mt-6 space-y-4 bg-white p-4 rounded-xl border border-gray-200">
                  <div className="flex justify-between items-center border-b pb-2">
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500">
                      Daftar Paket
                    </label>
                    <button
                      type="button"
                      onClick={() => addPromoPackage(sectionIdx)}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-2"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Tambah Paket
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {section.packages?.map((pkg, pkgIdx) => (
                      <div key={pkgIdx} className="bg-gray-50 p-3 rounded-xl border border-gray-100 relative group">
                        <button
                          type="button"
                          onClick={() => removePromoPackage(sectionIdx, pkgIdx)}
                          className="absolute -top-2 -right-2 p-1.5 bg-white text-red-500 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 border border-gray-200"
                          title="Hapus Paket"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <input
                          type="text"
                          value={pkg}
                          onChange={(e) => updatePromoPackage(sectionIdx, pkgIdx, e.target.value)}
                          placeholder={`Paket ${pkgIdx + 1} (contoh: Snow, Winter)`}
                          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
                        />
                      </div>
                    ))}
                  </div>

                  {(!section.packages || section.packages.length === 0) && (
                    <p className="text-xs text-gray-400 text-center py-6">
                      Belum ada paket. Klik <span className="font-semibold">Tambah Paket</span> untuk mulai menambahkan.
                    </p>
                  )}
                  
                  {section.packages && section.packages.length > 0 && (
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                      <p className="text-xs text-blue-700">
                        <span className="font-bold">Preview:</span> {section.packages.filter(Boolean).join(", ") || "(Kosong)"}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </section>

          {/* ═══ 5. Latest News Section ═══ */}
          <section className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2 border-b pb-2">
              <ImageIcon className="w-5 h-5 text-gray-500" />
              5. Latest News Section
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">News Title</label>
                <input
                  type="text"
                  value={formData.news_title || ""}
                  onChange={(e) => handleChange("news_title", e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">News Subtitle</label>
                <textarea
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
                  rows={2}
                  value={formData.news_subtitle || ""}
                  onChange={(e) => handleChange("news_subtitle", e.target.value)}
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Button Text</label>
                  <input
                    type="text"
                    value={formData.news_button_text || ""}
                    onChange={(e) => handleChange("news_button_text", e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Button Link URL</label>
                  <input
                    type="text"
                    value={formData.news_button_link || ""}
                    onChange={(e) => handleChange("news_button_link", e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
                  />
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <CmsAssetField
                  label="Background Image"
                  value={formData.news_background_url || ""}
                  onChange={(url) => handleChange("news_background_url", url)}
                  onUpload={(file) => void handleUploadImage(file, (url) => handleChange("news_background_url", url))}
                />
              </div>
            </div>
          </section>
        </div>
        
        <div className="flex justify-end pt-6">
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className="flex items-center gap-2 bg-[#ff4b86] hover:bg-[#e63d75] text-white px-8 py-3 rounded-full font-bold transition-all shadow-lg shadow-[#ff4b86]/30 hover:shadow-[#ff4b86]/50 active:scale-95 disabled:opacity-50 text-lg"
          >
            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}
