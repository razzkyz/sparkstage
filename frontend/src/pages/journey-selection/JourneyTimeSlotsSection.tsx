import { motion } from 'framer-motion';
import type { BookingPageSettings } from "../../hooks/useBookingPageSettings";
import type { GroupedTimeSlots } from "./journeySelectionTypes";

type JourneyTimeSlotsSectionProps = {
  copy: Pick<
    BookingPageSettings,
    | "time_slots_title"
    | "empty_slots_message"
    | "access_type_title"
    | "all_day_access_label"
    | "all_day_access_helper"
    | "choose_specific_time_label"
  >;
  selectedDate: Date | null;
  hasBookableDates: boolean;
  isAllDayTicket: boolean;
  selectedTime: string | null;
  availableSlotsCount: number;
  groupedSlots: GroupedTimeSlots;
  onSelectTime: (time: string | null) => void;
  getMinutesUntilClose: (timeSlot: string) => number | null;
  getSlotUrgency: (timeSlot: string) => "none" | "low" | "medium" | "high";
};

// One button per session group — label shown to user
const SESSION_CONFIG: Record<string, { label: string }> = {
  morning: { label: "09:00 – 11:30" },
  afternoon1: { label: "12:00 – 14:30" },
  afternoon2: { label: "15:00 – 17:30" },
  evening: { label: "18:00 – 20:30" },
};

const SESSION_LABEL_ID: Record<string, string> = {
  morning: "Sesi Pagi",
  afternoon1: "Sesi Siang",
  afternoon2: "Sesi Sore",
  evening: "Sesi Malam",
};

const containerVars = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVars = {
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0 }
};

export function JourneyTimeSlotsSection({
  copy,
  selectedDate,
  hasBookableDates,
  isAllDayTicket,
  selectedTime,
  availableSlotsCount,
  groupedSlots,
  onSelectTime,
  getMinutesUntilClose,
  getSlotUrgency,
}: JourneyTimeSlotsSectionProps) {


  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-white rounded-2xl p-5 md:p-8 border border-pink-100 shadow-[0_4px_25px_rgba(236,72,153,0.06)]"
    >
      <h3 className="text-xl md:text-2xl font-black mb-4 md:mb-6 text-gray-900">
        {isAllDayTicket ? copy.access_type_title : copy.time_slots_title}
      </h3>

      {!hasBookableDates ? (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900 font-medium">
          Booking is not available right now. New dates have not been published
          yet.
        </motion.p>
      ) : null}

      {hasBookableDates && isAllDayTicket ? (
        <div className="mb-4 md:mb-6">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelectTime(null)}
            className={`w-full rounded-xl border-2 px-5 md:px-6 py-4 text-left transition-colors ${
              selectedTime === null
                ? "border-pink-500 bg-pink-50 text-pink-700 shadow-md"
                : "border-gray-200 bg-gray-50 text-gray-800 hover:border-pink-300"
            }`}
          >
            <div className="font-black text-base md:text-lg">
              {copy.all_day_access_label}
            </div>
            <div className="text-sm font-medium opacity-70 mt-1">
              {copy.all_day_access_helper}
            </div>
          </motion.button>
        </div>
      ) : null}

      {hasBookableDates && (availableSlotsCount > 0 || !selectedDate) ? (
        <motion.div variants={containerVars} initial="hidden" animate="show" className="space-y-3 md:space-y-4">
          {isAllDayTicket && selectedDate ? (
            <p className="text-xs md:text-sm font-black uppercase tracking-widest text-pink-500/80 mb-4">
              {copy.choose_specific_time_label}
            </p>
          ) : null}

          {(
            Object.entries(groupedSlots) as Array<
              [keyof GroupedTimeSlots, GroupedTimeSlots[keyof GroupedTimeSlots]]
            >
          ).map(([period, slots]) => {
            const hasNoDate = !selectedDate;
            if (period === "evening" && hasNoDate) return null;
            if (!hasNoDate && slots.length === 0) return null;

            const cfg = SESSION_CONFIG[period as string];
            const sessionLabel = cfg?.label ?? (period as string);
            const periodLabel =
              SESSION_LABEL_ID[period as string] ?? (period as string);

            let isPast = false;
            let isSelected = false;
            let representativeTime: string | null = null;
            let _urgency = "none";
            let _minutesLeft = null;

            if (hasNoDate) {
              isPast = true;
            } else {
              const firstAvailable = slots.find((s) => !s.isPast) ?? slots[0];
              representativeTime = firstAvailable?.time || null;
              isSelected = slots.some((s) => s.time === selectedTime);
              isPast = slots.length > 0 && slots.every((s) => s.isPast);
              _urgency = isPast || !representativeTime
                ? "none"
                : getSlotUrgency(representativeTime);
              _minutesLeft = isPast || !representativeTime
                ? null
                : getMinutesUntilClose(representativeTime);
            }
            
            void _urgency;
            void _minutesLeft;

            return (
              <motion.button
                variants={itemVars}
                whileHover={!isPast && !isSelected ? { scale: 1.02, y: -2 } : {}}
                whileTap={!isPast ? { scale: 0.98 } : {}}
                key={period as string}
                onClick={() => representativeTime && !isPast && onSelectTime(representativeTime)}
                disabled={isPast}
                className={`w-full rounded-xl border-2 px-5 md:px-6 py-4 md:py-5 text-left transition-all ${
                  isPast
                    ? "opacity-50 cursor-not-allowed bg-gray-50 border-gray-100"
                    : isSelected
                      ? "border-transparent bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-[0_8px_20px_rgba(236,72,153,0.3)]"
                      : "border-gray-200 bg-white hover:border-pink-300 hover:bg-pink-50/50 hover:shadow-lg"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-xs font-black uppercase tracking-widest mb-1 ${isSelected ? 'text-pink-100' : 'text-gray-400'}`}>
                      {periodLabel}
                    </p>
                    <p
                      className={`text-lg md:text-xl font-black ${
                        isSelected ? "text-white" : "text-gray-800"
                      } ${isPast ? "line-through text-gray-400" : ""}`}
                    >
                      {sessionLabel}
                    </p>
                  </div>

                  <div className="text-right flex flex-col items-end gap-1">
                    {hasNoDate ? (
                      <span className="text-xs font-bold text-pink-400 bg-pink-50 px-3 py-1 rounded-full border border-pink-100">
                        Pilih Tanggal 👆
                      </span>
                    ) : isPast ? (
                      <span className="text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                        Berakhir
                      </span>
                    ) : null}
                  </div>
                </div>
              </motion.button>
            );
          })}
        </motion.div>
      ) : hasBookableDates && !isAllDayTicket ? (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-gray-500 font-medium text-center py-6 md:py-8 text-sm bg-gray-50 rounded-xl border border-dashed border-gray-300">
          {copy.empty_slots_message}
        </motion.p>
      ) : null}
    </motion.div>
  );
}
