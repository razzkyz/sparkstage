export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      app_configs: {
        Row: {
          created_at: string | null
          email_contact: string | null
          font_family: string
          footer_text: string | null
          id: number
          is_custom: boolean | null
          phone_contact: string | null
          updated_at: string | null
          url_font: string | null
        }
        Insert: {
          created_at?: string | null
          email_contact?: string | null
          font_family: string
          footer_text?: string | null
          id?: number
          is_custom?: boolean | null
          phone_contact?: string | null
          updated_at?: string | null
          url_font?: string | null
        }
        Update: {
          created_at?: string | null
          email_contact?: string | null
          font_family?: string
          footer_text?: string | null
          id?: number
          is_custom?: boolean | null
          phone_contact?: string | null
          updated_at?: string | null
          url_font?: string | null
        }
        Relationships: []
      }
      banners: {
        Row: {
          banner_type: string | null
          created_at: string | null
          display_order: number | null
          id: number
          image_url: string
          is_active: boolean | null
          link_url: string | null
          subtitle: string | null
          title: string
          title_image_url: string | null
          updated_at: string | null
        }
        Insert: {
          banner_type?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: number
          image_url: string
          is_active?: boolean | null
          link_url?: string | null
          subtitle?: string | null
          title: string
          title_image_url?: string | null
          updated_at?: string | null
        }
        Update: {
          banner_type?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: number
          image_url?: string
          is_active?: boolean | null
          link_url?: string | null
          subtitle?: string | null
          title?: string
          title_image_url?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      beauty_poster_tags: {
        Row: {
          created_at: string
          id: number
          label: string | null
          poster_id: number
          product_variant_id: number
          size_pct: number
          sort_order: number
          x_pct: number
          y_pct: number
        }
        Insert: {
          created_at?: string
          id?: number
          label?: string | null
          poster_id: number
          product_variant_id: number
          size_pct?: number
          sort_order?: number
          x_pct: number
          y_pct: number
        }
        Update: {
          created_at?: string
          id?: number
          label?: string | null
          poster_id?: number
          product_variant_id?: number
          size_pct?: number
          sort_order?: number
          x_pct?: number
          y_pct?: number
        }
        Relationships: [
          {
            foreignKeyName: "beauty_poster_tags_poster_id_fkey"
            columns: ["poster_id"]
            isOneToOne: false
            referencedRelation: "beauty_posters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "beauty_poster_tags_product_variant_id_fkey"
            columns: ["product_variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      beauty_posters: {
        Row: {
          created_at: string
          description: string | null
          id: number
          image_url: string
          is_active: boolean
          slug: string
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: number
          image_url: string
          is_active?: boolean
          slug: string
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: number
          image_url?: string
          is_active?: boolean
          slug?: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      booking_page_settings: {
        Row: {
          access_type_title: string
          all_day_access_helper: string
          all_day_access_label: string
          all_day_access_value_label: string
          booking_summary_title: string
          calendar_title: string
          choose_specific_time_label: string
          created_at: string
          date_label: string
          empty_slots_message: string
          id: string
          important_info_items: Json
          important_info_title: string
          journey_description: string
          journey_title: string
          max_tickets_label_template: string
          not_selected_label: string
          proceed_button_label: string
          quantity_label: string
          reserve_description: string
          reserve_title: string
          secure_checkout_label: string
          ticket_price_label: string
          ticket_type_label: string
          time_label: string
          time_slots_title: string
          total_label: string
          updated_at: string
          vat_included_label: string
        }
        Insert: {
          access_type_title?: string
          all_day_access_helper?: string
          all_day_access_label?: string
          all_day_access_value_label?: string
          booking_summary_title?: string
          calendar_title?: string
          choose_specific_time_label?: string
          created_at?: string
          date_label?: string
          empty_slots_message?: string
          id?: string
          important_info_items?: Json
          important_info_title?: string
          journey_description?: string
          journey_title?: string
          max_tickets_label_template?: string
          not_selected_label?: string
          proceed_button_label?: string
          quantity_label?: string
          reserve_description?: string
          reserve_title?: string
          secure_checkout_label?: string
          ticket_price_label?: string
          ticket_type_label?: string
          time_label?: string
          time_slots_title?: string
          total_label?: string
          updated_at?: string
          vat_included_label?: string
        }
        Update: {
          access_type_title?: string
          all_day_access_helper?: string
          all_day_access_label?: string
          all_day_access_value_label?: string
          booking_summary_title?: string
          calendar_title?: string
          choose_specific_time_label?: string
          created_at?: string
          date_label?: string
          empty_slots_message?: string
          id?: string
          important_info_items?: Json
          important_info_title?: string
          journey_description?: string
          journey_title?: string
          max_tickets_label_template?: string
          not_selected_label?: string
          proceed_button_label?: string
          quantity_label?: string
          reserve_description?: string
          reserve_title?: string
          secure_checkout_label?: string
          ticket_price_label?: string
          ticket_type_label?: string
          time_label?: string
          time_slots_title?: string
          total_label?: string
          updated_at?: string
          vat_included_label?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          color: string
          created_at: string | null
          description: string | null
          id: number
          is_active: boolean
          name: string
          parent_id: number | null
          slug: string
          updated_at: string | null
        }
        Insert: {
          color?: string
          created_at?: string | null
          description?: string | null
          id?: number
          is_active?: boolean
          name: string
          parent_id?: number | null
          slug: string
          updated_at?: string | null
        }
        Update: {
          color?: string
          created_at?: string | null
          description?: string | null
          id?: number
          is_active?: boolean
          name?: string
          parent_id?: number | null
          slug?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "categories_parent_id_foreign"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      charm_bar_page_settings: {
        Row: {
          best_seller_charms: number[] | null
          created_at: string
          customize_title: string
          hero_image_url: string
          how_it_works_cta_href: string
          how_it_works_cta_label: string
          how_it_works_intro: string
          how_it_works_steps: Json
          how_it_works_title: string
          how_it_works_video_url: string
          id: string
          quick_links: Json
          section_fonts: Json
          steps: Json
          updated_at: string
          video_cards: Json
          video_intro_text: string
        }
        Insert: {
          best_seller_charms?: number[] | null
          created_at?: string
          customize_title?: string
          hero_image_url?: string
          how_it_works_cta_href?: string
          how_it_works_cta_label?: string
          how_it_works_intro?: string
          how_it_works_steps?: Json
          how_it_works_title?: string
          how_it_works_video_url?: string
          id?: string
          quick_links?: Json
          section_fonts?: Json
          steps?: Json
          updated_at?: string
          video_cards?: Json
          video_intro_text?: string
        }
        Update: {
          best_seller_charms?: number[] | null
          created_at?: string
          customize_title?: string
          hero_image_url?: string
          how_it_works_cta_href?: string
          how_it_works_cta_label?: string
          how_it_works_intro?: string
          how_it_works_steps?: Json
          how_it_works_title?: string
          how_it_works_video_url?: string
          id?: string
          quick_links?: Json
          section_fonts?: Json
          steps?: Json
          updated_at?: string
          video_cards?: Json
          video_intro_text?: string
        }
        Relationships: []
      }
      discount_products: {
        Row: {
          category_id: number | null
          created_at: string | null
          discount_id: number
          id: number
          product_id: number | null
          updated_at: string | null
        }
        Insert: {
          category_id?: number | null
          created_at?: string | null
          discount_id: number
          id?: number
          product_id?: number | null
          updated_at?: string | null
        }
        Update: {
          category_id?: number | null
          created_at?: string | null
          discount_id?: number
          id?: number
          product_id?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "discount_products_category_id_foreign"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discount_products_discount_id_foreign"
            columns: ["discount_id"]
            isOneToOne: false
            referencedRelation: "discounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discount_products_product_id_foreign"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      discounts: {
        Row: {
          channel: string
          code: string | null
          created_at: string | null
          end_date: string
          id: number
          is_active: boolean
          min_purchase: number | null
          name: string
          start_date: string
          type: string
          updated_at: string | null
          usage_count: number
          usage_limit: number | null
          value: number
        }
        Insert: {
          channel?: string
          code?: string | null
          created_at?: string | null
          end_date: string
          id?: number
          is_active?: boolean
          min_purchase?: number | null
          name: string
          start_date: string
          type: string
          updated_at?: string | null
          usage_count?: number
          usage_limit?: number | null
          value: number
        }
        Update: {
          channel?: string
          code?: string | null
          created_at?: string | null
          end_date?: string
          id?: number
          is_active?: boolean
          min_purchase?: number | null
          name?: string
          start_date?: string
          type?: string
          updated_at?: string | null
          usage_count?: number
          usage_limit?: number | null
          value?: number
        }
        Relationships: []
      }
      dressing_room_collections: {
        Row: {
          cover_image_url: string | null
          created_at: string
          description: string | null
          id: number
          is_active: boolean
          slug: string
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          id?: number
          is_active?: boolean
          slug: string
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          id?: number
          is_active?: boolean
          slug?: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      dressing_room_look_items: {
        Row: {
          created_at: string
          id: number
          label: string | null
          look_id: number
          product_variant_id: number
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: number
          label?: string | null
          look_id: number
          product_variant_id: number
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: number
          label?: string | null
          look_id?: number
          product_variant_id?: number
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "fashion_look_items_look_id_fkey"
            columns: ["look_id"]
            isOneToOne: false
            referencedRelation: "dressing_room_looks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fashion_look_items_product_variant_id_fkey"
            columns: ["product_variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      dressing_room_look_photos: {
        Row: {
          created_at: string
          id: number
          image_url: string
          label: string | null
          look_id: number
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: number
          image_url: string
          label?: string | null
          look_id: number
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: number
          image_url?: string
          label?: string | null
          look_id?: number
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "fashion_look_photos_look_id_fkey"
            columns: ["look_id"]
            isOneToOne: false
            referencedRelation: "dressing_room_looks"
            referencedColumns: ["id"]
          },
        ]
      }
      dressing_room_looks: {
        Row: {
          collection_id: number
          created_at: string
          id: number
          look_number: number
          model_image_url: string
          model_name: string | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          collection_id: number
          created_at?: string
          id?: number
          look_number: number
          model_image_url: string
          model_name?: string | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          collection_id?: number
          created_at?: string
          id?: number
          look_number?: number
          model_image_url?: string
          model_name?: string | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fashion_looks_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "dressing_room_collections"
            referencedColumns: ["id"]
          },
        ]
      }
      event_bookings: {
        Row: {
          admin_notes: string | null
          approval_notes: string | null
          approval_status: string | null
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          customer_email: string | null
          customer_name: string
          customer_phone: string | null
          entered_at: string | null
          entrance_status: string | null
          gross_amount: number | null
          id: string
          order_number: string | null
          paymenku_trx_id: string | null
          payment_gateway: string | null
          payment_method: string | null
          qr_code_file: string | null
          scanned_by: string | null
          selected_date: string
          selected_time: string | null
          status: Database["public"]["Enums"]["event_booking_status"] | null
          ticket_code: string | null
          ticket_id: number
          transaction_proof_file: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          approval_notes?: string | null
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string | null
          entered_at?: string | null
          entrance_status?: string | null
          gross_amount?: number | null
          id?: string
          order_number?: string | null
          paymenku_trx_id?: string | null
          payment_gateway?: string | null
          payment_method?: string | null
          qr_code_file?: string | null
          scanned_by?: string | null
          selected_date: string
          selected_time?: string | null
          status?: Database["public"]["Enums"]["event_booking_status"] | null
          ticket_code?: string | null
          ticket_id: number
          transaction_proof_file?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          approval_notes?: string | null
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string | null
          entered_at?: string | null
          entrance_status?: string | null
          gross_amount?: number | null
          id?: string
          order_number?: string | null
          paymenku_trx_id?: string | null
          payment_gateway?: string | null
          payment_method?: string | null
          qr_code_file?: string | null
          scanned_by?: string | null
          selected_date?: string
          selected_time?: string | null
          status?: Database["public"]["Enums"]["event_booking_status"] | null
          ticket_code?: string | null
          ticket_id?: number
          transaction_proof_file?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_bookings_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      event_page_settings: {
        Row: {
          created_at: string
          experience_images: string[]
          experience_links: Json
          experience_title: string
          hero_images: string[]
          id: string
          magic_button_link: string
          magic_button_text: string
          magic_description: string
          magic_images: string[]
          magic_title: string
          section_fonts: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          experience_images?: string[]
          experience_links?: Json
          experience_title?: string
          hero_images?: string[]
          id?: string
          magic_button_link?: string
          magic_button_text?: string
          magic_description?: string
          magic_images?: string[]
          magic_title?: string
          section_fonts?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          experience_images?: string[]
          experience_links?: Json
          experience_title?: string
          hero_images?: string[]
          id?: string
          magic_button_link?: string
          magic_button_text?: string
          magic_description?: string
          magic_images?: string[]
          magic_title?: string
          section_fonts?: Json
          updated_at?: string
        }
        Relationships: []
      }
      events_schedule_items: {
        Row: {
          button_text: string
          button_url: string | null
          category: string
          created_at: string
          description: string
          event_date: string
          id: number
          image_bucket: string | null
          image_path: string | null
          image_url: string | null
          is_active: boolean
          is_coming_soon: boolean
          placeholder_icon: string | null
          sort_order: number
          time_label: string
          title: string
          updated_at: string
        }
        Insert: {
          button_text?: string
          button_url?: string | null
          category: string
          created_at?: string
          description: string
          event_date: string
          id?: number
          image_bucket?: string | null
          image_path?: string | null
          image_url?: string | null
          is_active?: boolean
          is_coming_soon?: boolean
          placeholder_icon?: string | null
          sort_order?: number
          time_label: string
          title: string
          updated_at?: string
        }
        Update: {
          button_text?: string
          button_url?: string | null
          category?: string
          created_at?: string
          description?: string
          event_date?: string
          id?: number
          image_bucket?: string | null
          image_path?: string | null
          image_url?: string | null
          is_active?: boolean
          is_coming_soon?: boolean
          placeholder_icon?: string | null
          sort_order?: number
          time_label?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      glam_page_settings: {
        Row: {
          created_at: string
          hero_description: string
          hero_image_url: string
          hero_title: string
          id: string
          look_heading: string
          look_model_image_url: string
          look_star_links: Json
          product_search_placeholder: string
          product_section_title: string
          section_fonts: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          hero_description?: string
          hero_image_url?: string
          hero_title?: string
          id?: string
          look_heading?: string
          look_model_image_url?: string
          look_star_links?: Json
          product_search_placeholder?: string
          product_section_title?: string
          section_fonts?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          hero_description?: string
          hero_image_url?: string
          hero_title?: string
          id?: string
          look_heading?: string
          look_model_image_url?: string
          look_star_links?: Json
          product_search_placeholder?: string
          product_section_title?: string
          section_fonts?: Json
          updated_at?: string
        }
        Relationships: []
      }
      news_page_settings: {
        Row: {
          created_at: string
          id: string
          section_1_author: string
          section_1_category: string
          section_1_description: string
          section_1_excerpt: string
          section_1_image: string
          section_1_title: string
          section_2_image: string
          section_2_quotes: string
          section_2_subtitle1: string
          section_2_subtitle2: string
          section_2_title: string
          section_3_products: Json
          section_3_title: string
          section_fonts: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          section_1_author?: string
          section_1_category?: string
          section_1_description?: string
          section_1_excerpt?: string
          section_1_image?: string
          section_1_title?: string
          section_2_image?: string
          section_2_quotes?: string
          section_2_subtitle1?: string
          section_2_subtitle2?: string
          section_2_title?: string
          section_3_products?: Json
          section_3_title?: string
          section_fonts?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          section_1_author?: string
          section_1_category?: string
          section_1_description?: string
          section_1_excerpt?: string
          section_1_image?: string
          section_1_title?: string
          section_2_image?: string
          section_2_quotes?: string
          section_2_subtitle1?: string
          section_2_subtitle2?: string
          section_2_title?: string
          section_3_products?: Json
          section_3_title?: string
          section_fonts?: Json
          updated_at?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string | null
          id: number
          order_id: number
          quantity: number
          selected_date: string
          selected_time_slots: Json | null
          subtotal: number
          ticket_id: number
          unit_price: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          order_id: number
          quantity: number
          selected_date: string
          selected_time_slots?: Json | null
          subtotal: number
          ticket_id: number
          unit_price: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          order_id?: number
          quantity?: number
          selected_date?: string
          selected_time_slots?: Json | null
          subtotal?: number
          ticket_id?: number
          unit_price?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_foreign"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_ticket_id_foreign"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      order_product_items: {
        Row: {
          created_at: string | null
          discount_amount: number
          estimated_delivery_date: string | null
          id: number
          order_product_id: number
          price: number
          product_variant_id: number
          quantity: number
          stock_type: string
          subtotal: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          discount_amount?: number
          estimated_delivery_date?: string | null
          id?: number
          order_product_id: number
          price: number
          product_variant_id: number
          quantity: number
          stock_type: string
          subtotal: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          discount_amount?: number
          estimated_delivery_date?: string | null
          id?: number
          order_product_id?: number
          price?: number
          product_variant_id?: number
          quantity?: number
          stock_type?: string
          subtotal?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_product_items_order_product_id_foreign"
            columns: ["order_product_id"]
            isOneToOne: false
            referencedRelation: "order_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_product_items_product_variant_id_foreign"
            columns: ["product_variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      order_products: {
        Row: {
          channel: string
          created_at: string | null
          discount_amount: number
          discount_id: number | null
          expired_at: string | null
          gross_amount: number | null
          id: number
          notes: string | null
          order_number: string
          paid_at: string | null
          paymenku_trx_id: string | null
          payment_data: Json | null
          payment_expired_at: string | null
          payment_gateway: string | null
          payment_status: string
          payment_url: string | null
          picked_up_at: string | null
          picked_up_by: string | null
          pickup_code: string | null
          pickup_expires_at: string | null
          pickup_status: string
          shipping_cost: number
          shipping_discount: number
          shipping_voucher_id: number | null
          status: string
          stock_released_at: string | null
          subtotal: number
          total: number
          updated_at: string | null
          user_id: string | null
          voucher_code: string | null
          voucher_discount: number | null
          voucher_id: string | null
        }
        Insert: {
          channel: string
          created_at?: string | null
          discount_amount?: number
          discount_id?: number | null
          expired_at?: string | null
          gross_amount?: number | null
          id?: number
          notes?: string | null
          order_number: string
          paid_at?: string | null
          paymenku_trx_id?: string | null
          payment_data?: Json | null
          payment_expired_at?: string | null
          payment_gateway?: string | null
          payment_status?: string
          payment_url?: string | null
          picked_up_at?: string | null
          picked_up_by?: string | null
          pickup_code?: string | null
          pickup_expires_at?: string | null
          pickup_status?: string
          shipping_cost?: number
          shipping_discount?: number
          shipping_voucher_id?: number | null
          status: string
          stock_released_at?: string | null
          subtotal: number
          total: number
          updated_at?: string | null
          user_id?: string | null
          voucher_code?: string | null
          voucher_discount?: number | null
          voucher_id?: string | null
        }
        Update: {
          channel?: string
          created_at?: string | null
          discount_amount?: number
          discount_id?: number | null
          expired_at?: string | null
          gross_amount?: number | null
          id?: number
          notes?: string | null
          order_number?: string
          paid_at?: string | null
          paymenku_trx_id?: string | null
          payment_data?: Json | null
          payment_expired_at?: string | null
          payment_gateway?: string | null
          payment_status?: string
          payment_url?: string | null
          picked_up_at?: string | null
          picked_up_by?: string | null
          pickup_code?: string | null
          pickup_expires_at?: string | null
          pickup_status?: string
          shipping_cost?: number
          shipping_discount?: number
          shipping_voucher_id?: number | null
          status?: string
          stock_released_at?: string | null
          subtotal?: number
          total?: number
          updated_at?: string | null
          user_id?: string | null
          voucher_code?: string | null
          voucher_discount?: number | null
          voucher_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_products_discount_id_foreign"
            columns: ["discount_id"]
            isOneToOne: false
            referencedRelation: "discounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_products_shipping_voucher_id_foreign"
            columns: ["shipping_voucher_id"]
            isOneToOne: false
            referencedRelation: "shipping_vouchers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_products_user_id_profiles_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_products_voucher_id_fkey"
            columns: ["voucher_id"]
            isOneToOne: false
            referencedRelation: "vouchers"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          capacity_released_at: string | null
          created_at: string | null
          expires_at: string
          id: number
          order_number: string
          paymenku_trx_id: string | null
          payment_data: Json | null
          payment_gateway: string | null
          payment_id: string | null
          payment_url: string | null
          status: string
          tickets_issued_at: string | null
          total_amount: number
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          capacity_released_at?: string | null
          created_at?: string | null
          expires_at: string
          id?: number
          order_number: string
          paymenku_trx_id?: string | null
          payment_data?: Json | null
          payment_gateway?: string | null
          payment_id?: string | null
          payment_url?: string | null
          status?: string
          tickets_issued_at?: string | null
          total_amount: number
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          capacity_released_at?: string | null
          created_at?: string | null
          expires_at?: string
          id?: number
          order_number?: string
          paymenku_trx_id?: string | null
          payment_data?: Json | null
          payment_gateway?: string | null
          payment_id?: string | null
          payment_url?: string | null
          status?: string
          tickets_issued_at?: string | null
          total_amount?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      payment_effect_runs: {
        Row: {
          completed_at: string | null
          effect_key: string
          effect_scope: string
          effect_type: string
          heartbeat_at: string
          id: number
          last_error: string | null
          metadata: Json | null
          order_ref: string
          started_at: string
          status: string
        }
        Insert: {
          completed_at?: string | null
          effect_key?: string
          effect_scope: string
          effect_type: string
          heartbeat_at?: string
          id?: number
          last_error?: string | null
          metadata?: Json | null
          order_ref: string
          started_at?: string
          status?: string
        }
        Update: {
          completed_at?: string | null
          effect_key?: string
          effect_scope?: string
          effect_type?: string
          heartbeat_at?: string
          id?: number
          last_error?: string | null
          metadata?: Json | null
          order_ref?: string
          started_at?: string
          status?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string | null
          expired_at: string | null
          id: number
          order_product_id: number
          paid_at: string | null
          payment_data: Json | null
          payment_method: string
          payment_reference: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          expired_at?: string | null
          id?: number
          order_product_id: number
          paid_at?: string | null
          payment_data?: Json | null
          payment_method: string
          payment_reference?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          expired_at?: string | null
          id?: number
          order_product_id?: number
          paid_at?: string | null
          payment_data?: Json | null
          payment_method?: string
          payment_reference?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_product_id_foreign"
            columns: ["order_product_id"]
            isOneToOne: false
            referencedRelation: "order_products"
            referencedColumns: ["id"]
          },
        ]
      }
      print_orders: {
        Row: {
          amount: number | null
          created_at: string | null
          customer_email: string | null
          customer_name: string | null
          doku_order_id: string | null
          fotoshare_token: string | null
          id: string | null
          image_url: string | null
          image_urls: string | null
          paid_at: string | null
          payment_method: string | null
          photo_sizes: string[] | null
          qty: number | null
          queue_number: string | null
          receipt_sent_at: string | null
          size: string | null
          snap_created_at: string | null
          snap_error: string | null
          snap_redirect_url: string | null
          snap_token: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          customer_email?: string | null
          customer_name?: string | null
          doku_order_id?: string | null
          fotoshare_token?: string | null
          id?: string | null
          image_url?: string | null
          image_urls?: string | null
          paid_at?: string | null
          payment_method?: string | null
          photo_sizes?: string[] | null
          qty?: number | null
          queue_number?: string | null
          receipt_sent_at?: string | null
          size?: string | null
          snap_created_at?: string | null
          snap_error?: string | null
          snap_redirect_url?: string | null
          snap_token?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          customer_email?: string | null
          customer_name?: string | null
          doku_order_id?: string | null
          fotoshare_token?: string | null
          id?: string | null
          image_url?: string | null
          image_urls?: string | null
          paid_at?: string | null
          payment_method?: string | null
          photo_sizes?: string[] | null
          qty?: number | null
          queue_number?: string | null
          receipt_sent_at?: string | null
          size?: string | null
          snap_created_at?: string | null
          snap_error?: string | null
          snap_redirect_url?: string | null
          snap_token?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      product_images: {
        Row: {
          created_at: string | null
          display_order: number
          id: number
          image_provider: string
          image_url: string
          is_primary: boolean
          migrated_at: string | null
          product_id: number
          provider_file_id: string | null
          provider_file_path: string | null
          provider_original_url: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number
          id?: number
          image_provider?: string
          image_url: string
          is_primary?: boolean
          migrated_at?: string | null
          product_id: number
          provider_file_id?: string | null
          provider_file_path?: string | null
          provider_original_url?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number
          id?: number
          image_provider?: string
          image_url?: string
          is_primary?: boolean
          migrated_at?: string | null
          product_id?: number
          provider_file_id?: string | null
          provider_file_path?: string | null
          provider_original_url?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_orders: {
        Row: {
          amount: number
          created_at: string | null
          customer_email: string
          customer_name: string
          doku_order_id: string
          id: string
          order_type: string | null
          paid_at: string | null
          payment_method: string | null
          product_id: string | null
          product_name: string | null
          product_sku: string | null
          qty: number
          shipped_at: string | null
          source_project: string | null
          status: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          customer_email: string
          customer_name: string
          doku_order_id: string
          id?: string
          order_type?: string | null
          paid_at?: string | null
          payment_method?: string | null
          product_id?: string | null
          product_name?: string | null
          product_sku?: string | null
          qty?: number
          shipped_at?: string | null
          source_project?: string | null
          status?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          customer_email?: string
          customer_name?: string
          doku_order_id?: string
          id?: string
          order_type?: string | null
          paid_at?: string | null
          payment_method?: string | null
          product_id?: string | null
          product_name?: string | null
          product_sku?: string | null
          qty?: number
          shipped_at?: string | null
          source_project?: string | null
          status?: string | null
        }
        Relationships: []
      }
      product_reviews: {
        Row: {
          comment: string | null
          created_at: string | null
          id: number
          is_approved: boolean
          is_verified: boolean
          order_product_id: number
          product_id: number
          product_variant_id: number | null
          rating: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          id?: number
          is_approved?: boolean
          is_verified?: boolean
          order_product_id: number
          product_id: number
          product_variant_id?: number | null
          rating: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          id?: number
          is_approved?: boolean
          is_verified?: boolean
          order_product_id?: number
          product_id?: number
          product_variant_id?: number | null
          rating?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_reviews_order_product_id_foreign"
            columns: ["order_product_id"]
            isOneToOne: false
            referencedRelation: "order_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_reviews_product_id_foreign"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_reviews_product_variant_id_foreign"
            columns: ["product_variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          attributes: Json
          created_at: string | null
          deposit_amount: number | null
          id: number
          is_active: boolean
          name: string
          preorder_available_date: string | null
          preorder_duration: number | null
          price: number | null
          product_id: number
          reserved_stock: number
          sku: string
          stock: number
          stock_type: string
          updated_at: string | null
        }
        Insert: {
          attributes?: Json
          created_at?: string | null
          deposit_amount?: number | null
          id?: number
          is_active?: boolean
          name: string
          preorder_available_date?: string | null
          preorder_duration?: number | null
          price?: number | null
          product_id: number
          reserved_stock?: number
          sku: string
          stock?: number
          stock_type?: string
          updated_at?: string | null
        }
        Update: {
          attributes?: Json
          created_at?: string | null
          deposit_amount?: number | null
          id?: number
          is_active?: boolean
          name?: string
          preorder_available_date?: string | null
          preorder_duration?: number | null
          price?: number | null
          product_id?: number
          reserved_stock?: number
          sku?: string
          stock?: number
          stock_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_foreign"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category_id: number
          created_at: string | null
          deleted_at: string | null
          description: string | null
          id: number
          image_url: string | null
          is_active: boolean
          name: string
          sku: string
          slug: string
          updated_at: string | null
        }
        Insert: {
          category_id: number
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: number
          image_url?: string | null
          is_active?: boolean
          name: string
          sku: string
          slug: string
          updated_at?: string | null
        }
        Update: {
          category_id?: number
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: number
          image_url?: string | null
          is_active?: boolean
          name?: string
          sku?: string
          slug?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_foreign"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          id: string
          name: string | null
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          id: string
          name?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      purchased_tickets: {
        Row: {
          created_at: string | null
          id: number
          order_item_id: number
          queue_number: number | null
          queue_overflow: boolean
          redeemed_merchandise_at: string | null
          scanned_by: string | null
          status: string
          ticket_code: string
          ticket_id: number
          time_slot: string | null
          updated_at: string | null
          used_at: string | null
          user_id: string | null
          valid_date: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          order_item_id: number
          queue_number?: number | null
          queue_overflow?: boolean
          redeemed_merchandise_at?: string | null
          scanned_by?: string | null
          status?: string
          ticket_code: string
          ticket_id: number
          time_slot?: string | null
          updated_at?: string | null
          used_at?: string | null
          user_id?: string | null
          valid_date: string
        }
        Update: {
          created_at?: string | null
          id?: number
          order_item_id?: number
          queue_number?: number | null
          queue_overflow?: boolean
          redeemed_merchandise_at?: string | null
          scanned_by?: string | null
          status?: string
          ticket_code?: string
          ticket_id?: number
          time_slot?: string | null
          updated_at?: string | null
          used_at?: string | null
          user_id?: string | null
          valid_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchased_tickets_order_item_id_foreign"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "order_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchased_tickets_ticket_id_foreign"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      reservations: {
        Row: {
          created_at: string | null
          expires_at: string
          id: number
          quantity: number
          selected_date: string
          selected_time_slots: Json | null
          status: string
          ticket_id: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: number
          quantity: number
          selected_date: string
          selected_time_slots?: Json | null
          status?: string
          ticket_id: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: number
          quantity?: number
          selected_date?: string
          selected_time_slots?: Json | null
          status?: string
          ticket_id?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservations_ticket_id_foreign"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      shipments: {
        Row: {
          courier: string | null
          created_at: string | null
          delivered_at: string | null
          id: number
          notes: string | null
          order_product_id: number
          recipient_address: string
          recipient_name: string
          recipient_phone: string
          service: string | null
          shipped_at: string | null
          status: string
          tracking_number: string | null
          updated_at: string | null
        }
        Insert: {
          courier?: string | null
          created_at?: string | null
          delivered_at?: string | null
          id?: number
          notes?: string | null
          order_product_id: number
          recipient_address: string
          recipient_name: string
          recipient_phone: string
          service?: string | null
          shipped_at?: string | null
          status: string
          tracking_number?: string | null
          updated_at?: string | null
        }
        Update: {
          courier?: string | null
          created_at?: string | null
          delivered_at?: string | null
          id?: number
          notes?: string | null
          order_product_id?: number
          recipient_address?: string
          recipient_name?: string
          recipient_phone?: string
          service?: string | null
          shipped_at?: string | null
          status?: string
          tracking_number?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shipments_order_product_id_foreign"
            columns: ["order_product_id"]
            isOneToOne: false
            referencedRelation: "order_products"
            referencedColumns: ["id"]
          },
        ]
      }
      shipping_settings: {
        Row: {
          city_id: number
          created_at: string | null
          district_id: number
          expeditions: Json
          id: number
          province_id: number
          updated_at: string | null
        }
        Insert: {
          city_id: number
          created_at?: string | null
          district_id: number
          expeditions: Json
          id?: number
          province_id: number
          updated_at?: string | null
        }
        Update: {
          city_id?: number
          created_at?: string | null
          district_id?: number
          expeditions?: Json
          id?: number
          province_id?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      shipping_voucher_usage: {
        Row: {
          created_at: string | null
          discount_amount: number
          id: number
          order_product_id: number
          shipping_voucher_id: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          discount_amount: number
          id?: number
          order_product_id: number
          shipping_voucher_id: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          discount_amount?: number
          id?: number
          order_product_id?: number
          shipping_voucher_id?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shipping_voucher_usage_order_product_id_foreign"
            columns: ["order_product_id"]
            isOneToOne: false
            referencedRelation: "order_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipping_voucher_usage_shipping_voucher_id_foreign"
            columns: ["shipping_voucher_id"]
            isOneToOne: false
            referencedRelation: "shipping_vouchers"
            referencedColumns: ["id"]
          },
        ]
      }
      shipping_vouchers: {
        Row: {
          code: string
          created_at: string | null
          end_date: string
          id: number
          is_active: boolean
          max_discount: number | null
          min_purchase: number | null
          name: string
          start_date: string
          type: string
          updated_at: string | null
          usage_count: number
          usage_limit: number | null
          usage_per_user: number
          value: number
        }
        Insert: {
          code: string
          created_at?: string | null
          end_date: string
          id?: number
          is_active?: boolean
          max_discount?: number | null
          min_purchase?: number | null
          name: string
          start_date: string
          type: string
          updated_at?: string | null
          usage_count?: number
          usage_limit?: number | null
          usage_per_user?: number
          value: number
        }
        Update: {
          code?: string
          created_at?: string | null
          end_date?: string
          id?: number
          is_active?: boolean
          max_discount?: number | null
          min_purchase?: number | null
          name?: string
          start_date?: string
          type?: string
          updated_at?: string | null
          usage_count?: number
          usage_limit?: number | null
          usage_per_user?: number
          value?: number
        }
        Relationships: []
      }
      stage_gallery: {
        Row: {
          created_at: string | null
          display_order: number | null
          id: number
          image_url: string
          stage_id: number
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          id?: number
          image_url: string
          stage_id: number
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          id?: number
          image_url?: string
          stage_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "stage_gallery_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "stages"
            referencedColumns: ["id"]
          },
        ]
      }
      stage_reviews: {
        Row: {
          comment: string | null
          created_at: string | null
          id: number
          is_approved: boolean | null
          rating: number
          stage_id: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          id?: number
          is_approved?: boolean | null
          rating: number
          stage_id: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          id?: number
          is_approved?: boolean | null
          rating?: number
          stage_id?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stage_reviews_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "stages"
            referencedColumns: ["id"]
          },
        ]
      }
      stage_scans: {
        Row: {
          id: number
          ip_address: unknown
          purchased_ticket_id: number | null
          scanned_at: string | null
          stage_id: number
          user_agent: string | null
        }
        Insert: {
          id?: number
          ip_address?: unknown
          purchased_ticket_id?: number | null
          scanned_at?: string | null
          stage_id: number
          user_agent?: string | null
        }
        Update: {
          id?: number
          ip_address?: unknown
          purchased_ticket_id?: number | null
          scanned_at?: string | null
          stage_id?: number
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stage_scans_purchased_ticket_id_fkey"
            columns: ["purchased_ticket_id"]
            isOneToOne: false
            referencedRelation: "purchased_tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stage_scans_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "stages"
            referencedColumns: ["id"]
          },
        ]
      }
      stages: {
        Row: {
          code: string
          created_at: string | null
          description: string | null
          display_order: number
          id: number
          max_occupancy: number | null
          name: string
          qr_code_url: string | null
          status: string | null
          updated_at: string | null
          zone: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          description?: string | null
          display_order?: number
          id?: number
          max_occupancy?: number | null
          name: string
          qr_code_url?: string | null
          status?: string | null
          updated_at?: string | null
          zone?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          description?: string | null
          display_order?: number
          id?: number
          max_occupancy?: number | null
          name?: string
          qr_code_url?: string | null
          status?: string | null
          updated_at?: string | null
          zone?: string | null
        }
        Relationships: []
      }
      stock_reservations: {
        Row: {
          created_at: string | null
          id: number
          order_product_id: number
          product_variant_id: number
          quantity: number
          reserved_until: string
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          order_product_id: number
          product_variant_id: number
          quantity: number
          reserved_until: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          order_product_id?: number
          product_variant_id?: number
          quantity?: number
          reserved_until?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_reservations_order_product_id_foreign"
            columns: ["order_product_id"]
            isOneToOne: false
            referencedRelation: "order_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_reservations_product_variant_id_foreign"
            columns: ["product_variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_availabilities: {
        Row: {
          created_at: string | null
          date: string
          id: number
          reserved_capacity: number
          sold_capacity: number
          ticket_id: number
          time_slot: string | null
          total_capacity: number
          updated_at: string | null
          version: number
        }
        Insert: {
          created_at?: string | null
          date: string
          id?: number
          reserved_capacity?: number
          sold_capacity?: number
          ticket_id: number
          time_slot?: string | null
          total_capacity?: number
          updated_at?: string | null
          version?: number
        }
        Update: {
          created_at?: string | null
          date?: string
          id?: number
          reserved_capacity?: number
          sold_capacity?: number
          ticket_id?: number
          time_slot?: string | null
          total_capacity?: number
          updated_at?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "ticket_availabilities_ticket_id_foreign"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_availability_overrides: {
        Row: {
          capacity_override: number | null
          created_at: string
          date: string
          id: number
          is_closed: boolean
          reason: string | null
          ticket_id: number
          time_slot: string | null
          updated_at: string
        }
        Insert: {
          capacity_override?: number | null
          created_at?: string
          date: string
          id?: number
          is_closed?: boolean
          reason?: string | null
          ticket_id: number
          time_slot?: string | null
          updated_at?: string
        }
        Update: {
          capacity_override?: number | null
          created_at?: string
          date?: string
          id?: number
          is_closed?: boolean
          reason?: string | null
          ticket_id?: number
          time_slot?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_availability_overrides_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_booking_settings: {
        Row: {
          auto_generate_days_ahead: number
          booking_window_days: number
          created_at: string
          default_slot_capacity: number
          max_tickets_per_booking: number
          ticket_id: number
          updated_at: string
        }
        Insert: {
          auto_generate_days_ahead?: number
          booking_window_days?: number
          created_at?: string
          default_slot_capacity?: number
          max_tickets_per_booking?: number
          ticket_id: number
          updated_at?: string
        }
        Update: {
          auto_generate_days_ahead?: number
          booking_window_days?: number
          created_at?: string
          default_slot_capacity?: number
          max_tickets_per_booking?: number
          ticket_id?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_booking_settings_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: true
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_reviews: {
        Row: {
          comment: string | null
          created_at: string | null
          id: number
          is_anonymous: boolean
          is_approved: boolean
          purchased_ticket_id: number | null
          rating: number
          reviewed_at: string
          ticket_id: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          id?: number
          is_anonymous?: boolean
          is_approved?: boolean
          purchased_ticket_id?: number | null
          rating: number
          reviewed_at?: string
          ticket_id: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          id?: number
          is_anonymous?: boolean
          is_approved?: boolean
          purchased_ticket_id?: number | null
          rating?: number
          reviewed_at?: string
          ticket_id?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_reviews_purchased_ticket_id_foreign"
            columns: ["purchased_ticket_id"]
            isOneToOne: false
            referencedRelation: "purchased_tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_reviews_ticket_id_foreign"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          available_from: string
          available_until: string
          created_at: string | null
          description: string | null
          id: number
          is_active: boolean
          name: string
          price: number
          slug: string
          time_slots: Json | null
          type: string
          updated_at: string | null
        }
        Insert: {
          available_from: string
          available_until: string
          created_at?: string | null
          description?: string | null
          id?: number
          is_active?: boolean
          name: string
          price: number
          slug: string
          time_slots?: Json | null
          type: string
          updated_at?: string | null
        }
        Update: {
          available_from?: string
          available_until?: string
          created_at?: string | null
          description?: string | null
          id?: number
          is_active?: boolean
          name?: string
          price?: number
          slug?: string
          time_slots?: Json | null
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      user_addresses: {
        Row: {
          address_line: string
          city: string
          city_id: number
          created_at: string | null
          district: string
          district_id: number
          id: number
          name: string
          phone_number: string
          postal_code: string | null
          province: string
          province_id: number
          sub_district: string | null
          sub_district_id: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          address_line: string
          city: string
          city_id: number
          created_at?: string | null
          district: string
          district_id: number
          id?: number
          name: string
          phone_number: string
          postal_code?: string | null
          province: string
          province_id: number
          sub_district?: string | null
          sub_district_id?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          address_line?: string
          city?: string
          city_id?: number
          created_at?: string | null
          district?: string
          district_id?: number
          id?: number
          name?: string
          phone_number?: string
          postal_code?: string | null
          province?: string
          province_id?: number
          sub_district?: string | null
          sub_district_id?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_id_mapping: {
        Row: {
          created_at: string | null
          email: string
          new_id: string
          old_id: number
        }
        Insert: {
          created_at?: string | null
          email: string
          new_id: string
          old_id: number
        }
        Update: {
          created_at?: string | null
          email?: string
          new_id?: string
          old_id?: number
        }
        Relationships: []
      }
      user_role_assignments: {
        Row: {
          created_at: string
          role_name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          role_name: string
          user_id: string
        }
        Update: {
          created_at?: string
          role_name?: string
          user_id?: string
        }
        Relationships: []
      }
      voucher_usage: {
        Row: {
          discount_amount: number
          id: string
          order_product_id: number
          used_at: string
          user_id: string
          voucher_id: string
        }
        Insert: {
          discount_amount: number
          id?: string
          order_product_id: number
          used_at?: string
          user_id: string
          voucher_id: string
        }
        Update: {
          discount_amount?: number
          id?: string
          order_product_id?: number
          used_at?: string
          user_id?: string
          voucher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "voucher_usage_order_product_id_fkey"
            columns: ["order_product_id"]
            isOneToOne: true
            referencedRelation: "order_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voucher_usage_voucher_id_fkey"
            columns: ["voucher_id"]
            isOneToOne: false
            referencedRelation: "vouchers"
            referencedColumns: ["id"]
          },
        ]
      }
      vouchers: {
        Row: {
          applicable_categories: number[] | null
          code: string
          created_at: string
          discount_type: string
          discount_value: number
          id: string
          is_active: boolean
          max_discount: number | null
          min_purchase: number | null
          quota: number
          updated_at: string
          used_count: number
          valid_from: string
          valid_until: string
        }
        Insert: {
          applicable_categories?: number[] | null
          code: string
          created_at?: string
          discount_type: string
          discount_value: number
          id?: string
          is_active?: boolean
          max_discount?: number | null
          min_purchase?: number | null
          quota: number
          updated_at?: string
          used_count?: number
          valid_from: string
          valid_until: string
        }
        Update: {
          applicable_categories?: number[] | null
          code?: string
          created_at?: string
          discount_type?: string
          discount_value?: number
          id?: string
          is_active?: boolean
          max_discount?: number | null
          min_purchase?: number | null
          quota?: number
          updated_at?: string
          used_count?: number
          valid_from?: string
          valid_until?: string
        }
        Relationships: []
      }
      webhook_logs: {
        Row: {
          error_message: string | null
          event_type: string | null
          id: number
          order_number: string | null
          payload: Json | null
          payment_gateway: string | null
          processed_at: string | null
          success: boolean | null
        }
        Insert: {
          error_message?: string | null
          event_type?: string | null
          id?: number
          order_number?: string | null
          payload?: Json | null
          payment_gateway?: string | null
          processed_at?: string | null
          success?: boolean | null
        }
        Update: {
          error_message?: string | null
          event_type?: string | null
          id?: number
          order_number?: string | null
          payload?: Json | null
          payment_gateway?: string | null
          processed_at?: string | null
          success?: boolean | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cancel_product_order_atomic: {
        Args: { p_order_number: string; p_user_id: string }
        Returns: Json
      }
      claim_payment_effect_run: {
        Args: {
          p_effect_key?: string
          p_effect_scope: string
          p_effect_type: string
          p_order_ref: string
          p_stale_after_seconds?: number
        }
        Returns: {
          claimed: boolean
          status: string
        }[]
      }
      cleanup_zombie_variants: { Args: never; Returns: number }
      complete_cashier_product_pickup_atomic: {
        Args: { p_picked_up_by: string; p_pickup_code: string }
        Returns: Json
      }
      complete_payment_effect_run: {
        Args: {
          p_effect_key?: string
          p_effect_scope: string
          p_effect_type: string
          p_metadata?: Json
          p_order_ref: string
        }
        Returns: boolean
      }
      complete_product_pickup_atomic: {
        Args: { p_picked_up_by: string; p_pickup_code: string }
        Returns: Json
      }
      delete_inventory_product: {
        Args: { p_deleted_at?: string; p_product_id: number }
        Returns: Json
      }
      ensure_all_ticket_availability_coverage: { Args: never; Returns: number }
      ensure_ticket_availability_coverage: {
        Args: {
          p_days_ahead?: number
          p_ticket_id?: number
          p_total_capacity?: number
        }
        Returns: number
      }
      expire_product_order_atomic: {
        Args: { p_now?: string; p_order_id: number }
        Returns: Json
      }
      fail_payment_effect_run: {
        Args: {
          p_effect_key?: string
          p_effect_scope: string
          p_effect_type: string
          p_error?: string
          p_metadata?: Json
          p_order_ref: string
        }
        Returns: boolean
      }
      finalize_ticket_capacity: {
        Args: {
          p_date: string
          p_quantity: number
          p_ticket_id: number
          p_time_slot: string
        }
        Returns: boolean
      }
      generate_event_booking_order_number: { Args: never; Returns: string }
      generate_event_booking_ticket_code: { Args: never; Returns: string }
      generate_pickup_code: { Args: never; Returns: string }
      generate_ticket_availability: {
        Args: {
          p_end_date: string
          p_start_date: string
          p_ticket_id?: number
          p_total_capacity?: number
        }
        Returns: number
      }
      get_stage_analytics_summary: {
        Args: { p_time_filter?: string }
        Returns: {
          period_scans: number
          prev_period_scans: number
          stage_code: string
          stage_id: number
          stage_name: string
          stage_zone: string
          total_scans: number
        }[]
      }
      get_stage_scan_stats: {
        Args: never
        Returns: {
          stage_code: string
          stage_id: number
          stage_name: string
          today_scans: number
          total_scans: number
        }[]
      }
      is_admin: { Args: never; Returns: boolean }
      list_effective_ticket_availabilities: {
        Args: {
          p_end_date?: string
          p_start_date?: string
          p_ticket_id: number
        }
        Returns: {
          available_capacity: number
          base_total_capacity: number
          date: string
          effective_total_capacity: number
          id: number
          is_closed: boolean
          reason: string
          reserved_capacity: number
          sold_capacity: number
          ticket_id: number
          time_slot: string
        }[]
      }
      list_inventory_product_page: {
        Args: {
          p_category_slug?: string
          p_page?: number
          p_page_size?: number
          p_search_query?: string
          p_stock_filter?: string
        }
        Returns: {
          product_id: number
          total_count: number
        }[]
      }
      list_ticket_time_slots: {
        Args: { p_ticket_id: number }
        Returns: {
          time_slot: string
        }[]
      }
      regenerate_ticket_availability: {
        Args: {
          p_end_date: string
          p_start_date: string
          p_ticket_id?: number
          p_total_capacity?: number
        }
        Returns: Json
      }
      release_product_stock: {
        Args: { p_quantity: number; p_variant_id: number }
        Returns: boolean
      }
      release_ticket_capacity: {
        Args: {
          p_date: string
          p_quantity: number
          p_ticket_id: number
          p_time_slot: string
        }
        Returns: boolean
      }
      release_voucher_quota: {
        Args: { p_voucher_id: string }
        Returns: boolean
      }
      reserve_product_stock: {
        Args: { p_quantity: number; p_variant_id: number }
        Returns: boolean
      }
      reserve_ticket_capacity: {
        Args: {
          p_date: string
          p_quantity: number
          p_ticket_id: number
          p_time_slot: string
        }
        Returns: boolean
      }
      save_entrance_booking_config: {
        Args: {
          p_auto_generate_days_ahead: number
          p_available_from: string
          p_available_until: string
          p_booking_window_days: number
          p_default_slot_capacity: number
          p_is_active: boolean
          p_max_tickets_per_booking: number
          p_price: number
          p_ticket_id: number
          p_time_slots: Json
        }
        Returns: Json
      }
      save_inventory_product: {
        Args: {
          p_category_id?: number
          p_description?: string
          p_is_active: boolean
          p_name: string
          p_new_images?: Json
          p_product_id?: number
          p_removed_image_urls?: string[]
          p_sku: string
          p_slug: string
          p_sync_variants?: boolean
          p_variants?: Json
        }
        Returns: Json
      }
      soft_delete_product_cascade: {
        Args: { p_deleted_at?: string; p_product_id: number }
        Returns: undefined
      }
      validate_and_reserve_voucher: {
        Args: {
          p_category_ids: number[]
          p_code: string
          p_subtotal: number
          p_user_id: string
        }
        Returns: {
          discount_amount: number
          discount_type: string
          discount_value: number
          error_message: string
          voucher_id: string
        }[]
      }
      validate_entrance_ticket_scan: {
        Args: { p_ticket_code: string }
        Returns: Json
      }
      validate_voucher: {
        Args: { p_category_ids: number[]; p_code: string; p_subtotal: number }
        Returns: {
          applicable_category_names: string[]
          discount_amount: number
          discount_type: string
          discount_value: number
          error_code: string
          error_message: string
          voucher_id: string
        }[]
      }
    }
    Enums: {
      event_booking_status: "pending" | "approved" | "rejected"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      event_booking_status: ["pending", "approved", "rejected"],
    },
  },
} as const
