import type { BookingPageSettings } from '../../hooks/useBookingPageSettings';
import { formatCurrency } from '../../utils/formatters';
import type { TicketData } from '../../types';
import { motion } from 'framer-motion';

type JourneySummaryCardProps = {
  copy: Pick<
    BookingPageSettings,
    | 'booking_summary_title'
    | 'ticket_type_label'
    | 'date_label'
    | 'time_label'
    | 'not_selected_label'
    | 'all_day_access_value_label'
    | 'ticket_price_label'
    | 'vat_included_label'
    | 'total_label'
    | 'proceed_button_label'
    | 'secure_checkout_label'
    | 'important_info_title'
    | 'important_info_items'
  >;
  ticket: TicketData;
  selectedDate: Date | null;
  selectedTime: string | null;
  isAllDayTicket: boolean;
  onProceed: () => void;
};

export function JourneySummaryCard({
  copy,
  ticket,
  selectedDate,
  selectedTime,
  isAllDayTicket,
  onProceed,
}: JourneySummaryCardProps) {
  const price = Number.parseFloat(ticket.price);
  const total = price;

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 20 }}
      className="bg-white rounded-2xl shadow-[0_15px_40px_rgba(236,72,153,0.12)] border border-pink-100 p-6 md:p-8 lg:sticky lg:top-28"
    >
      <h3 className="text-xl md:text-2xl font-black mb-6 md:mb-8 italic text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-rose-500 uppercase tracking-wide">{copy.booking_summary_title}</h3>

      <div className="space-y-5 md:space-y-6 mb-6 md:mb-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-pink-50 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-pink-500 text-xl">confirmation_number</span>
          </div>
          <div className="flex-1 pt-1">
            <p className="text-[10px] md:text-xs font-black uppercase tracking-widest text-gray-400 mb-0.5">{copy.ticket_type_label}</p>
            <p className="font-bold text-sm md:text-base text-gray-900">{ticket.name}</p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="flex items-start gap-4">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${selectedDate ? 'bg-pink-50 text-pink-500' : 'bg-gray-50 text-gray-400'}`}>
            <span className="material-symbols-outlined text-xl">event</span>
          </div>
          <div className="flex-1 pt-1">
            <p className="text-[10px] md:text-xs font-black uppercase tracking-widest text-gray-400 mb-0.5">{copy.date_label}</p>
            <p className={`font-bold text-sm md:text-base ${selectedDate ? 'text-gray-900' : 'text-gray-400 italic'}`}>
              {selectedDate
                ? selectedDate.toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : copy.not_selected_label}
            </p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="flex items-start gap-4">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${(selectedTime || isAllDayTicket) ? 'bg-pink-50 text-pink-500' : 'bg-gray-50 text-gray-400'}`}>
            <span className="material-symbols-outlined text-xl">schedule</span>
          </div>
          <div className="flex-1 pt-1">
            <p className="text-[10px] md:text-xs font-black uppercase tracking-widest text-gray-400 mb-0.5">{copy.time_label}</p>
            <p className={`font-bold text-sm md:text-base ${(selectedTime || isAllDayTicket) ? 'text-gray-900' : 'text-gray-400 italic'}`}>
              {selectedTime ? selectedTime.substring(0, 5) : isAllDayTicket ? copy.all_day_access_value_label : copy.not_selected_label}
            </p>
          </div>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="border-t-2 border-dashed border-gray-200 pt-5 md:pt-6 mb-5 md:mb-6 space-y-3 md:space-y-4">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-500 font-medium text-xs md:text-sm">
            {copy.ticket_price_label} <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded-full ml-1">{copy.vat_included_label}</span>
          </span>
          <span className="font-bold text-sm md:text-base text-gray-700">{formatCurrency(price)}</span>
        </div>
        <div className="flex justify-between items-end pt-3">
          <span className="text-base md:text-lg font-black uppercase tracking-widest text-gray-900">{copy.total_label}</span>
          <span className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-rose-500">{formatCurrency(total)}</span>
        </div>
      </motion.div>

      <motion.button
        whileHover={selectedDate && (selectedTime || isAllDayTicket) ? { scale: 1.02, boxShadow: "0 10px 25px rgba(236,72,153,0.3)" } : {}}
        whileTap={selectedDate && (selectedTime || isAllDayTicket) ? { scale: 0.98 } : {}}
        onClick={onProceed}
        disabled={!selectedDate || (!selectedTime && !isAllDayTicket)}
        className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 disabled:from-gray-300 disabled:to-gray-300 disabled:shadow-none disabled:cursor-not-allowed text-white font-black uppercase tracking-widest py-4 md:py-5 rounded-xl transition-all shadow-[0_8px_20px_rgba(236,72,153,0.25)] text-sm md:text-base overflow-hidden relative group"
      >
        <span className="relative z-10">{copy.proceed_button_label}</span>
        {/* Button shine effect */}
        {selectedDate && (selectedTime || isAllDayTicket) && (
          <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent group-hover:animate-[shimmer_1.5s_infinite] skew-x-12" />
        )}
      </motion.button>

      <p className="text-center font-medium text-[10px] md:text-xs text-gray-400 mt-4 md:mt-5 uppercase tracking-widest flex items-center justify-center gap-1.5">
        <span className="material-symbols-outlined text-[14px]">lock</span>
        {copy.secure_checkout_label}
      </p>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="mt-6 md:mt-8 pt-5 md:pt-6 border-t border-gray-100 bg-red-50/50 -mx-6 md:-mx-8 px-6 md:px-8 pb-2 rounded-b-2xl">
        <motion.p 
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="text-[10px] md:text-xs font-black uppercase tracking-widest text-red-500 flex items-center gap-1.5 mb-3 md:mb-4"
        >
          <span className="material-symbols-outlined text-[14px]">warning</span>
          {copy.important_info_title}
        </motion.p>
        <ul className="space-y-2.5 text-[11px] md:text-sm text-gray-600 font-medium">
          {copy.important_info_items.map((item, index) => (
            <li
              key={`${item}-${index}`}
              className={`flex items-start gap-2.5 ${index === copy.important_info_items.length - 1 ? 'text-red-600 font-bold' : ''}`}
            >
              <span className={`shrink-0 w-1.5 h-1.5 rounded-full mt-1.5 ${index === copy.important_info_items.length - 1 ? 'bg-red-500' : 'bg-gray-300'}`} />
              <span className="leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      </motion.div>
    </motion.div>
  );
}
