import { motion } from 'framer-motion';
import type { CalendarDay } from './journeySelectionTypes';

type JourneyCalendarSectionProps = {
  monthName: string;
  canGoPrevMonth: boolean;
  canGoNextMonth: boolean;
  calendarDays: Array<CalendarDay | null>;
  selectedDate: Date | null;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onSelectDate: (date: Date) => void;
};

const containerVars = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.02 }
  }
};

const itemVars = {
  hidden: { opacity: 0, scale: 0.8 },
  show: { opacity: 1, scale: 1 }
};

export function JourneyCalendarSection({
  monthName,
  canGoPrevMonth,
  canGoNextMonth,
  calendarDays,
  selectedDate,
  onPrevMonth,
  onNextMonth,
  onSelectDate,
}: JourneyCalendarSectionProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl p-5 md:p-8 border border-pink-100 shadow-[0_4px_25px_rgba(236,72,153,0.06)]"
    >
      <div className="flex items-center justify-between mb-4 md:mb-8">
        <h3 className="text-lg md:text-xl font-bold uppercase tracking-wider text-gray-400">{monthName}</h3>
        <div className="flex items-center gap-2 md:gap-3">
          <motion.button
            whileHover={canGoPrevMonth ? { scale: 1.1 } : {}}
            whileTap={canGoPrevMonth ? { scale: 0.9 } : {}}
            onClick={onPrevMonth}
            disabled={!canGoPrevMonth}
            className="p-2 rounded-lg bg-gray-50 hover:bg-pink-50 text-gray-700 hover:text-pink-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="Previous month"
          >
            <span className="material-symbols-outlined text-xl md:text-2xl">chevron_left</span>
          </motion.button>
          <motion.button
            whileHover={canGoNextMonth ? { scale: 1.1 } : {}}
            whileTap={canGoNextMonth ? { scale: 0.9 } : {}}
            onClick={onNextMonth}
            disabled={!canGoNextMonth}
            className="p-2 rounded-lg bg-gray-50 hover:bg-pink-50 text-gray-700 hover:text-pink-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="Next month"
          >
            <span className="material-symbols-outlined text-xl md:text-2xl">chevron_right</span>
          </motion.button>
        </div>
      </div>

      <motion.div variants={containerVars} initial="hidden" animate="show" className="grid grid-cols-7 gap-2 md:gap-3">
        {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map((day) => (
          <div key={day} className="text-pink-400/80 text-[10px] md:text-xs font-black uppercase tracking-widest flex h-8 md:h-10 items-center justify-center">
            {day}
          </div>
        ))}

        {calendarDays.map((dayData, index) => {
          if (!dayData) {
            return <div key={`empty-${index}`} className="h-12 md:h-16 w-full"></div>;
          }

          const isSelected = selectedDate?.toDateString() === dayData.date.toDateString();

          return (
            <motion.button
              variants={itemVars}
              whileHover={!dayData.isDisabled && !isSelected ? { scale: 1.05, y: -2 } : {}}
              whileTap={!dayData.isDisabled ? { scale: 0.95 } : {}}
              key={dayData.day}
              onClick={() => {
                if (!dayData.isDisabled) onSelectDate(dayData.date);
              }}
              disabled={dayData.isDisabled}
              className={`h-12 md:h-16 w-full text-lg md:text-2xl font-bold rounded-xl flex items-center justify-center transition-all border-2
                ${isSelected 
                  ? 'bg-gradient-to-br from-pink-500 to-rose-500 border-transparent text-white shadow-[0_8px_20px_rgba(236,72,153,0.4)]' 
                  : dayData.isDisabled 
                    ? 'border-transparent bg-gray-50 text-gray-300 cursor-not-allowed' 
                    : 'border-transparent bg-gray-50 text-gray-700 hover:bg-pink-50 hover:border-pink-200 hover:text-pink-600'
                }
              `}
            >
              {dayData.day}
            </motion.button>
          );
        })}
      </motion.div>
    </motion.div>
  );
}
