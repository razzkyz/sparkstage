import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useBanners } from '../hooks/useBanners';
import { HeroBannerCarousel } from '../components/HeroBannerCarousel';
import Logo from '@/logo/logo black spark with tagline.png';

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger);

const OnStage = () => {
  const [currentProcessSlide, setCurrentProcessSlide] = useState(0);
  const [showWelcomePopup, setShowWelcomePopup] = useState(true);

  // GSAP animation refs
  const ticketButtonRef = useRef<HTMLDivElement>(null);
  const processTitleRef = useRef<HTMLDivElement>(null);
  const processCarouselRef = useRef<HTMLDivElement>(null);
  const heroSectionRef = useRef<HTMLDivElement>(null);
  const welcomePopupRef = useRef<HTMLDivElement>(null);

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
      setCurrentProcessSlide((p) => (p + 1) % processBanners.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [processBanners.length, currentProcessSlide]);

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

  // Welcome popup animation
  useEffect(() => {
    if (!welcomePopupRef.current || !showWelcomePopup) return;

    const timeline = gsap.timeline();
    
    // Pop-in animation
    timeline.fromTo(
      welcomePopupRef.current,
      { opacity: 0, scale: 0.5, y: 30 },
      { 
        opacity: 1, 
        scale: 1, 
        y: 0, 
        duration: 0.6, 
        ease: 'back.out',
        delay: 0.8 
      }
    );

    // Show for 3 seconds then fade out suddenly
    timeline.to(
      welcomePopupRef.current,
      { opacity: 0, scale: 0.8, y: -20, duration: 0.1, ease: 'none' },
      '+=3'
    );

    timeline.add(() => {
      setShowWelcomePopup(false);
    });

    return () => {
      timeline.kill();
    };
  }, [showWelcomePopup]);

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
      {/* Welcome Popup */}
      {showWelcomePopup && (
        <div 
          ref={welcomePopupRef}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm cursor-pointer"
          onClick={() => setShowWelcomePopup(false)}
        >
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            {/* Main popup content */}
            <div className="relative px-6 md:px-8 py-8 md:py-10 bg-white rounded-2xl shadow-2xl border-3 border-main-400 text-center max-w-sm mx-4">
              <div className="flex justify-center mb-4">
                <img src={Logo} alt="SPARK" className="h-14 w-auto md:h-16" />
              </div>
              
              <h1 className="text-2xl md:text-3xl font-black text-gray-900 mb-2 tracking-wider">
                WELCOME STAR!
              </h1>
              
              <p className="text-sm md:text-base text-gray-700 font-semibold">
                Get Ready to Be Star ✨
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section with Slider */}
      <section ref={heroSectionRef} className="relative w-full overflow-hidden bg-black">

        {heroBanners.length > 0 ? (
          <HeroBannerCarousel
            slides={heroBanners}
            intervalMs={8000}
            containerClassName="relative w-full"
            imageClassName="w-full h-auto object-contain"
            autoHeight={true}
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
      <div ref={ticketButtonRef} className="relative z-20 pt-8 pb-6 bg-gradient-to-b from-white via-white to-gray-50 px-2 sm:px-4 border-b border-gray-100 shadow-sm">
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
        <section ref={processCarouselRef} className="w-full relative overflow-hidden bg-gradient-to-b from-white to-gray-50 mb-8 border-t border-b border-gray-100/50 pb-8 shadow-sm">
          {/* Title Image Overflow (Only shown for current active slide) */}
          <div ref={processTitleRef} className="flex justify-center mb-8 h-32 md:h-40 lg:h-48 transition-all duration-500 text-center relative z-20 mt-6 px-4">
            {processBanners[currentProcessSlide]?.title_image_url ? (
              <img 
                src={processBanners[currentProcessSlide].title_image_url!} 
                alt={processBanners[currentProcessSlide].title || 'Process Title Typography'} 
                className="h-full w-auto object-contain animate-fade-in drop-shadow-lg hover:drop-shadow-xl transition-all"
              />
            ) : processBanners[currentProcessSlide]?.title ? (
              <h2 className="text-4xl md:text-6xl font-black tracking-widest text-main-600 self-center animate-fade-in uppercase pt-4 drop-shadow-md">
                {processBanners[currentProcessSlide].title}
              </h2>
            ) : null}
          </div>

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
                  if (diff > 0) setCurrentProcessSlide((p) => (p + 1) % processBanners.length);
                  else setCurrentProcessSlide((p) => (p - 1 + processBanners.length) % processBanners.length);
                }
              }}
            >
              <div
                className="flex transition-transform duration-700 ease-in-out"
                style={{
                  transform: `translateX(-${currentProcessSlide * 100}%)`
                }}
              >
                {processBanners.map((processBanner) => (
                  <div key={processBanner.id} className="w-full shrink-0">
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
                  onClick={() => setCurrentProcessSlide((p) => (p - 1 + processBanners.length) % processBanners.length)}
                  className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 z-10 bg-white/50 hover:bg-white/80 active:bg-white text-main-600 p-2 md:p-4 rounded-full shadow-lg hover:shadow-xl transition-all touch-manipulation backdrop-blur-md hover:scale-110 active:scale-95"
                >
                  <ChevronLeft className="w-6 h-6 md:w-8 md:h-8" />
                </button>
                <button
                  onClick={() => setCurrentProcessSlide((p) => (p + 1) % processBanners.length)}
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
                  onClick={() => setCurrentProcessSlide(idx)}
                  className={`rounded-full ux-transition-color touch-manipulation transition-all duration-300 ${
                    currentProcessSlide === idx 
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
    </div>
  );
};

export default OnStage;
