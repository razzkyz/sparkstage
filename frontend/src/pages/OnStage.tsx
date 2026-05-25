import { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useBanners } from '../hooks/useBanners';
import { HeroBannerCarousel } from '../components/HeroBannerCarousel';

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger);

const OnStage = () => {
  const [currentIndex, setCurrentIndex] = useState(1);
  const [isTransitionEnabled, setIsTransitionEnabled] = useState(true);

  // GSAP animation refs
  const ticketButtonRef = useRef<HTMLDivElement>(null);
  const processTitleRef = useRef<HTMLDivElement>(null);
  const processCarouselRef = useRef<HTMLDivElement>(null);
  const heroSectionRef = useRef<HTMLDivElement>(null);

  const processTouchStartX = useRef(0);
  const processTouchEndX = useRef(0);

  const {
    data: heroBanners = [],
    isLoading: heroLoading,
    error: heroError,
  } = useBanners('hero');
  const {
    data: processBanners = [],
    isLoading: processLoading,
    error: processError,
    refetch: refetchProcess,
  } = useBanners('process');

  const hasData = heroBanners.length > 0 || processBanners.length > 0;
  const loading = (heroLoading || processLoading) && !hasData;
  const error = heroError || processError;

  const activeRealIndex = useMemo(() => {
    if (processBanners.length <= 1) return 0;
    if (currentIndex === 0) return processBanners.length - 1;
    if (currentIndex === processBanners.length + 1) return 0;
    return currentIndex - 1;
  }, [currentIndex, processBanners.length]);

  const slidesToRender = useMemo(() => {
    if (processBanners.length <= 1) return processBanners;
    return [
      processBanners[processBanners.length - 1],
      ...processBanners,
      processBanners[0],
    ];
  }, [processBanners]);

  const nextSlide = () => {
    if (processBanners.length <= 1) return;
    setIsTransitionEnabled(true);
    setCurrentIndex((prev) => prev + 1);
  };

  const prevSlide = () => {
    if (processBanners.length <= 1) return;
    setIsTransitionEnabled(true);
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
    
    // GSAP animation for process title
    if (processTitleRef.current) {
      gsap.fromTo(
        processTitleRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }
      );
    }

    const interval = setInterval(() => {
      setIsTransitionEnabled(true);
      setCurrentIndex((prev) => prev + 1);
    }, 8000);
    return () => clearInterval(interval);
  }, [processBanners.length, activeRealIndex]);

  // Ticket button entrance animation
  useEffect(() => {
    if (ticketButtonRef.current) {
      gsap.fromTo(
        ticketButtonRef.current,
        { opacity: 0, scale: 0.8, y: 30 },
        { opacity: 1, scale: 1, y: 0, duration: 0.8, ease: 'back.out', delay: 0.2 }
      );
    }
  }, []);

  // Hero section fade-in animation
  useEffect(() => {
    if (heroSectionRef.current) {
      gsap.fromTo(
        heroSectionRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 1, ease: 'power2.inOut' }
      );
    }
  }, []);

  if (loading) {
    return (
      <div className="bg-linear-to-br from-white to-gray-50 min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-main-600" />
      </div>
    );
  }

  if (error && !hasData) {
    return (
      <div className="bg-linear-to-br from-white to-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center px-6 py-12 bg-white rounded-2xl shadow-lg border border-gray-200">
          <div className="mb-4 text-4xl">⚠️</div>
          <p className="text-lg text-gray-700 mb-6 font-medium">Gagal memuat konten. Coba lagi.</p>
          <button
            type="button"
            onClick={() => {
              refetchProcess();
            }}
            className="inline-flex items-center justify-center rounded-lg bg-main-600 hover:bg-main-700 active:bg-main-800 px-8 py-3 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95"
          >
            🔄 Muat ulang
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      {/* Hero Section with Slider */}
      <section ref={heroSectionRef} className="relative w-full overflow-hidden bg-black h-96 md:h-screen">

        {heroBanners.length > 0 ? (
          <HeroBannerCarousel
            slides={heroBanners}
            intervalMs={8000}
            containerClassName="relative w-full h-96 md:h-screen"
            imageClassName="w-full h-full object-cover"
            autoHeight={false}
            prevButtonClassName="absolute left-1 sm:left-2 md:left-4 top-1/2 -translate-y-1/2 z-10 bg-white/20 hover:bg-white/40 active:bg-white/60 backdrop-blur-md text-white p-1.5 sm:p-2 md:p-3 rounded-full ux-transition-color touch-manipulation shadow-lg hover:shadow-xl transition-all"
            nextButtonClassName="absolute right-1 sm:right-2 md:right-4 top-1/2 -translate-y-1/2 z-10 bg-white/20 hover:bg-white/40 active:bg-white/60 backdrop-blur-md text-white p-1.5 sm:p-2 md:p-3 rounded-full ux-transition-color touch-manipulation shadow-lg hover:shadow-xl transition-all"
            indicatorActiveClassName="bg-white shadow-lg"
            indicatorInactiveClassName="bg-white/40 hover:bg-white/60 transition-colors"
            overlayClassName="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/40"
            renderOverlay={(slide) => (
              <>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-3 sm:px-6 md:px-8">
                  <div className="max-w-full md:max-w-4xl mx-auto">
                    {slide.title && (
                      <h1 className="text-white text-xl sm:text-3xl md:text-5xl lg:text-6xl font-black mb-2 sm:mb-3 md:mb-4 drop-shadow-lg line-clamp-3">{slide.title}</h1>
                    )}
                    {slide.subtitle ? (
                      <p className="text-white/95 text-xs sm:text-sm md:text-lg lg:text-xl drop-shadow-md line-clamp-2">{slide.subtitle}</p>
                    ) : null}
                  </div>
                </div>
              </>
            )}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-b from-main-600 to-main-700 flex items-center justify-center px-4 text-center text-white">
            <p className="text-xl md:text-5xl font-black tracking-wider drop-shadow-lg">✨ SPARK ON STAGE ✨</p>
          </div>
        )}
      </section>

      {/* Buy Ticket Button - Fixed positioning */}
      <div ref={ticketButtonRef} className="relative z-20 py-8 md:py-12 bg-gradient-to-b from-white via-white to-gray-50 px-4 sm:px-6 md:px-8 border-b border-gray-100 shadow-sm">
        <div className="flex justify-center">
          <Link
            to="/booking"
            className="inline-block transition-all duration-300 hover:scale-110 hover:-translate-y-3 hover:drop-shadow-2xl active:scale-100 active:translate-y-0 active:drop-shadow-lg w-full max-w-2xl sm:max-w-3xl lg:max-w-5xl xl:max-w-6xl group"
          >
            <div className="relative">
              <img
                src="/images/landing/TICKET BOARD ENTRANCE website.png"
                alt="BE A STAR Ticket"
                className="w-full h-auto object-contain drop-shadow-2xl group-hover:drop-shadow-[0_20px_25px_rgba(0,0,0,0.3)] transition-all duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg" />
            </div>
          </Link>
        </div>
      </div>

      {/* Process Carousel (New Section) */}
      {processBanners.length > 0 && (
        <section ref={processCarouselRef} className="w-full relative overflow-hidden bg-gradient-to-b from-white to-gray-50 py-8 md:py-12 mb-8 border-t border-b border-gray-100/50 shadow-sm">
          {/* Section Header */}
          <div className="text-center mb-8 md:mb-12 px-4 relative z-20">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black italic tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-pink-500 uppercase drop-shadow-md pb-2 transform -skew-x-6">
              Preview Stage 
            </h2>
            <div className="w-24 md:w-32 h-1.5 bg-gradient-to-r from-gray-900 to-pink-500 mx-auto mt-2 rounded-full shadow-sm animate-pulse"></div>
          </div>

          {/* Title Image Overflow (Only shown for current active slide) */}
          {(processBanners[activeRealIndex]?.title_image_url || processBanners[activeRealIndex]?.title) && (
            <div ref={processTitleRef} className="flex justify-center mb-8 md:mb-10 h-24 md:h-32 lg:h-40 transition-all duration-500 text-center relative z-20 px-4">
              {processBanners[activeRealIndex]?.title_image_url ? (
                <img 
                  src={processBanners[activeRealIndex].title_image_url!} 
                  alt={processBanners[activeRealIndex].title || 'Process Title Typography'} 
                  className="h-full w-auto object-contain animate-fade-in drop-shadow-lg hover:drop-shadow-xl transition-all"
                />
              ) : (
                <h2 className="text-3xl md:text-5xl lg:text-6xl font-black tracking-widest text-main-600 self-center animate-fade-in uppercase pt-4 drop-shadow-md">
                  {processBanners[activeRealIndex].title}
                </h2>
              )}
            </div>
          )}

          {/* Carousel Container */}
          <div className="relative w-full">
            <div
              className="overflow-hidden w-full relative"
              onTouchStart={(e) => { processTouchStartX.current = e.touches[0].clientX; }}
              onTouchMove={(e) => { processTouchEndX.current = e.touches[0].clientX; }}
              onTouchEnd={() => {
                const swipeThreshold = 50;
                const diff = processTouchStartX.current - processTouchEndX.current;
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
                  transition: isTransitionEnabled ? 'transform 700ms ease-in-out' : 'none'
                }}
                onTransitionEnd={handleTransitionEnd}
              >
                {slidesToRender.map((processBanner, idx) => (
                  <div key={`${processBanner.id}-${idx}`} className="w-full shrink-0">
                    <Link 
                      to={processBanner.link_url || '#'} 
                      className={`block w-full h-full ${!processBanner.link_url ? 'cursor-default pointer-events-none' : ''}`}
                    >
                      {/* Process Image */}
                      <div className="relative w-full bg-gray-100 dark:bg-gray-900 group overflow-hidden">
                        {processBanner.image_url?.match(/\.(mp4|webm|ogg)(\?.*)?$/i) ? (
                          <video src={processBanner.image_url} className="w-full h-auto object-contain pointer-events-none transition-transform duration-500 group-hover:scale-105" autoPlay loop muted playsInline />
                        ) : (
                          <img src={processBanner.image_url} alt={processBanner.title || 'Process visual'} className="w-full h-auto object-contain pointer-events-none transition-transform duration-500 group-hover:scale-105" />
                        )}
                      </div>

                      {/* Process Subtitle Text */}
                      {processBanner.subtitle && (
                        <div className="p-6 md:p-8 text-center bg-white">
                          <p className="text-gray-800 font-medium md:text-2xl leading-relaxed whitespace-pre-wrap">
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
                  className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 z-10 bg-white/50 hover:bg-white/80 active:bg-white text-main-600 p-2 md:p-4 rounded-full shadow-lg hover:shadow-xl transition-all touch-manipulation backdrop-blur-md hover:scale-110 active:scale-95"
                >
                  <ChevronLeft className="w-6 h-6 md:w-8 md:h-8" />
                </button>
                <button
                  type="button"
                  onClick={nextSlide}
                  className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 z-10 bg-white/50 hover:bg-white/80 active:bg-white text-main-600 p-2 md:p-4 rounded-full shadow-lg hover:shadow-xl transition-all touch-manipulation backdrop-blur-md hover:scale-110 active:scale-95"
                >
                  <ChevronRight className="w-6 h-6 md:w-8 md:h-8" />
                </button>
              </>
            )}
          </div>

          {/* Process Carousel Indicators */}
          {processBanners.length > 1 && (
            <div className="flex justify-center gap-3 mt-10">
              {processBanners.map((_, idx) => (
                <button
                  key={`process-dot-${idx}`}
                  type="button"
                  onClick={() => {
                    setIsTransitionEnabled(true);
                    setCurrentIndex(idx + 1);
                  }}
                  className={`rounded-full ux-transition-color touch-manipulation transition-all duration-300 ${
                    activeRealIndex === idx 
                      ? 'bg-main-600 w-8 h-3 shadow-lg' 
                      : 'bg-gray-300 hover:bg-gray-400 w-2.5 h-2.5 hover:scale-125'
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Info Section with Links */}
      <section className="w-full bg-gradient-to-b from-gray-50 to-white py-16 md:py-24 px-4 sm:px-6 md:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 mb-4">
              Jelajahi Spark Stage
            </h2>
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Temukan pengalaman tak terlupakan bersama kami. Dari pembelian tiket hingga berbagai wahana seru, semuanya tersedia di sini!
            </p>
            <div className="w-24 md:w-32 h-1.5 bg-gradient-to-r from-main-600 to-pink-500 mx-auto mt-6 rounded-full"></div>
          </div>

          {/* Top CTA */}
          <div className="mt-12 md:mt-16 mb-16 md:mb-20 text-center bg-white rounded-3xl p-12 md:p-16 relative overflow-hidden group shadow-lg hover:shadow-2xl transition-shadow duration-300">
            <div className="flex flex-col items-center gap-8">
              <div className="h-40 md:h-48">
                <img src="/images/ready.png" alt="Ready to be The Star" className="h-full w-auto object-contain" />
              </div>
              <Link
                to="/booking"
                className="inline-block bg-gradient-to-r from-main-600 to-main-700 text-white font-bold px-10 py-4 rounded-xl hover:scale-110 hover:shadow-2xl transition-all duration-300"
              >
                Mulai Sekarang 🌟
              </Link>
            </div>
          </div>

          {/* Links Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {/* Booking Card */}
            <Link
              to="/booking"
              className="group relative overflow-hidden rounded-2xl bg-white border-2 border-gray-100 hover:border-main-600 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 p-8 text-center"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-main-600/5 to-main-700/5 group-hover:from-main-600/10 group-hover:to-main-700/10 transition-all duration-300"></div>
              <div className="relative z-10">
                <div className="h-64 mb-4 transform group-hover:scale-110 transition-transform duration-300 flex items-center justify-center overflow-hidden rounded-xl bg-white">
                  <img src="/images/landing/TICKET FIX.PNG" alt="Booking" className="w-auto h-auto max-w-full max-h-full object-contain" />
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-3">Booking Tiket</h3>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Pesan tiket masuk Spark Stage dan nikmati pengalaman bertemu bintang favorit Anda. Tersedia berbagai paket sesuai pilihan Anda.
                </p>
                <span className="inline-block text-main-600 font-bold group-hover:translate-x-2 transition-transform duration-300">
                  Pesan Sekarang →
                </span>
              </div>
            </Link>

            {/* Glam/Dressing Room Card */}
            <Link
              to="/dressing-room"
              className="group relative overflow-hidden rounded-2xl bg-white border-2 border-gray-100 hover:border-pink-500 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 p-8 text-center"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-pink-600/5 to-rose-700/5 group-hover:from-pink-600/10 group-hover:to-rose-700/10 transition-all duration-300"></div>
              <div className="relative z-10">
                <div className="h-64 mb-4 transform group-hover:scale-110 transition-transform duration-300 flex items-center justify-center overflow-hidden rounded-xl bg-white">
                  <img src="/images/glam page assets/VISUAL 1.png" alt="Glam Room" className="w-auto h-auto max-w-full max-h-full object-contain" />
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-3">Glam Room</h3>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Transformasi diri Anda dengan gaya glamor! Sewa berbagai kostum dan aksesori eksklusif untuk tampilan terbaik Anda.
                </p>
                <span className="inline-block text-pink-600 font-bold group-hover:translate-x-2 transition-transform duration-300">
                  Lihat Koleksi →
                </span>
              </div>
            </Link>

            {/* CharmBar Card */}
            <Link
              to="/charmbar"
              className="group relative overflow-hidden rounded-2xl bg-white border-2 border-gray-100 hover:border-purple-500 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 p-8 text-center"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 to-indigo-700/5 group-hover:from-purple-600/10 group-hover:to-indigo-700/10 transition-all duration-300"></div>
              <div className="relative z-10">
                <div className="h-64 mb-4 transform group-hover:scale-110 transition-transform duration-300 flex items-center justify-center overflow-hidden rounded-xl bg-white">
                  <img src="/images/Charm Bar assets/CHARM VISUAL 1.png" alt="CharmBar" className="w-auto h-auto max-w-full max-h-full object-contain" />
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-3">CharmBar</h3>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Dapatkan charm eksklusif dan limited edition. Kumpulkan charm favorit Anda untuk koleksi spesial yang berharga.
                </p>
                <span className="inline-block text-purple-600 font-bold group-hover:translate-x-2 transition-transform duration-300">
                  Jelajahi Charm →
                </span>
              </div>
            </Link>

            {/* Shop Card */}
            <Link
              to="/shop"
              className="group relative overflow-hidden rounded-2xl bg-white border-2 border-gray-100 hover:border-orange-500 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 p-8 text-center"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-orange-600/5 to-amber-700/5 group-hover:from-orange-600/10 group-hover:to-amber-700/10 transition-all duration-300"></div>
              <div className="relative z-10">
                <div className="h-64 mb-4 transform group-hover:scale-110 transition-transform duration-300 flex items-center justify-center overflow-hidden rounded-xl bg-white">
                  <img src="/images/Charm Bar assets/CHARM VISUAL 2.png" alt="Shop" className="w-auto h-auto max-w-full max-h-full object-contain" />
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-3">Toko</h3>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Belanja merchandise eksklusif, merchandise resmi, dan berbagai produk unik yang tidak bisa Anda temukan di tempat lain.
                </p>
                <span className="inline-block text-orange-600 font-bold group-hover:translate-x-2 transition-transform duration-300">
                  Belanja Sekarang →
                </span>
              </div>
            </Link>

            {/* Events Card */}
            <Link
              to="/events"
              className="group relative overflow-hidden rounded-2xl bg-white border-2 border-gray-100 hover:border-red-500 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 p-8 text-center"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-red-600/5 to-rose-700/5 group-hover:from-red-600/10 group-hover:to-rose-700/10 transition-all duration-300"></div>
              <div className="relative z-10">
                <div className="h-64 mb-4 transform group-hover:scale-110 transition-transform duration-300 flex items-center justify-center overflow-hidden rounded-xl bg-white">
                  <img src="/images/landing/SPARK MAP FINAL web.png" alt="Events" className="w-auto h-auto max-w-full max-h-full object-contain" />
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-3">Event</h3>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Jangan lewatkan event menarik dan terbaru di Spark Stage. Dari konser hingga meet & greet eksklusif dengan artis favorit.
                </p>
                <span className="inline-block text-red-600 font-bold group-hover:translate-x-2 transition-transform duration-300">
                  Lihat Event →
                </span>
              </div>
            </Link>

            {/* News Card */}
            <Link
              to="/news"
              className="group relative overflow-hidden rounded-2xl bg-white border-2 border-gray-100 hover:border-blue-500 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 p-8 text-center"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-cyan-700/5 group-hover:from-blue-600/10 group-hover:to-cyan-700/10 transition-all duration-300"></div>
              <div className="relative z-10">
                <div className="h-64 mb-4 transform group-hover:scale-110 transition-transform duration-300 flex items-center justify-center overflow-hidden rounded-xl bg-white">
                  <img src="/images/landing/ICON STAR-01.png" alt="News" className="w-auto h-auto max-w-full max-h-full object-contain" />
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-3">Berita</h3>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Dapatkan berita terbaru dan update terkini tentang Spark Stage. Jangan ketinggalan informasi penting dan berita eksklusif.
                </p>
                <span className="inline-block text-blue-600 font-bold group-hover:translate-x-2 transition-transform duration-300">
                  Baca Berita →
                </span>
              </div>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default OnStage;
