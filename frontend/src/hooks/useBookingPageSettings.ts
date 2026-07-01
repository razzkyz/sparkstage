import { useCmsSingletonSettings } from './useCmsSingletonSettings';

export interface BookingPageSettings {
  id: string;
  journey_title: string;
  journey_description: string;
  reserve_title: string;
  reserve_description: string;
  calendar_title: string;
  time_slots_title: string;
  access_type_title: string;
  all_day_access_label: string;
  all_day_access_helper: string;
  choose_specific_time_label: string;
  empty_slots_message: string;
  booking_summary_title: string;
  ticket_type_label: string;
  date_label: string;
  time_label: string;
  not_selected_label: string;
  all_day_access_value_label: string;
  quantity_label: string;
  max_tickets_label_template: string;
  ticket_price_label: string;
  vat_included_label: string;
  total_label: string;
  proceed_button_label: string;
  secure_checkout_label: string;
  important_info_title: string;
  important_info_items: string[];
}

export const DEFAULT_BOOKING_PAGE_SETTINGS: BookingPageSettings = {
  id: 'default-booking-page-settings',
  journey_title: 'Pilih Tanggal Kunjunganmu',
  journey_description: 'Pilih tanggal dan nikmati All Day Experience — bebas masuk kapan saja!',
  reserve_title: 'All Day Experience',
  reserve_description: 'Pilih tanggal kunjunganmu. Tiket berlaku sepanjang hari — datang kapan saja selama jam operasional.',
  calendar_title: 'Pilih Tanggal',
  time_slots_title: 'Pilih Waktu',
  access_type_title: 'Tipe Akses',
  all_day_access_label: 'All Day Experience',
  all_day_access_helper: 'Bebas masuk kapan saja selama jam operasional',
  choose_specific_time_label: 'Atau pilih waktu tertentu',
  empty_slots_message: 'Tidak ada jadwal tersedia untuk tanggal ini',
  booking_summary_title: 'Ringkasan Pesanan',
  ticket_type_label: 'Jenis Tiket',
  date_label: 'Tanggal',
  time_label: 'Akses',
  not_selected_label: 'Belum dipilih',
  all_day_access_value_label: 'All day access',
  quantity_label: 'Berapa Tiket?',
  max_tickets_label_template: 'Maks {count} per pesanan',
  ticket_price_label: 'Harga Tiket',
  vat_included_label: '(Pajak termasuk)',
  total_label: 'Total',
  proceed_button_label: 'Lanjut ke Pembayaran',
  secure_checkout_label: 'Pembayaran Aman & Terenkripsi',
  important_info_title: 'Ketentuan & Keterangan Booking',
  important_info_items: [
    'Tiket berlaku untuk satu orang dan satu hari kunjungan.',
    'Booking hanya berlaku untuk tanggal yang dipilih.',
    'Tiket All Day Experience — bebas masuk kapan saja selama jam operasional.',
    'Durasi pengalaman adalah 2,5 jam untuk explore 15 stage.',
    'Tidak diizinkan membawa makanan atau minuman dari luar.',
    'Semua pembayaran tidak dapat dikembalikan.',
  ],
};

function normalizeString(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() !== '' ? value : fallback;
}

function normalizeStringArray(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) return fallback;

  const parsed = value
    .map((entry) => (typeof entry === 'string' ? entry.trim() : ''))
    .filter(Boolean);

  return parsed.length > 0 ? parsed : fallback;
}

function normalizeSettings(data: Record<string, unknown>): BookingPageSettings {
  return {
    id: normalizeString(data.id, DEFAULT_BOOKING_PAGE_SETTINGS.id),
    journey_title: normalizeString(data.journey_title, DEFAULT_BOOKING_PAGE_SETTINGS.journey_title),
    journey_description: normalizeString(data.journey_description, DEFAULT_BOOKING_PAGE_SETTINGS.journey_description),
    reserve_title: normalizeString(data.reserve_title, DEFAULT_BOOKING_PAGE_SETTINGS.reserve_title),
    reserve_description: normalizeString(data.reserve_description, DEFAULT_BOOKING_PAGE_SETTINGS.reserve_description),
    calendar_title: normalizeString(data.calendar_title, DEFAULT_BOOKING_PAGE_SETTINGS.calendar_title),
    time_slots_title: normalizeString(data.time_slots_title, DEFAULT_BOOKING_PAGE_SETTINGS.time_slots_title),
    access_type_title: normalizeString(data.access_type_title, DEFAULT_BOOKING_PAGE_SETTINGS.access_type_title),
    all_day_access_label: normalizeString(data.all_day_access_label, DEFAULT_BOOKING_PAGE_SETTINGS.all_day_access_label),
    all_day_access_helper: normalizeString(data.all_day_access_helper, DEFAULT_BOOKING_PAGE_SETTINGS.all_day_access_helper),
    choose_specific_time_label: normalizeString(
      data.choose_specific_time_label,
      DEFAULT_BOOKING_PAGE_SETTINGS.choose_specific_time_label
    ),
    empty_slots_message: normalizeString(data.empty_slots_message, DEFAULT_BOOKING_PAGE_SETTINGS.empty_slots_message),
    booking_summary_title: normalizeString(data.booking_summary_title, DEFAULT_BOOKING_PAGE_SETTINGS.booking_summary_title),
    ticket_type_label: normalizeString(data.ticket_type_label, DEFAULT_BOOKING_PAGE_SETTINGS.ticket_type_label),
    date_label: normalizeString(data.date_label, DEFAULT_BOOKING_PAGE_SETTINGS.date_label),
    time_label: normalizeString(data.time_label, DEFAULT_BOOKING_PAGE_SETTINGS.time_label),
    not_selected_label: normalizeString(data.not_selected_label, DEFAULT_BOOKING_PAGE_SETTINGS.not_selected_label),
    all_day_access_value_label: normalizeString(
      data.all_day_access_value_label,
      DEFAULT_BOOKING_PAGE_SETTINGS.all_day_access_value_label
    ),
    quantity_label: normalizeString(data.quantity_label, DEFAULT_BOOKING_PAGE_SETTINGS.quantity_label),
    max_tickets_label_template: normalizeString(
      data.max_tickets_label_template,
      DEFAULT_BOOKING_PAGE_SETTINGS.max_tickets_label_template
    ),
    ticket_price_label: normalizeString(data.ticket_price_label, DEFAULT_BOOKING_PAGE_SETTINGS.ticket_price_label),
    vat_included_label: normalizeString(data.vat_included_label, DEFAULT_BOOKING_PAGE_SETTINGS.vat_included_label),
    total_label: normalizeString(data.total_label, DEFAULT_BOOKING_PAGE_SETTINGS.total_label),
    proceed_button_label: normalizeString(data.proceed_button_label, DEFAULT_BOOKING_PAGE_SETTINGS.proceed_button_label),
    secure_checkout_label: normalizeString(
      data.secure_checkout_label,
      DEFAULT_BOOKING_PAGE_SETTINGS.secure_checkout_label
    ),
    important_info_title: normalizeString(data.important_info_title, DEFAULT_BOOKING_PAGE_SETTINGS.important_info_title),
    important_info_items: normalizeStringArray(data.important_info_items, DEFAULT_BOOKING_PAGE_SETTINGS.important_info_items),
  };
}

export function useBookingPageSettings() {
  return useCmsSingletonSettings<BookingPageSettings>({
    table: 'booking_page_settings',
    defaultId: DEFAULT_BOOKING_PAGE_SETTINGS.id,
    normalize: normalizeSettings,
    errorLabel: 'booking page settings',
  });
}
