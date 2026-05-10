import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toLocalDateString } from '../utils/timezone';
import { DEFAULT_BOOKING_PAGE_SETTINGS, useBookingPageSettings } from '../hooks/useBookingPageSettings';
import { JourneyCalendarSection } from './journey-selection/JourneyCalendarSection';
import { JourneySummaryCard } from './journey-selection/JourneySummaryCard';
import { JourneyTimeSlotsSection } from './journey-selection/JourneyTimeSlotsSection';
import { useJourneySelectionController } from './journey-selection/useJourneySelectionController';
import { AppLoadingScreen } from '../app/AppLoadingScreen';
import { useBanners } from '../hooks/useBanners';
import { VenueReviews } from '../components/VenueReviews';
import { useToast } from '../components/Toast';

const Booking = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { settings: bookingSettings } = useBookingPageSettings();
  const bookingCopy = bookingSettings ?? DEFAULT_BOOKING_PAGE_SETTINGS;
  const { showToast } = useToast();

  const {
    ticket,
    loading: journeyLoading,
    error: journeyError,
    selectedDate,
    selectedTime,
    calendarDays,
    availableTimeSlots,
    groupedSlots,
    hasBookableDates,
    isAllDayTicket,
    canGoPrevMonth,
    canGoNextMonth,
    monthName,
    setSelectedDate,
    setSelectedTime,
    handlePrevMonth,
    handleNextMonth,
    getMinutesUntilClose,
    getSlotUrgency,
  } = useJourneySelectionController();

  const { data: sparkMapBanners = [], isLoading: sparkMapLoading } = useBanners('spark-map');
  const sparkMap = sparkMapBanners[0];

  const handleProceedToPayment = () => {
    if (!ticket || !selectedDate) {
      showToast('pink', 'Silakan pilih tanggal terlebih dahulu');
      return;
    }
    const isAllDay = isAllDayTicket && !selectedTime;
    if (!isAllDay && !selectedTime) {
      showToast('pink', 'Silakan pilih sesi terlebih dahulu');
      return;
    }
    if (!user) {
      showToast('pink', 'Silakan login terlebih dahulu');
      navigate('/login', { state: { returnTo: '/booking' } });
      return;
    }
    navigate('/payment', {
      state: {
        ticketId: ticket.id,
        ticketName: ticket.name,
        ticketType: ticket.type,
        price: parseFloat(ticket.price),
        date: toLocalDateString(selectedDate),
        time: selectedTime || 'all-day',
      },
    });
  };

  if (journeyLoading) {
    return <AppLoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Header */}
      <section className="py-12 px-6 md:px-12 lg:px-20 border-b border-gray-200">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-black leading-tight tracking-tight mb-4 text-gray-900">{bookingCopy.journey_title}</h1>
          <p className="text-gray-600 text-lg md:text-xl max-w-2xl">{bookingCopy.journey_description}</p>
        </div>
      </section>

      {/* Booking Section */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
            {/* Left Column: Calendar & Time Slots */}
            <div className="lg:col-span-2 flex flex-col gap-8 md:gap-10">
              {journeyError || !ticket ? (
                <div className="rounded-2xl border-2 border-amber-300 bg-gradient-to-r from-amber-50 to-yellow-50 px-8 py-12 text-center text-amber-900 shadow-md">
                  <div className="text-4xl mb-4">⚠️</div>
                  <p className="text-lg font-medium">
                    {journeyError?.message || 'Entrance booking is unavailable right now.'}
                  </p>
                </div>
              ) : (
                <>
                  <JourneyCalendarSection
                    monthName={monthName}
                    canGoPrevMonth={canGoPrevMonth}
                    canGoNextMonth={canGoNextMonth}
                    calendarDays={calendarDays}
                    selectedDate={selectedDate}
                    onPrevMonth={handlePrevMonth}
                    onNextMonth={handleNextMonth}
                    onSelectDate={(date) => {
                      setSelectedDate(date);
                      setSelectedTime(null);
                    }}
                  />

                  <JourneyTimeSlotsSection
                    copy={bookingCopy}
                    selectedDate={selectedDate}
                    hasBookableDates={hasBookableDates}
                    isAllDayTicket={isAllDayTicket}
                    selectedTime={selectedTime}
                    availableSlotsCount={availableTimeSlots.length}
                    groupedSlots={groupedSlots}
                    onSelectTime={setSelectedTime}
                    getMinutesUntilClose={getMinutesUntilClose}
                    getSlotUrgency={getSlotUrgency}
                  />
                </>
              )}
            </div>

            {/* Right Column: Spark Map + Booking Summary */}
            <div className="flex flex-col gap-6">
              {/* Spark Map */}
              {sparkMapLoading ? (
                <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl shadow-lg border border-gray-200 p-6 lg:p-8 flex items-center justify-center min-h-[400px]">
                  <div className="animate-spin rounded-full h-10 w-10 border-4 border-main-200 border-t-main-600" />
                </div>
              ) : sparkMap ? (
                <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 lg:p-8 group hover:shadow-2xl transition-all duration-300">
                  <h3 className="text-2xl md:text-3xl font-black mb-6 italic text-gray-900">{sparkMap.title || 'Spark Map'}</h3>
                  <div className="relative overflow-hidden rounded-xl bg-gradient-to-b from-gray-100 to-gray-200">
                    {sparkMap.image_url?.match(/\.(mp4|webm|ogg)(\?.*)?$/i) ? (
                      <video
                        src={sparkMap.image_url}
                        className="w-full rounded-lg object-contain transition-transform duration-500 group-hover:scale-110"
                        autoPlay
                        loop
                        muted
                        playsInline
                      />
                    ) : (
                      <img
                        src={sparkMap.image_url}
                        alt={sparkMap.title || 'Spark Stage 55 Map'}
                        className="w-full rounded-lg object-contain transition-transform duration-500 group-hover:scale-110"
                      />
                    )}
                  </div>
                </div>
              ) : null}

              {/* Booking Summary */}
              {ticket && (
                <JourneySummaryCard
                  copy={bookingCopy}
                  ticket={ticket}
                  selectedDate={selectedDate}
                  selectedTime={selectedTime}
                  isAllDayTicket={isAllDayTicket}
                  onProceed={handleProceedToPayment}
                />
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Venue Reviews Section */}
      <section className="bg-gradient-to-b from-white to-gray-50 py-16 md:py-24">
        <VenueReviews />
      </section>
    </div>
  );
};

export default Booking;
