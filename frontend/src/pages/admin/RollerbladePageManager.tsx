import { useCallback, useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/Toast';
import { ADMIN_MENU_ITEMS, ADMIN_MENU_SECTIONS } from '../../constants/adminMenu';
import {
  useRollerbladeSettings,
  type RollerbladePageSettings,
  type RollerbladeFeature,
  type RollerbladeGalleryItem,
  getNextFeatureId,
  getNextGalleryItemId,
} from '../../hooks/useRollerbladeSettings';
import CmsAssetField from '../../components/admin/CmsAssetField';
import { uploadCmsAsset } from '../../lib/cmsAssetUpload';

type RollerbladePageDraft = Omit<RollerbladePageSettings, 'id' | 'created_at' | 'updated_at'>;

function createDraft(source?: RollerbladePageSettings | null): RollerbladePageDraft {
  if (!source) {
    return {
      hero_image_url: '',
      hero_title: '',
      hero_subtitle: '',
      features: [],
      gallery_items: [],
      cta_image_url: '',
      cta_title: '',
      cta_subtitle: '',
      section_fonts: {
        hero: { heading: 'cardo', body: 'nunito_sans' },
        features: { heading: 'cardo', body: 'nunito_sans' },
        gallery: { heading: 'cardo', body: 'nunito_sans' },
        cta: { heading: 'cardo', body: 'nunito_sans' },
      },
    };
  }

  return {
    hero_image_url: source.hero_image_url || '',
    hero_title: source.hero_title || '',
    hero_subtitle: source.hero_subtitle || '',
    features: source.features || [],
    gallery_items: source.gallery_items || [],
    cta_image_url: source.cta_image_url || '',
    cta_title: source.cta_title || '',
    cta_subtitle: source.cta_subtitle || '',
    section_fonts: source.section_fonts,
  };
}

export default function RollerbladePageManager() {
  const { signOut } = useAuth();
  const { showToast } = useToast();
  const { settings, isLoading, updateSettings } = useRollerbladeSettings();

  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<RollerbladePageDraft>(() => createDraft(null));

  useEffect(() => {
    if (settings) {
      setDraft(createDraft(settings));
    }
  }, [settings]);

  const updateDraft = useCallback((updates: Partial<RollerbladePageDraft>) => {
    setDraft((current) => ({ ...current, ...updates }));
  }, []);

  const handleUploadImage = useCallback(
    async (file: File, onComplete: (url: string) => void, prefix: string) => {
      try {
        await uploadCmsAsset({
          file,
          bucket: 'rollerblade-assets',
          prefix,
          kind: 'image',
          folder: 'cms',
          showToast,
          onUploaded: onComplete,
        });
      } catch (err: unknown) {
        showToast('error', err instanceof Error ? err.message : 'Failed to upload image');
      }
    },
    [showToast]
  );

  const handleSave = async () => {
    setSaving(true);

    try {
      await updateSettings(draft);
      showToast('success', 'Rollerblade page settings saved successfully');
    } catch (err: unknown) {
      showToast('error', err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  // Feature operations
  const addFeature = () => {
    const newFeature: RollerbladeFeature = {
      id: getNextFeatureId(draft.features),
      image: '',
      title: 'New Feature',
      description: 'Feature description',
      details: ['Detail 1', 'Detail 2'],
    };
    updateDraft({ features: [...draft.features, newFeature] });
  };

  const updateFeature = <K extends keyof RollerbladeFeature>(
    index: number,
    field: K,
    value: RollerbladeFeature[K]
  ) => {
    updateDraft({
      features: draft.features.map((feature, i) =>
        i === index ? { ...feature, [field]: value } : feature
      ),
    });
  };

  const removeFeature = (index: number) => {
    updateDraft({ features: draft.features.filter((_, i) => i !== index) });
  };

  const addFeatureDetail = (featureIndex: number) => {
    const feature = draft.features[featureIndex];
    updateFeature(featureIndex, 'details', [...feature.details, 'New detail']);
  };

  const updateFeatureDetail = (featureIndex: number, detailIndex: number, value: string) => {
    const feature = draft.features[featureIndex];
    const newDetails = feature.details.map((detail, i) => (i === detailIndex ? value : detail));
    updateFeature(featureIndex, 'details', newDetails);
  };

  const removeFeatureDetail = (featureIndex: number, detailIndex: number) => {
    const feature = draft.features[featureIndex];
    updateFeature(
      featureIndex,
      'details',
      feature.details.filter((_, i) => i !== detailIndex)
    );
  };

  // Gallery operations
  const addGalleryItem = () => {
    const newItem: RollerbladeGalleryItem = {
      id: getNextGalleryItemId(draft.gallery_items),
      image: '',
      caption: 'New Gallery Item',
    };
    updateDraft({ gallery_items: [...draft.gallery_items, newItem] });
  };

  const updateGalleryItem = <K extends keyof RollerbladeGalleryItem>(
    index: number,
    field: K,
    value: RollerbladeGalleryItem[K]
  ) => {
    updateDraft({
      gallery_items: draft.gallery_items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    });
  };

  const removeGalleryItem = (index: number) => {
    updateDraft({ gallery_items: draft.gallery_items.filter((_, i) => i !== index) });
  };

  if (isLoading && !settings) {
    return (
      <AdminLayout
        menuItems={ADMIN_MENU_ITEMS}
        menuSections={ADMIN_MENU_SECTIONS}
        defaultActiveMenuId="rollerblade-cms"
        title="Rollerblade CMS"
        subtitle="Loading..."
        onLogout={signOut}
      >
        <div className="h-96 animate-pulse rounded-2xl bg-white" />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      menuItems={ADMIN_MENU_ITEMS}
      menuSections={ADMIN_MENU_SECTIONS}
      defaultActiveMenuId="rollerblade-cms"
      title="Rollerblade CMS"
      subtitle="Manage editable content for /rollerblade"
      onLogout={signOut}
    >
      <div className="space-y-8 pb-20">
        {/* Hero Section */}
        <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="border-b border-gray-100 pb-3">
            <h2 className="text-xl font-semibold text-gray-900">Hero Section</h2>
            <p className="mt-1 text-sm text-gray-500">
              Main banner image and text shown at the top of the page
            </p>
          </div>

          <div className="mt-6 space-y-4">
            <CmsAssetField
              label="Hero Image"
              value={draft.hero_image_url}
              kind="image"
              onChange={(value) => updateDraft({ hero_image_url: value })}
              onUpload={(file) =>
                void handleUploadImage(file, (url) => updateDraft({ hero_image_url: url }), 'hero')
              }
              previewClassName="h-40 w-full rounded-xl border border-gray-200 bg-white object-cover"
              uploadLabel="Upload image (1920x1080, 16:9 ratio)"
              placeholder="Or paste image URL"
            />

            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-gray-500">
                Hero Title
              </label>
              <input
                type="text"
                value={draft.hero_title}
                onChange={(e) => updateDraft({ hero_title: e.target.value })}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:border-black focus:outline-none"
                placeholder="ROLLERBLADE ARENA"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-gray-500">
                Hero Subtitle
              </label>
              <textarea
                value={draft.hero_subtitle}
                onChange={(e) => updateDraft({ hero_subtitle: e.target.value })}
                rows={2}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:border-black focus:outline-none"
                placeholder="Nikmati pengalaman bermain rollerblade..."
              />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4 border-b border-gray-100 pb-3">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Features Section</h2>
              <p className="mt-1 text-sm text-gray-500">
                Expandable feature cards with details ({draft.features.length} features)
              </p>
            </div>
            <button
              type="button"
              onClick={addFeature}
              className="rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Add Feature
            </button>
          </div>

          <div className="mt-6 grid gap-5 xl:grid-cols-2">
            {draft.features.map((feature, featureIndex) => (
              <div
                key={`feature-${feature.id}`}
                className="rounded-2xl border border-gray-200 bg-gray-50 p-4"
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-gray-900">Feature #{featureIndex + 1}</p>
                  <button
                    type="button"
                    onClick={() => removeFeature(featureIndex)}
                    className="rounded-full border border-red-200 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-red-600 hover:bg-red-50"
                  >
                    Remove
                  </button>
                </div>

                <div className="grid gap-4">
                  <CmsAssetField
                    label="Background Image"
                    value={feature.image}
                    kind="image"
                    onChange={(value) => updateFeature(featureIndex, 'image', value)}
                    onUpload={(file) =>
                      void handleUploadImage(
                        file,
                        (url) => updateFeature(featureIndex, 'image', url),
                        `feature-${featureIndex + 1}`
                      )
                    }
                    previewClassName="h-32 w-full rounded-xl border border-gray-200 bg-white object-cover"
                    uploadLabel="Upload image"
                    placeholder="Paste image URL"
                  />

                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-gray-500">
                      Title
                    </label>
                    <input
                      type="text"
                      value={feature.title}
                      onChange={(e) => updateFeature(featureIndex, 'title', e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-black focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-gray-500">
                      Description
                    </label>
                    <textarea
                      value={feature.description}
                      onChange={(e) => updateFeature(featureIndex, 'description', e.target.value)}
                      rows={3}
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-black focus:outline-none"
                    />
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <label className="block text-xs font-bold uppercase tracking-widest text-gray-500">
                        Details ({feature.details.length})
                      </label>
                      <button
                        type="button"
                        onClick={() => addFeatureDetail(featureIndex)}
                        className="text-xs font-semibold text-pink-600 hover:text-pink-700"
                      >
                        + Add Detail
                      </button>
                    </div>
                    <div className="space-y-2">
                      {feature.details.map((detail, detailIndex) => (
                        <div key={detailIndex} className="flex gap-2">
                          <input
                            type="text"
                            value={detail}
                            onChange={(e) =>
                              updateFeatureDetail(featureIndex, detailIndex, e.target.value)
                            }
                            className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs focus:border-black focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => removeFeatureDetail(featureIndex, detailIndex)}
                            className="rounded-lg border border-red-200 px-3 text-xs font-semibold text-red-600 hover:bg-red-50"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {draft.features.length === 0 && (
            <div className="mt-6 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center">
              <p className="text-sm text-gray-500">No features added yet. Click "Add Feature" to start.</p>
            </div>
          )}
        </section>

        {/* Gallery Section */}
        <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4 border-b border-gray-100 pb-3">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Gallery Section</h2>
              <p className="mt-1 text-sm text-gray-500">
                Photo gallery grid ({draft.gallery_items.length} items)
              </p>
            </div>
            <button
              type="button"
              onClick={addGalleryItem}
              className="rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Add Photo
            </button>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {draft.gallery_items.map((item, index) => (
              <div
                key={`gallery-${item.id}`}
                className="rounded-xl border border-gray-200 bg-gray-50 p-4"
              >
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-xs font-semibold text-gray-900">Photo #{index + 1}</p>
                  <button
                    type="button"
                    onClick={() => removeGalleryItem(index)}
                    className="rounded-full border border-red-200 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-red-600 hover:bg-red-50"
                  >
                    Remove
                  </button>
                </div>

                <div className="space-y-3">
                  <CmsAssetField
                    label="Image"
                    value={item.image}
                    kind="image"
                    onChange={(value) => updateGalleryItem(index, 'image', value)}
                    onUpload={(file) =>
                      void handleUploadImage(
                        file,
                        (url) => updateGalleryItem(index, 'image', url),
                        `gallery-${index + 1}`
                      )
                    }
                    previewClassName="h-24 w-full rounded-lg border border-gray-200 bg-white object-cover"
                    uploadLabel="Upload"
                    placeholder="Paste URL"
                  />

                  <div>
                    <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-gray-500">
                      Caption
                    </label>
                    <input
                      type="text"
                      value={item.caption}
                      onChange={(e) => updateGalleryItem(index, 'caption', e.target.value)}
                      className="w-full rounded-lg border border-gray-200 bg-white px-2 py-2 text-xs focus:border-black focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {draft.gallery_items.length === 0 && (
            <div className="mt-6 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center">
              <p className="text-sm text-gray-500">No gallery items yet. Click "Add Photo" to start.</p>
            </div>
          )}
        </section>

        {/* CTA Section */}
        <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="border-b border-gray-100 pb-3">
            <h2 className="text-xl font-semibold text-gray-900">CTA Section</h2>
            <p className="mt-1 text-sm text-gray-500">Call-to-action banner at the bottom of the page</p>
          </div>

          <div className="mt-6 space-y-4">
            <CmsAssetField
              label="CTA Image"
              value={draft.cta_image_url}
              kind="image"
              onChange={(value) => updateDraft({ cta_image_url: value })}
              onUpload={(file) =>
                void handleUploadImage(file, (url) => updateDraft({ cta_image_url: url }), 'cta')
              }
              previewClassName="h-40 w-full rounded-xl border border-gray-200 bg-white object-cover"
              uploadLabel="Upload image (1920x1080, 16:9 ratio)"
              placeholder="Or paste image URL"
            />

            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-gray-500">
                CTA Title
              </label>
              <input
                type="text"
                value={draft.cta_title}
                onChange={(e) => updateDraft({ cta_title: e.target.value })}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:border-black focus:outline-none"
                placeholder="Siap untuk Pengalaman Rollerblade Seru?"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-gray-500">
                CTA Subtitle
              </label>
              <textarea
                value={draft.cta_subtitle}
                onChange={(e) => updateDraft({ cta_subtitle: e.target.value })}
                rows={2}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:border-black focus:outline-none"
                placeholder="Datang langsung ke SparkStage Arena..."
              />
            </div>
          </div>
        </section>
      </div>

      {/* Fixed Save Button */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white px-6 py-4 shadow-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="text-sm text-gray-600">
            {draft.features.length} features • {draft.gallery_items.length} gallery items
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-full bg-pink-600 px-6 py-3 text-sm font-semibold text-white hover:bg-pink-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}
