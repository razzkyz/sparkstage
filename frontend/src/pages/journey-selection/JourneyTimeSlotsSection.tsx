import type { BookingPageSettings } from '../../hooks/useBookingPageSettings';
import type { GroupedTimeSlots } from './journeySelectionTypes';

type JourneyTimeSlotsSectionProps = {
  copy: Pick<
    BookingPageSettings,
    | 'time_slots_title'
    | 'empty_slots_message'
    | 'access_type_title'
    | 'all_day_access_label'
    | 'all_day_access_helper'
    | 'choose_specific_time_label'
  >;
  selectedDate: Date | null;
  hasBookableDates: boolean;
  isAllDayTicket: boolean;
  selectedTime: string | null;
  availableSlotsCount: number;
  groupedSlots: GroupedTimeSlots;
  onSelectTime: (time: string | null) => void;
  getMinutesUntilClose: (timeSlot: string) => number | null;
  getSlotUrgency: (timeSlot: string) => 'none' | 'low' | 'medium' | 'high';
};

const PERIOD_NAMES: Record<string, string> = {
  morning: 'MORNING (09:00 - 11:30)',
  afternoon1: 'AFTERNOON EARLY (12:00 - 14:30)',
  afternoon2: 'AFTERNOON LATE (15:00 - 17:30)',
  evening: 'EVENING (18:00 - 20:30)',
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
  if (!selectedDate && hasBookableDates) return null;

  return (
    <div className="bg-gray-50 rounded-xl p-4 md:p-8 border border-gray-200">
      <h3 className="text-lg md:text-xl font-bold mb-4 md:mb-6">{isAllDayTicket ? copy.access_type_title : copy.time_slots_title}</h3>

      {!hasBookableDates ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-4 text-xs md:text-sm text-amber-900">
          Booking is not available right now. New dates have not been published yet.
        </p>
      ) : null}

      {hasBookableDates && isAllDayTicket ? (
        <div className="mb-4 md:mb-6">
          <button
            onClick={() => onSelectTime(null)}
            className={`w-full rounded-lg border px-4 md:px-6 py-3 md:py-4 text-left transition-colors ${
              selectedTime === null ? 'border-main-600 bg-main-50 text-main-700' : 'border-gray-300 bg-white text-gray-800'
            }`}
          >
            <div className="font-bold text-sm md:text-base">{copy.all_day_access_label}</div>
            <div className="text-xs md:text-xs opacity-70">{copy.all_day_access_helper}</div>
          </button>
        </div>
      ) : null}

      {hasBookableDates && availableSlotsCount > 0 ? (
        <div className="space-y-4 md:space-y-6">
          {isAllDayTicket ? (
            <p className="text-xs md:text-xs font-black uppercase tracking-widest text-main-600/70">
              {copy.choose_specific_time_label}
            </p>
          ) : null}
          {(Object.entries(groupedSlots) as Array<[keyof GroupedTimeSlots, GroupedTimeSlots[keyof GroupedTimeSlots]]>).map(([period, slots]) => {
            if (slots.length === 0) return null;

            return (
              <div key={period}>
                <div className="mb-3 md:mb-4">
                  <p className="text-xs md:text-xs font-bold uppercase tracking-widest text-gray-400">
                    {PERIOD_NAMES[period] || period}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 md:gap-3">
                  {slots.map((slot) => {
                    const isSelected = slot.time === selectedTime;
                    const urgency = slot.isPast ? 'none' : getSlotUrgency(slot.time);
                    const minutesLeft = slot.isPast ? null : getMinutesUntilClose(slot.time);

                    return (
                      <div key={slot.time} className="relative">
                        <button
                          onClick={() => !slot.isPast && onSelectTime(slot.time)}
                          disabled={slot.isPast}
                          className={`px-4 md:px-6 py-2 md:py-3 rounded-lg text-xs md:text-sm font-medium transition-all relative
                            ${slot.isPast
                              ? 'opacity-40 cursor-not-allowed bg-gray-200 border border-gray-300 line-through'
                              : isSelected
                                ? 'bg-main-600 text-white font-bold shadow-lg'
                                : 'border border-gray-300 hover:border-main-600'
                            }
                          `}
                        >
                          {slot.time.substring(0, 5)}
                          <span className="text-xs md:text-xs ml-1 md:ml-2 opacity-60">
                            {slot.isPast ? '(Ended)' : `(${slot.available} left)`}
                          </span>

                          {!slot.isPast && minutesLeft !== null && (
                            <span className="hidden md:block absolute -top-2 -right-2 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase
                              ${urgency === 'high' ? 'bg-red-500 text-white animate-pulse' : ''}
                              ${urgency === 'medium' ? 'bg-orange-500 text-white' : ''}
                              ${urgency === 'low' ? 'bg-yellow-500 text-black' : ''}
                              ${urgency === 'none' ? 'bg-green-500 text-white' : ''}
                            ">
                              {Math.floor(minutesLeft / 60)}:{(minutesLeft % 60).toString().padStart(2, '0')}
                            </span>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : hasBookableDates && !isAllDayTicket ? (
        <p className="text-gray-500 text-center py-6 md:py-8 text-xs md:text-sm">{copy.empty_slots_message}</p>
      ) : null}
    </div>
  );
}
