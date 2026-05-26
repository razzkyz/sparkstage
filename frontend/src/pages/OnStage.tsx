import { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Heart } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useBanners } from '../hooks/useBanners';
import { HeroBannerCarousel } from '../components/HeroBannerCarousel';

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger);

const trendingProducts = [
  { id: 1, image: '/images/Charm Bar assets/CHARM VISUAL 1.png', link: '/charm-bar' },
  { id: 2, image: '/images/Charm Bar assets/CHARM VISUAL 2.png', link: '/charm-bar' },
  { id: 3, image: '/images/Charm Bar assets/CHARM VISUAL 3.png', link: '/charm-bar' },
  { id: 4, image: '/images/Charm Bar assets/43620168072.png', link: '/charm-bar' },
  { id: 5, image: '/images/Charm Bar assets/CHARM VISUAL 1.png', link: '/charm-bar' },
  { id: 6, image: '/images/Charm Bar assets/CHARM VISUAL 2.png', link: '/charm-bar' },
];

const OnStage = () => {
  const [currentIndex, setCurrentIndex] = useState(1);
  const [isTransitionEnabled, setIsTransitionEnabled] = useState(true);
  const [likedProducts, setLikedProducts] = useState<Record<number, boolean>>({});

  const trendingSliderRef = useRef<HTMLDivElement>(null);

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

  const toggleLike = (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    e.stopPropagation();
    setLikedProducts(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const scrollTrending = (direction: 'left' | 'right') => {
    const slider = trendingSliderRef.current;
    if (!slider) return;
    const firstChild = slider.firstElementChild as HTMLElement;
    const itemWidth = firstChild ? firstChild.offsetWidth + 16 : 300;
    
    if (direction === 'right') {
      if (slider.scrollLeft >= slider.scrollWidth - slider.clientWidth - 10) {
        slider.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        slider.scrollBy({ left: itemWidth, behavior: 'smooth' });
      }
    } else {
      if (slider.scrollLeft <= 10) {
        slider.scrollTo({ left: slider.scrollWidth, behavior: 'smooth' });
      } else {
        slider.scrollBy({ left: -itemWidth, behavior: 'smooth' });
      }
    }
  };

  // Trending products auto-scroll
  useEffect(() => {
    const slider = trendingSliderRef.current;
    if (!slider) return;
    const autoScroll = setInterval(() => {
      if (!slider) return;
      const firstChild = slider.firstElementChild as HTMLElement;
      if (!firstChild) return;
      const itemWidth = firstChild.offsetWidth + 16;
      if (slider.scrollLeft >= slider.scrollWidth - slider.clientWidth - 10) {
        slider.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        slider.scrollTo({ left: slider.scrollLeft + itemWidth, behavior: 'smooth' });
      }
    }, 3000);
    return () => clearInterval(autoScroll);
  }, []);

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
      <div className="bg-white min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-pink-500" />
      </div>
    );
  }

  if (error && !hasData) {
    return (
      <div className="bg-white min-h-screen flex items-center justify-center">
        <div className="text-center px-6 py-12 bg-white rounded-none border-2 border-black">
          <div className="mb-4 text-4xl">⚠️</div>
          <p className="text-lg text-black mb-6 font-bold uppercase tracking-widest">Gagal memuat konten. Coba lagi.</p>
          <button
            type="button"
            onClick={() => {
              refetchProcess();
            }}
            className="inline-flex items-center justify-center rounded-full bg-pink-500 hover:bg-pink-600 active:bg-pink-700 px-10 py-4 text-white font-black uppercase tracking-widest transition-colors duration-300 hover:scale-105 active:scale-95"
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
      <section ref={heroSectionRef} className="relative w-full overflow-hidden bg-black h-72 md:h-[65vh]">

        {heroBanners.length > 0 ? (
          <HeroBannerCarousel
            slides={heroBanners}
            intervalMs={8000}
            containerClassName="relative w-full h-72 md:h-[65vh]"
            imageClassName="w-full h-full object-cover"
            autoHeight={false}
            prevButtonClassName="absolute left-2 sm:left-4 md:left-8 top-1/2 -translate-y-1/2 z-10 bg-white text-black hover:bg-gray-200 active:bg-white p-2 sm:p-3 md:p-4 rounded-full touch-manipulation shadow-lg transition-colors"
            nextButtonClassName="absolute right-2 sm:right-4 md:right-8 top-1/2 -translate-y-1/2 z-10 bg-white text-black hover:bg-gray-200 active:bg-white p-2 sm:p-3 md:p-4 rounded-full touch-manipulation shadow-lg transition-colors"
            indicatorActiveClassName="bg-white"
            indicatorInactiveClassName="bg-white/50 hover:bg-white/80 transition-colors"
            overlayClassName="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/40"
            renderOverlay={(slide) => (
              <>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-3 sm:px-6 md:px-8">
                  <div className="max-w-full md:max-w-4xl mx-auto">
                    {slide.title && (
                      <h1 className="text-white text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black uppercase tracking-tighter mb-2 sm:mb-3 md:mb-4 drop-shadow-2xl line-clamp-3">{slide.title}</h1>
                    )}
                    {slide.subtitle ? (
                      <p className="text-white/90 text-sm sm:text-base md:text-xl lg:text-2xl tracking-widest uppercase font-bold drop-shadow-lg line-clamp-2">{slide.subtitle}</p>
                    ) : null}
                  </div>
                </div>
              </>
            )}
          />
        ) : (
          <div className="absolute inset-0 bg-black flex items-center justify-center px-4 text-center text-white">
            <p className="text-3xl md:text-6xl font-black tracking-tighter uppercase">✨ SPARK ON STAGE ✨</p>
          </div>
        )}
      </section>

      {/* Buy Ticket Button - Fixed positioning */}
      <div ref={ticketButtonRef} className="relative z-20 py-8 md:py-16 bg-white px-4 sm:px-6 md:px-8 border-b border-gray-100">
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
        <section ref={processCarouselRef} className="w-full relative overflow-hidden bg-white py-12 md:py-20 mb-8">
          {/* Section Header */}
          <div className="text-center mb-10 md:mb-16 px-4 relative z-20">
            <h2 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter text-black uppercase pb-2">
              PREVIEW STAGE 
            </h2>
            <div className="w-24 md:w-32 h-2 bg-black mx-auto mt-4 rounded-full"></div>
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
                <h2 className="text-3xl md:text-5xl lg:text-6xl font-black tracking-tighter text-black self-center animate-fade-in uppercase pt-4">
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
                  className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 z-10 bg-black hover:bg-gray-800 active:bg-black text-white p-3 md:p-5 rounded-full shadow-lg transition-all touch-manipulation hover:scale-110 active:scale-95"
                >
                  <ChevronLeft className="w-6 h-6 md:w-8 md:h-8" />
                </button>
                <button
                  type="button"
                  onClick={nextSlide}
                  className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 z-10 bg-black hover:bg-gray-800 active:bg-black text-white p-3 md:p-5 rounded-full shadow-lg transition-all touch-manipulation hover:scale-110 active:scale-95"
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
                  className={`rounded-full touch-manipulation transition-all duration-300 ${
                    activeRealIndex === idx 
                      ? 'bg-pink-500 w-10 h-2' 
                      : 'bg-gray-300 hover:bg-gray-400 w-2 h-2 hover:scale-125'
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* 2x2 Promo Grid Section */}
      <section className="w-full bg-white py-12 md:py-16">
        <div className="w-full mx-auto px-4 sm:px-6 md:px-8 max-w-[1600px]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            
            {/* Promo 1 */}
            <Link to="/booking" className="group block relative w-full aspect-[4/5] md:aspect-square lg:aspect-[4/3] overflow-hidden bg-gray-100">
              <img src="/images/landing/TICKET FIX.PNG" alt="Booking Tiket" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors duration-300"></div>
              <div className="absolute bottom-8 left-0 w-full text-center z-10 px-4">
                <h3 className="text-3xl md:text-4xl lg:text-5xl font-black text-white uppercase tracking-tighter drop-shadow-lg mb-2">BOOKING TIKET</h3>
                <span className="inline-block text-white font-bold uppercase tracking-widest border-b-2 border-white pb-1 drop-shadow-md text-sm md:text-base">PESAN SEKARANG</span>
              </div>
            </Link>

            {/* Promo 2 */}
            <Link to="/dressing-room" className="group block relative w-full aspect-[4/5] md:aspect-square lg:aspect-[4/3] overflow-hidden bg-gray-100">
              <img src="/images/glam page assets/VISUAL 1.png" alt="Glam Room" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors duration-300"></div>
              <div className="absolute bottom-8 left-0 w-full text-center z-10 px-4">
                <h3 className="text-3xl md:text-4xl lg:text-5xl font-black text-white uppercase tracking-tighter drop-shadow-lg mb-2">GLAM ROOM</h3>
                <span className="inline-block text-white font-bold uppercase tracking-widest border-b-2 border-white pb-1 drop-shadow-md text-sm md:text-base">LIHAT KOLEKSI</span>
              </div>
            </Link>

            {/* Promo 3 */}
            <Link to="/charmbar" className="group block relative w-full aspect-[4/5] md:aspect-square lg:aspect-[4/3] overflow-hidden bg-gray-100">
              <img src="/images/Charm Bar assets/CHARM VISUAL 1.png" alt="CharmBar" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors duration-300"></div>
              <div className="absolute bottom-8 left-0 w-full text-center z-10 px-4">
                <h3 className="text-3xl md:text-4xl lg:text-5xl font-black text-white uppercase tracking-tighter drop-shadow-lg mb-2">CHARMBAR</h3>
                <span className="inline-block text-white font-bold uppercase tracking-widest border-b-2 border-white pb-1 drop-shadow-md text-sm md:text-base">JELAJAHI CHARM</span>
              </div>
            </Link>

            {/* Promo 4 */}
            <Link to="/shop" className="group block relative w-full aspect-[4/5] md:aspect-square lg:aspect-[4/3] overflow-hidden bg-gray-100">
              <img src="/images/Charm Bar assets/CHARM VISUAL 2.png" alt="Merchandise" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors duration-300"></div>
              <div className="absolute bottom-8 left-0 w-full text-center z-10 px-4">
                <h3 className="text-3xl md:text-4xl lg:text-5xl font-black text-white uppercase tracking-tighter drop-shadow-lg mb-2">MERCHANDISE</h3>
                <span className="inline-block text-white font-bold uppercase tracking-widest border-b-2 border-white pb-1 drop-shadow-md text-sm md:text-base">SHOP NOW</span>
              </div>
            </Link>

          </div>
        </div>
      </section>

      {/* Trending Section (Slider) */}
      <section className="w-full bg-white pb-12 md:pb-16">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8">

          {/* Section Header */}
          <div className="flex items-end justify-between mb-6 md:mb-8">
            <h2 className="text-4xl md:text-5xl lg:text-7xl font-black text-black uppercase tracking-tighter leading-none drop-shadow-sm">
              NOW TRENDING
            </h2>
            <Link to="/charm-bar" className="text-black font-bold uppercase tracking-widest border-b-2 border-black pb-0.5 hover:opacity-70 transition-opacity whitespace-nowrap text-xs md:text-sm mb-1">
              View All
            </Link>
          </div>

          {/* Slider Container */}
          <div className="relative -mx-4 px-4 sm:mx-0 sm:px-0 group/slider">
            
            {/* Manual Navigation Arrows */}
            <button
              type="button"
              onClick={() => scrollTrending('left')}
              className="absolute left-2 md:-left-4 top-1/2 -translate-y-1/2 z-20 bg-white/90 hover:bg-white text-black p-2 md:p-3 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.1)] opacity-0 group-hover/slider:opacity-100 transition-opacity"
            >
              <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
            </button>
            
            <button
              type="button"
              onClick={() => scrollTrending('right')}
              className="absolute right-2 md:-right-4 top-1/2 -translate-y-1/2 z-20 bg-white/90 hover:bg-white text-black p-2 md:p-3 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.1)] opacity-0 group-hover/slider:opacity-100 transition-opacity"
            >
              <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
            </button>

            <div 
              ref={trendingSliderRef}
              className="flex overflow-x-auto snap-x snap-mandatory gap-4 md:gap-6 pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            >
              {trendingProducts.map((product, index) => (
                <div key={`${product.id}-${index}`} className="snap-start shrink-0 w-[65%] sm:w-[45%] md:w-[30%] lg:w-[22%] group relative">
                  <Link to={product.link} className="block relative bg-[#f1f1f1] aspect-[3/4] overflow-hidden group-hover:shadow-xl transition-shadow duration-300">
                    <img 
                      src={product.image} 
                      alt="Trending Product" 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                    />
                    <button 
                      type="button"
                      onClick={(e) => toggleLike(e, product.id)}
                      className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-white/50 transition-colors z-20 cursor-pointer"
                    >
                      <Heart 
                        className={`w-5 h-5 transition-colors ${likedProducts[product.id] ? 'fill-pink-500 text-pink-500' : 'text-black hover:text-pink-500'}`} 
                        strokeWidth={1.5} 
                      />
                    </button>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Instagram Feed Section */}
      <section className="w-full bg-white py-16 md:py-24">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 text-center mb-10 md:mb-16">
          <p className="text-xl md:text-2xl font-bold italic tracking-widest mb-4">Follow Us On IG</p>
          <a href="https://instagram.com/Spark_Stage55" target="_blank" rel="noopener noreferrer" className="inline-block hover:opacity-80 transition-opacity w-full">
            <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black text-black uppercase tracking-tighter leading-none break-all sm:break-normal px-4">
              @SPARK_STAGE55
            </h2>
          </a>
        </div>
        
        <div className="w-full mx-auto max-w-[1800px] px-2 md:px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
            {[
              '/images/glam page assets/STAR GLITTER TRANSPARENT BG/AURA POP.png',
              '/images/landing/READY TO BE A STAR.PNG',
              '/images/glam page assets/STAR GLITTER TRANSPARENT BG/PINK RUSH.png',
              '/images/Charm Bar assets/CHARM VISUAL 3.png',
              '/images/glam page assets/STAR GLITTER TRANSPARENT BG/GOLD DRIP.png',
              '/images/landing/neon.png',
              '/images/glam page assets/STAR GLITTER TRANSPARENT BG/SILVER BLINK.png',
              '/images/glam page assets/STAR GLITTER TRANSPARENT BG/MIDNIGHT FX.png',
            ].map((imgUrl, idx) => (
              <a 
                key={idx} 
                href="https://instagram.com/Spark_Stage55" 
                target="_blank" 
                rel="noopener noreferrer"
                className="block relative aspect-square overflow-hidden bg-gray-100 group"
              >
                <img 
                  src={imgUrl} 
                  alt={`Instagram feed ${idx + 1}`} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                  <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 font-bold tracking-widest uppercase text-sm md:text-base">
                    View on IG
                  </span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* News Banner Section */}
      <section className="w-full bg-black py-16 md:py-24 text-center">
        <div className="max-w-[1200px] mx-auto px-4 flex flex-col items-center">
          <h2 className="text-5xl md:text-6xl lg:text-8xl font-black text-white uppercase tracking-tighter mb-4 md:mb-6">
            LATEST NEWS
          </h2>
          <p className="text-white text-lg md:text-xl lg:text-2xl font-bold italic tracking-widest mb-8 md:mb-12 max-w-2xl px-4">
            Stay up to date with exciting events, backstage passes, and exclusive charm releases.
          </p>
          <Link
            to="/news"
            className="inline-block bg-pink-500 text-white font-black uppercase tracking-widest px-8 py-4 md:px-12 md:py-5 rounded-full hover:bg-white hover:text-black hover:-translate-y-1 transition-all duration-300 text-sm md:text-lg shadow-[0_4px_14px_0_rgba(236,107,173,0.39)]"
          >
            READ UPDATES
          </Link>
        </div>
      </section>
    </div>
  );
};

export default OnStage;
