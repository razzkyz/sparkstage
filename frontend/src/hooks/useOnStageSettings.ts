import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { queryKeys } from "../lib/queryKeys";
import { resolvePublicAssetUrl } from "../lib/publicAssetUrl";

export interface PromoSection {
  id: string;
  subtitle: string;
  title: string;
  title_highlight: string;
  image_url: string;
  price: string;
  price_suffix: string;
  packages: string[];
}

export interface OnStagePageSettings {
  id: string;
  
  hero_image_url: string;
  hero_image_mobile_url: string;
  hero_button_text_1: string;
  hero_button_text_2: string;
  hero_button_link: string;
  
  carousel_images: string[];
  
  ticket_banner_image_url: string;
  ticket_banner_title: string;
  
  // New: Multiple promo sections
  promo_sections: PromoSection[];
  
  // Legacy: Single promo (kept for backward compatibility)
  promo_image_url?: string;
  promo_subtitle?: string;
  promo_title?: string;
  promo_title_highlight?: string;
  promo_price?: string;
  promo_price_suffix?: string;
  promo_packages?: string[];
  
  news_background_url: string;
  news_title: string;
  news_subtitle: string;
  news_button_text: string;
  news_button_link: string;
  
  created_at?: string;
  updated_at?: string;
}

export function useOnStageSettings() {
  return useQuery({
    queryKey: queryKeys.onstageSettings ? queryKeys.onstageSettings() : ["onstage-page-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("onstage_page_settings")
        .select("*")
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
           // No rows returned
           return null;
        }
        throw error;
      }
      
      if (!data) return null;

      // Resolve URLs for images
      return {
        ...data,
        hero_image_url: resolvePublicAssetUrl(data.hero_image_url),
        hero_image_mobile_url: resolvePublicAssetUrl(data.hero_image_mobile_url),
        carousel_images: data.carousel_images?.map((url: string) => resolvePublicAssetUrl(url)) || [],
        ticket_banner_image_url: resolvePublicAssetUrl(data.ticket_banner_image_url),
        promo_sections: data.promo_sections?.map((section: PromoSection) => ({
          ...section,
          image_url: resolvePublicAssetUrl(section.image_url),
        })) || [],
        promo_image_url: data.promo_image_url ? resolvePublicAssetUrl(data.promo_image_url) : undefined,
        news_background_url: resolvePublicAssetUrl(data.news_background_url),
      } as OnStagePageSettings;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateOnStageSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: Partial<OnStagePageSettings>) => {
      // Get the existing row ID since it's a singleton
      const { data: existing } = await supabase
        .from("onstage_page_settings")
        .select("id")
        .single();
        
      if (!existing?.id) {
        throw new Error("Settings not found");
      }

      const { data, error } = await supabase
        .from("onstage_page_settings")
        .update(settings)
        .eq("id", existing.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.onstageSettings ? queryKeys.onstageSettings() : ["onstage-page-settings"]
      });
    },
  });
}
