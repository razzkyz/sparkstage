import { useState, useMemo, useEffect, useRef } from "react";
import useSeo from "../hooks/useSeo";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { toLocalDateString } from "../utils/timezone";
import {
  DEFAULT_BOOKING_PAGE_SETTINGS,
  useBookingPageSettings,
} from "../hooks/useBookingPageSettings";
import { JourneyCalendarSection } from "./journey-selection/JourneyCalendarSection";
import { JourneySummaryCard } from "./journey-selection/JourneySummaryCard";
// import { JourneyTimeSlotsSection } from "./journey-selection/JourneyTimeSlotsSection";
import { useJourneySelectionController } from "./journey-selection/useJourneySelectionController";
import { AppLoadingScreen } from "../app/AppLoadingScreen";
import { useBanners } from "../hooks/useBanners";
import { VenueReviews } from "../components/VenueReviews";
import { useToast } from "../components/Toast";
import { BookingTermsModal } from "./booking/BookingTermsModal";

const Booking = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { settings: bookingSettings } = useBookingPageSettings();
  const bookingCopy = bookingSettings ?? DEFAULT_BOOKING_PAGE_SETTINGS;
  const { showToast } = useToast();
  const [showTermsModal, setShowTermsModal] = useState(false);

  const {
    ticket,
    loading: journeyLoading,
    error: journeyError,
    selectedDate,
    selectedTime,
    calendarDays,
    isAllDayTicket,
    canGoPrevMonth,
    canGoNextMonth,
    monthName,
    setSelectedDate,
    setSelectedTime,
    handlePrevMonth,
    handleNextMonth,
  } = useJourneySelectionController();

  const { data: sparkMapBanners = [], isLoading: sparkMapLoading } =
    useBanners("spark-map");
  const sparkMap = sparkMapBanners[0];

  useSeo({
    title: "SparkStage Booking · Stage 55",
    description: `Book Stage 55 journeys and experiences with SparkStage Booking. ${bookingCopy.journey_description}`,
    canonical: `${window.location.origin}/booking`,
  });

  const [currentIndex, setCurrentIndex] = useState(1);
  const [isTransitionEnabled, setIsTransitionEnabled] = useState(true);

  const processCarouselRef = useRef<HTMLElement>(null);
  const processTitleRef = useRef<HTMLDivElement>(null);
  const processTouchStartX = useRef<number>(0);
  const processTouchEndX = useRef<number>(0);

  const { data: processBanners = [] } = useBanners("process");

  const activeRealIndex = useMemo(() => {
    if (processBanners.length <= 1) return 0;
    if (currentIndex === 0) return processBanners.length - 1;
    if (currentIndex === processBanners.length + 1) return 0;
    return currentIndex - 1;
  }, [currentIndex, processBanners.length]);

  const slidesToRender = useMemo(() => {
    if (processBanners.length === 0) return [];
    if (processBanners.length === 1) return processBanners;
    return [
      processBanners[processBanners.length - 1],
      ...processBanners,
      processBanners[0],
    ];
  }, [processBanners]);

  const nextSlide = () => {
    if (!isTransitionEnabled) return;
    setCurrentIndex((prev) => prev + 1);
  };

  const prevSlide = () => {
    if (!isTransitionEnabled) return;
    setCurrentIndex((prev) => prev - 1);
  };

  const handleTransitionEnd = () => {
    if (currentIndex === 0) {
      setIsTransitionEnabled(false);
      setCurrentIndex(processBanners.length);
    } else if (currentIndex === processBanners.length + 1) {
      setIsTransitionEnabled(false);
      setCurrentIndex(1);
    }
  };

  useEffect(() => {
    if (!isTransitionEnabled) {
      const raf = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsTransitionEnabled(true);
        });
      });
      return () => cancelAnimationFrame(raf);
    }
  }, [isTransitionEnabled]);

  // Process banner auto-slide timer
  useEffect(() => {
    if (processBanners.length <= 1) return;
    const interval = setInterval(() => {
      setIsTransitionEnabled(true);
      setCurrentIndex((prev) => prev + 1);
    }, 8000);
    return () => clearInterval(interval);
  }, [processBanners.length, activeRealIndex]);

  // Called after terms agreed — does the actual navigation.
  const navigateToPayment = () => {
    if (!ticket || !selectedDate) return;
    navigate("/payment", {
      state: {
        ticketId: ticket.id,
        ticketName: ticket.name,
        ticketType: ticket.type,
        price: parseFloat(ticket.price),
        date: toLocalDateString(selectedDate),
        time: selectedTime || "all-day",
      },
    });
  };

  // Validates selection then opens the terms modal.
  const handleProceedToPayment = () => {
    if (!ticket || !selectedDate) {
      showToast("pink", "Silakan pilih tanggal terlebih dahulu");
      return;
    }
    // Sesi dinonaktifkan
    // const isAllDay = isAllDayTicket && !selectedTime;
    // if (!isAllDay && !selectedTime) {
    //   showToast("pink", "Silakan pilih sesi terlebih dahulu");
    //   return;
    // }
    if (!user) {
      showToast("pink", "Silakan login terlebih dahulu");
      navigate("/login", { state: { returnTo: "/booking" } });
      return;
    }
    // All checks passed — show terms & conditions modal
    setShowTermsModal(true);
  };

  if (journeyLoading) {
    return <AppLoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Banner OnStage Dinonaktikan*/}
      {processBanners.length > 0 && (
        <section
          ref={processCarouselRef}
          className="w-full relative overflow-hidden bg-white mb-16"
        >
          {(processBanners[activeRealIndex]?.title_image_url ||
            processBanners[activeRealIndex]?.title) && (
            <div
              ref={processTitleRef}
              className="flex justify-center mb-8 md:mb-10 h-24 md:h-32 lg:h-40 transition-all duration-500 text-center relative z-20 px-4"
            >
              {processBanners[activeRealIndex]?.title_image_url ? (
                <img
                  src={processBanners[activeRealIndex].title_image_url!}
                  alt={
                    processBanners[activeRealIndex].title ||
                    "Process Title Typography"
                  }
                  className="h-full w-auto object-contain animate-fade-in drop-shadow-lg hover:drop-shadow-xl transition-all"
                />
              ) : (
                <h2 className="text-3xl md:text-5xl lg:text-6xl font-black tracking-tighter text-black self-center animate-fade-in uppercase pt-4">
                  {processBanners[activeRealIndex].title}
                </h2>
              )}
            </div>
          )}

          {/* Carousel Container */}
          <div className="relative w-full lg:px-16 xl:px-24">
            <div
              className="overflow-hidden w-full relative rounded-none"
              onTouchStart={(e) => {
                processTouchStartX.current = e.touches[0].clientX;
              }}
              onTouchMove={(e) => {
                processTouchEndX.current = e.touches[0].clientX;
              }}
              onTouchEnd={() => {
                const swipeThreshold = 50;
                const diff =
                  processTouchStartX.current - processTouchEndX.current;
                if (Math.abs(diff) > swipeThreshold) {
                  if (diff > 0) nextSlide();
                  else prevSlide();
                }
              }}
            >
              <div
                className="flex"
                style={{
                  transform: `translateX(-${currentIndex * 100}%)`,
                  transition: isTransitionEnabled
                    ? "transform 700ms ease-in-out"
                    : "none",
                }}
                onTransitionEnd={handleTransitionEnd}
              >
                {slidesToRender.map((processBanner, idx) => (
                  <div
                    key={`${processBanner.id}-${idx}`}
                    className="w-full shrink-0"
                  >
                    <Link
                      to={processBanner.link_url || "#"}
                      className={`block w-full h-full ${!processBanner.link_url ? "cursor-default pointer-events-none" : ""}`}
                    >
                      {/* Process Image */}
                      <div className="relative w-full bg-gray-100 dark:bg-gray-900 group overflow-hidden">
                        {processBanner.image_url?.match(
                          /\.(mp4|webm|ogg)(\?.*)?$/i,
                        ) ? (
                          <video
                            src={processBanner.image_url}
                            className="w-full h-auto object-contain pointer-events-none transition-transform duration-500 group-hover:scale-105"
                            autoPlay
                            loop
                            muted
                            playsInline
                          />
                        ) : (
                          <img
                            src={processBanner.image_url}
                            alt={processBanner.title || "Process visual"}
                            className="w-full h-auto object-contain pointer-events-none transition-transform duration-500 group-hover:scale-105"
                          />
                        )}
                      </div>

                      {/* Process Subtitle Text */}
                      {processBanner.subtitle && (
                        <div className="p-6 md:p-8 text-center bg-white">
                          <p className="text-black font-bold uppercase tracking-widest md:text-2xl leading-relaxed whitespace-pre-wrap">
                            {processBanner.subtitle}
                          </p>
                        </div>
                      )}
                    </Link>
                  </div>
                ))}
              </div>
            </div>

            {/* Navigation Buttons for Process Carousel */}
            {processBanners.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={prevSlide}
                  className="absolute left-2 md:left-6 top-[40%] -translate-y-1/2 z-10 bg-black/50 hover:bg-gray-800/80 active:bg-black/50 text-white p-3 md:p-4 rounded-full shadow-lg transition-all touch-manipulation hover:scale-110 active:scale-95"
                >
                  <ChevronLeft className="w-6 h-6 md:w-8 md:h-8" />
                </button>
                <button
                  type="button"
                  onClick={nextSlide}
                  className="absolute right-2 md:right-6 top-[40%] -translate-y-1/2 z-10 bg-black/50 hover:bg-gray-800/80 active:bg-black/50 text-white p-3 md:p-4 rounded-full shadow-lg transition-all touch-manipulation hover:scale-110 active:scale-95"
                >
                  <ChevronRight className="w-6 h-6 md:w-8 md:h-8" />
                </button>
              </>
            )}
          </div>

          {/* Process Carousel Indicators */}
          {processBanners.length > 1 && (
            <div className="flex justify-center gap-3 mt-2">
              {processBanners.map((_, idx) => (
                <button
                  key={`process-dot-${idx}`}
                  type="button"
                  onClick={() => {
                    setIsTransitionEnabled(true);
                    setCurrentIndex(idx + 1);
                  }}
                  className={`rounded-full touch-manipulation transition-all duration-300 ${
                    activeRealIndex === idx
                      ? "bg-pink-500 w-10 h-2"
                      : "bg-gray-300 hover:bg-gray-400 w-2 h-2 hover:scale-125"
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </section>
      )}
      {/* Header */}
      <section className="py-12 px-6 md:px-12 lg:px-20 border-b border-gray-200">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-black leading-tight tracking-tight mb-4 text-gray-900">
            {bookingCopy.journey_title}
          </h1>
          <p className="text-gray-600 text-lg md:text-xl max-w-2xl">
            {bookingCopy.journey_description}
          </p>
        </div>
      </section>

      {/* Booking Section */}
      <section className="py-8 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
            {/* Left Column: Calendar & Time Slots */}
            <div className="lg:col-span-2 flex flex-col gap-8 md:gap-10">
              {journeyError || !ticket ? (
                <div className="rounded-2xl border-2 border-amber-300 bg-gradient-to-r from-amber-50 to-yellow-50 px-8 py-12 text-center text-amber-900 shadow-md">
                  <div className="text-4xl mb-4">⚠️</div>
                  <p className="text-lg font-medium">
                    {journeyError?.message ||
                      "Entrance booking is unavailable right now."}
                  </p>
                </div>
              ) : (
                <>
                  {/* ⚠️ Animated Warning Banner — heartbeat scale */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: "spring", stiffness: 260, damping: 18 }}
                    className="relative overflow-hidden rounded-xl shadow-[0_8px_20px_rgba(245,158,11,0.3)] border-2 border-amber-300 mb-8 group"
                  >
                    {/* Amber Background */}
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400" />

                    {/* Hazard Tape Diagonal Stripes */}
                    <div
                      className="absolute inset-0 opacity-[0.08] mix-blend-overlay pointer-events-none"
                      style={{
                        backgroundImage:
                          "repeating-linear-gradient(-45deg, transparent, transparent 20px, rgba(0,0,0,1) 20px, rgba(0,0,0,1) 40px)",
                      }}
                    />

                    {/* Sweeping Highlight */}
                    <motion.div
                      className="absolute top-1/2 -left-32 w-64 h-64 bg-white/60 blur-[40px] rounded-full -translate-y-1/2 mix-blend-overlay pointer-events-none"
                      animate={{ x: ["0%", "400%"] }}
                      transition={{
                        repeat: Infinity,
                        duration: 4,
                        ease: "linear",
                      }}
                    />

                    {/* Content — no marquee, just static centered content */}
                    <motion.div
                      animate={{ scale: [1, 1.025, 1, 1.025, 1] }}
                      transition={{
                        repeat: Infinity,
                        duration: 1.8,
                        ease: "easeInOut",
                        times: [0, 0.25, 0.5, 0.75, 1],
                      }}
                      className="relative flex items-center justify-center gap-4 px-6 py-4 text-amber-950"
                    >
                      {/* Icon */}
                      <motion.span
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{
                          repeat: Infinity,
                          duration: 1.8,
                          ease: "easeInOut",
                        }}
                        className="flex items-center justify-center w-9 h-9 shrink-0 rounded-full bg-white/40 backdrop-blur-md shadow-[0_0_15px_rgba(255,255,255,0.6)] border border-white/50 text-xl"
                      >
                        ⚠️
                      </motion.span>

                      {/* Text */}
                      <p className="text-xs md:text-sm font-black tracking-wide uppercase text-amber-950 drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)] text-center leading-snug">
                        <span className="text-amber-900">Perhatian!</span>{" "}
                        Pastikan jadwal &amp; tanggal benar, jangan sampai salah
                        ya.{" "}
                        <span className="italic font-black">
                          See you in stage! 🌟
                        </span>
                      </p>

                      {/* Icon (mirrored right) */}
                      <motion.span
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{
                          repeat: Infinity,
                          duration: 1.8,
                          ease: "easeInOut",
                          delay: 0.9,
                        }}
                        className="flex items-center justify-center w-9 h-9 shrink-0 rounded-full bg-white/40 backdrop-blur-md shadow-[0_0_15px_rgba(255,255,255,0.6)] border border-white/50 text-xl"
                      >
                        ⚠️
                      </motion.span>
                    </motion.div>
                  </motion.div>

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

                  {selectedDate ? (
                    <motion.div
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 20,
                      }}
                      className="relative overflow-hidden rounded-2xl shadow-[0_0_40px_rgba(236,72,153,0.5)] border border-pink-300/50 group cursor-pointer transform-gpu"
                    >
                      {/* Rich solid background */}
                      <div className="absolute inset-0 bg-gradient-to-r from-rose-600 via-pink-500 to-rose-600" />

                      {/* Diagonal speed stripes background */}
                      <div
                        className="absolute inset-0 opacity-20 mix-blend-overlay"
                        style={{
                          backgroundImage:
                            "repeating-linear-gradient(-45deg, transparent, transparent 10px, rgba(255,255,255,1) 10px, rgba(255,255,255,1) 20px)",
                        }}
                      />

                      {/* Moving glowing lens flare behind the text */}
                      <motion.div
                        className="absolute top-1/2 -left-32 w-64 h-64 bg-white/50 blur-[40px] rounded-full -translate-y-1/2 mix-blend-overlay pointer-events-none"
                        animate={{ x: ["0%", "500%"] }}
                        transition={{
                          repeat: Infinity,
                          duration: 2.5,
                          ease: "linear",
                        }}
                      />

                      <div className="relative flex items-center py-4 text-white overflow-hidden">
                        <motion.div
                          className="flex whitespace-nowrap w-max"
                          animate={{ x: ["-50%", 0] }}
                          transition={{
                            repeat: Infinity,
                            duration: 15,
                            ease: "linear",
                          }}
                        >
                          {[...Array(8)].map((_, i) => (
                            <div
                              key={i}
                              className="flex items-center gap-6 px-6"
                            >
                              <span className="text-lg md:text-xl text-yellow-300">
                                {i % 2 === 0 ? "🔥" : "⚡"}
                              </span>

                              <p className="text-sm md:text-lg font-black leading-none tracking-[0.15em] italic text-white">
                                {i % 2 === 0
                                  ? "SELLING FAST"
                                  : "SECURE YOUR SPOT NOW!"}
                              </p>

                              <div className="w-1.5 h-1.5 rounded-full bg-white/50" />
                            </div>
                          ))}
                        </motion.div>
                      </div>
                    </motion.div>
                  ) : null}

                  {/* Sesi dinonaktifkan */}
                  {/* <JourneyTimeSlotsSection
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
                  /> */}
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
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
                  className="bg-white rounded-2xl shadow-[0_15px_40px_rgba(236,72,153,0.1)] border border-pink-100 p-6 lg:p-8 group hover:shadow-[0_20px_50px_rgba(236,72,153,0.2)] transition-all duration-500"
                >
                  <h3 className="text-2xl md:text-3xl font-black mb-6 italic text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-rose-500 uppercase tracking-wide flex items-center gap-3">
                    <span className="material-symbols-outlined text-pink-500 text-3xl">
                      map
                    </span>
                    {sparkMap.title || "Spark Map"}
                  </h3>
                  <div className="relative overflow-hidden rounded-xl bg-gradient-to-b from-pink-50 to-rose-50 border-2 border-pink-100 group-hover:border-pink-300 transition-colors duration-500">
                    {sparkMap.image_url?.match(/\.(mp4|webm|ogg)(\?.*)?$/i) ? (
                      <video
                        src={sparkMap.image_url}
                        className="w-full rounded-lg object-contain transition-transform duration-700 group-hover:scale-[1.03]"
                        autoPlay
                        loop
                        muted
                        playsInline
                      />
                    ) : (
                      <img
                        src={sparkMap.image_url}
                        alt={sparkMap.title || "Spark Stage 55 Map"}
                        className="w-full rounded-lg object-contain transition-transform duration-700 group-hover:scale-[1.03]"
                      />
                    )}
                  </div>
                </motion.div>
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
      <BookingTermsModal
        open={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        onAgree={() => {
          setShowTermsModal(false);
          navigateToPayment();
        }}
      />
    </div>
  );
};

export default Booking;
