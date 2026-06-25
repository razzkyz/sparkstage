import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface RollerbladeFeature {
  id: number;
  icon: string;
  title: string;
  description: string;
  details: string[];
}

export interface RollerbladeGalleryItem {
  id: number;
  image: string;
  caption: string;
  category: 'venue' | 'equipment' | 'activity';
}

export interface SectionFonts {
  heading: string;
  body: string;
}

export interface RollerbladePageSettings {
  id: string;
  hero_image_url: string;
  hero_title: string;
  hero_subtitle: string;
  features: RollerbladeFeature[];
  gallery_items: RollerbladeGalleryItem[];
  cta_image_url: string;
  cta_title: string;
  cta_subtitle: string;
  section_fonts: {
    hero: SectionFonts;
    features: SectionFonts;
    gallery: SectionFonts;
    cta: SectionFonts;
  };
  created_at: string;
  updated_at: string;
}

// ============================================================================
// DEFAULT VALUES
// ============================================================================

export const DEFAULT_ROLLERBLADE_PAGE_SETTINGS: Omit<RollerbladePageSettings, 'id' | 'created_at' | 'updated_at'> = {
  hero_image_url: '/images/rollerblade-hero.jpg',
  hero_title: 'ROLLERBLADE ARENA',
  hero_subtitle: 'Nikmati pengalaman bermain rollerblade yang seru bersama teman dan keluarga',
  features: [
    {
      id: 1,
      icon: '🛼',
      title: 'Peralatan Berkualitas',
      description: 'Peralatan lengkap dari sepatu rollerblade hingga alat keselamatan untuk semua usia',
      details: [
        'Sepatu rollerblade berbagai ukuran (Kids, Teens, Adult)',
        'Helm keselamatan disesuaikan dengan ukuran kepala',
        'Pelindung lengkap (knee pad, elbow pad, wrist guard)',
        'Peralatan terawat dan dibersihkan secara rutin',
      ],
    },
    {
      id: 2,
      icon: '🏢',
      title: 'Arena Indoor Nyaman',
      description: 'Ruang bermain dalam gedung yang luas, aman, dan nyaman untuk segala cuaca',
      details: [
        'Area indoor dengan AC untuk kenyamanan maksimal',
        'Lantai khusus anti-slip berkualitas tinggi',
        'Bebas cuaca - main kapan saja tanpa khawatir hujan',
        'Pencahayaan optimal dan sirkulasi udara baik',
      ],
    },
    {
      id: 3,
      icon: '⏰',
      title: 'Jam Operasional Fleksibel',
      description: 'Sesi bermain yang fleksibel setiap hari, cocok untuk jadwal sibuk Anda',
      details: [
        'Senin - Jumat: 10.00 - 21.00 WIB',
        'Sabtu - Minggu: 09.00 - 22.00 WIB',
        'Sistem booking mudah untuk reservasi sesi',
        'Paket sesi khusus untuk acara grup & keluarga',
      ],
    },
    {
      id: 4,
      icon: '☕',
      title: 'Cafe & Ruang Tunggu',
      description: 'Area istirahat yang nyaman dengan cafe untuk menikmati makanan dan minuman',
      details: [
        'Cafe dengan menu makanan dan minuman lengkap',
        'Ruang tunggu nyaman untuk keluarga dan teman',
        'Free WiFi untuk yang ingin bekerja sambil menunggu',
        'Area duduk luas dengan view arena rollerblade',
      ],
    },
  ],
  gallery_items: [
    { id: 1, image: '/images/rollerblade-gallery-1.jpg', caption: 'Arena Luas & Aman', category: 'venue' },
    { id: 2, image: '/images/rollerblade-gallery-2.jpg', caption: 'Peralatan Berkualitas', category: 'equipment' },
    { id: 3, image: '/images/rollerblade-gallery-3.jpg', caption: 'Seru Bersama Teman', category: 'activity' },
    { id: 4, image: '/images/rollerblade-gallery-4.jpg', caption: 'Pengalaman Tak Terlupakan', category: 'activity' },
    { id: 5, image: '/images/rollerblade-gallery-5.jpg', caption: 'Fasilitas Lengkap', category: 'venue' },
    { id: 6, image: '/images/rollerblade-gallery-6.jpg', caption: 'Momen Kebersamaan', category: 'activity' },
  ],
  cta_image_url: '/images/rollerblade-cta.jpg',
  cta_title: 'Siap untuk Pengalaman Rollerblade Seru?',
  cta_subtitle: 'Datang langsung ke SparkStage Arena dan nikmati keseruan bermain rollerblade!',
  section_fonts: {
    hero: { heading: 'cardo', body: 'nunito_sans' },
    features: { heading: 'cardo', body: 'nunito_sans' },
    gallery: { heading: 'cardo', body: 'nunito_sans' },
    cta: { heading: 'cardo', body: 'nunito_sans' },
  },
};

// ============================================================================
// CUSTOM HOOK
// ============================================================================

export function useRollerbladeSettings() {
  const queryClient = useQueryClient();

  // Fetch settings from database
  const { data: settings, isLoading, error } = useQuery({
    queryKey: ['rollerblade-page-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rollerblade_page_settings')
        .select('*')
        .single();

      if (error) {
        console.error('Error fetching rollerblade settings:', error);
        throw error;
      }

      return data as RollerbladePageSettings;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2,
  });

  // Update settings mutation
  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<RollerbladePageSettings>) => {
      if (!settings?.id) {
        throw new Error('Settings not loaded yet');
      }

      const { data, error } = await supabase
        .from('rollerblade_page_settings')
        .update(updates)
        .eq('id', settings.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating rollerblade settings:', error);
        throw error;
      }

      return data as RollerbladePageSettings;
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['rollerblade-page-settings'] });
    },
  });

  return {
    settings: settings || null,
    isLoading,
    error,
    updateSettings: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get the next ID for a new feature
 */
export function getNextFeatureId(features: RollerbladeFeature[]): number {
  if (features.length === 0) return 1;
  return Math.max(...features.map((f) => f.id)) + 1;
}

/**
 * Get the next ID for a new gallery item
 */
export function getNextGalleryItemId(items: RollerbladeGalleryItem[]): number {
  if (items.length === 0) return 1;
  return Math.max(...items.map((i) => i.id)) + 1;
}

/**
 * Validate feature object
 */
export function isValidFeature(feature: Partial<RollerbladeFeature>): feature is RollerbladeFeature {
  return (
    typeof feature.id === 'number' &&
    typeof feature.icon === 'string' &&
    feature.icon.length > 0 &&
    typeof feature.title === 'string' &&
    feature.title.length > 0 &&
    typeof feature.description === 'string' &&
    feature.description.length > 0 &&
    Array.isArray(feature.details) &&
    feature.details.length > 0 &&
    feature.details.every((d) => typeof d === 'string')
  );
}

/**
 * Validate gallery item object
 */
export function isValidGalleryItem(item: Partial<RollerbladeGalleryItem>): item is RollerbladeGalleryItem {
  return (
    typeof item.id === 'number' &&
    typeof item.image === 'string' &&
    item.image.length > 0 &&
    typeof item.caption === 'string' &&
    item.caption.length > 0 &&
    typeof item.category === 'string' &&
    ['venue', 'equipment', 'activity'].includes(item.category)
  );
}
