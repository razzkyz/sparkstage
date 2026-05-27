import { useState, useEffect, useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useBanners } from "../hooks/useBanners";

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger);

// const trendingProducts = [
//   {
//     id: 1,
//     image: "/images/Charm Bar assets/CHARM VISUAL 1.png",
//     link: "/charm-bar",
//   },
//   {
//     id: 2,
//     image: "/images/Charm Bar assets/CHARM VISUAL 2.png",
//     link: "/charm-bar",
//   },
//   {
//     id: 3,
//     image: "/images/Charm Bar assets/CHARM VISUAL 3.png",
//     link: "/charm-bar",
//   },
//   {
//     id: 4,
//     image: "/images/Charm Bar assets/43620168072.png",
//     link: "/charm-bar",
//   },
//   {
//     id: 5,
//     image: "/images/Charm Bar assets/CHARM VISUAL 1.png",
//     link: "/charm-bar",
//   },
//   {
//     id: 6,
//     image: "/images/Charm Bar assets/CHARM VISUAL 2.png",
//     link: "/charm-bar",
//   },
// ];

const OnStage = () => {
  const [currentIndex, setCurrentIndex] = useState(1);
  const [isTransitionEnabled, setIsTransitionEnabled] = useState(true);
  // const [likedProducts, setLikedProducts] = useState<Record<number, boolean>>(
  //   {},
  // );

  const trendingSliderRef = useRef<HTMLDivElement>(null);

  // GSAP animation refs
  const processTitleRef = useRef<HTMLDivElement>(null);
  const heroSectionRef = useRef<HTMLDivElement>(null);

  const {
    data: heroBanners = [],
    isLoading: heroLoading,
    error: heroError,
  } = useBanners("hero");
  const {
    data: processBanners = [],
    isLoading: processLoading,
    error: processError,
    refetch: refetchProcess,
  } = useBanners("process");

  const hasData = heroBanners.length > 0 || processBanners.length > 0;
  const loading = (heroLoading || processLoading) && !hasData;
  const error = heroError || processError;

  const activeRealIndex = useMemo(() => {
    if (processBanners.length <= 1) return 0;
    if (currentIndex === 0) return processBanners.length - 1;
    if (currentIndex === processBanners.length + 1) return 0;
    return currentIndex - 1;
  }, [currentIndex, processBanners.length]);

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

  // const toggleLike = (e: React.MouseEvent, id: number) => {
  //   e.preventDefault();
  //   e.stopPropagation();
  //   setLikedProducts((prev) => ({ ...prev, [id]: !prev[id] }));
  // };

  // const scrollTrending = (direction: "left" | "right") => {
  //   const slider = trendingSliderRef.current;
  //   if (!slider) return;
  //   const firstChild = slider.firstElementChild as HTMLElement;
  //   const itemWidth = firstChild ? firstChild.offsetWidth + 16 : 300;

  //   if (direction === "right") {
  //     if (slider.scrollLeft >= slider.scrollWidth - slider.clientWidth - 10) {
  //       slider.scrollTo({ left: 0, behavior: "smooth" });
  //     } else {
  //       slider.scrollBy({ left: itemWidth, behavior: "smooth" });
  //     }
  //   } else {
  //     if (slider.scrollLeft <= 10) {
  //       slider.scrollTo({ left: slider.scrollWidth, behavior: "smooth" });
  //     } else {
  //       slider.scrollBy({ left: -itemWidth, behavior: "smooth" });
  //     }
  //   }
  // };

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
        slider.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        slider.scrollTo({
          left: slider.scrollLeft + itemWidth,
          behavior: "smooth",
        });
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
        { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" },
      );
    }

    const interval = setInterval(() => {
      setIsTransitionEnabled(true);
      setCurrentIndex((prev) => prev + 1);
    }, 8000);
    return () => clearInterval(interval);
  }, [processBanners.length, activeRealIndex]);

  // Hero section fade-in animation
  useEffect(() => {
    if (heroSectionRef.current) {
      gsap.fromTo(
        heroSectionRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 1, ease: "power2.inOut" },
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
          <p className="text-lg text-black mb-6 font-bold uppercase tracking-widest">
            Gagal memuat konten. Coba lagi.
          </p>
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
      {/* Hero Section */}
      <section
        ref={heroSectionRef}
        className="w-full min-h-[75vh] max-h-[100vh] flex flex-col bg-black"
      >
        <img
          src="/images/heroBanner/homeBannerHeader.webp"
          alt="The most iconic content wins awards & rewards"
          className="w-full max-h-[10vh] object-contain"
        />
        <Link
          to="/booking"
          className="w-full flex-1 relative group cursor-pointer overflow-hidden"
        >
          <img
            src="/images/heroBanner/homeBanner.webp"
            alt="Become the star"
            className="absolute inset-0 w-full h-[75vh] max-h-[75vh] object-cover object-center"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />

          {/* Overlay Button */}
          <div className="absolute bottom-8 sm:bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-3 z-10 pointer-events-none opacity-95 hover:p-5 ">
            <div className="bg-white rounded-full min-w-[200px]  px-10 py-2 flex flex-col items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.15)] transform transition-transform group-hover:scale-105">
              <span className="text-[#ff6b9d] font-black text-sm md:text-xl tracking-[0.2em] leading-tight ">
                BECOME THE
              </span>
              <span className="text-[#ff6b9d] font-black text-sm md:text-xl tracking-[0.1em] leading-tight">
                ★ STAR ★
              </span>
            </div>
          </div>
        </Link>
      </section>
      <div className="block w-full bg-black hover:bg-neutral-900 transition-colors duration-300 border-t border-neutral-800">
        <div className="w-full py-4 md:py-0 md:h-[15vh] h-[15hv] flex md:flex-row items-center justify-center gap-6 md:gap-12 px-4">
          {/* Left Text: VIP STAR */}
          <div className="flex items-center gap-3 text-white font-serif font-black text-3xl sm:text-5xl md:text-6xl lg:text-7xl tracking-tighter">
            <span className="text-5xl md:text-6xl lg:text-7xl pb-2">★</span>
            <div className="flex flex-col items-center">
              <span className="text-3xl md:text-4xl lg:text-5xl">VIP</span>
              <span className="text-3xl md:text-4xl lg:text-5xl">STAR</span>
            </div>
          </div>

          {/* Right Text: Rewards info */}
          <div className="flex flex-col items-center text-center">
            <p className="text-pink-400 font-black text-base md:text-md lg:text-xl mb-0.5">
              POST.SHINE.WIN.
            </p>
            <Link
              to="/news"
              className="flex flex-col bg-pink-400 px-5 py-1 rounded-full hover:bg-pink-500 hover:px-5.5 hover:py-1.5"
            >
              <span className="text-black font-black text-sm md:text-md lg:text-xl uppercase tracking-wide leading-tight">
                WINS AWARDS &
              </span>
              <span className="text-black font-black text-sm md:text-md lg:text-xl uppercase tracking-wide leading-tight">
                REWARDS UP TO 599K
              </span>
            </Link>
          </div>
        </div>
      </div>

      {/* Ticket Banner */}
      <div className="w-full py-4 mt-2 flex flex-col items-center  justify-center px-4 sm:px-6">
        {/* Ticket Header Title */}
        <div className="text-center mb-4 lg:mb-6 px-4 relative z-20">
          <h2 className="text-xl italic md:text-3xl lg:text-5xl font-black tracking-tighter text-black uppercase pb-2">
            GET YOUR TIKET NOW
          </h2>
          {/* <div className="w-24 md:w-32 h-2 bg-black mx-auto mt-2 rounded-full" /> */}
        </div>
        <Link to="/booking">
          <img
            src="/images/landing/TICKET BOARD ENTRANCE website.png"
            alt="BE A STAR Ticket"
            className="w-full max-w-lg md:max-w-xl lg:max-w-3xl xl:max-w-4xl h-auto object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-500"
          />
        </Link>
      </div>

      <section className="w-full py-4 mt-2 flex flex-col items-center  justify-center px-4 sm:px-6 shadow-sm">
        {/* MERCHANDISE Header Title */}
        <div className="text-center px-4 py-6 lg:mb-6 relative z-20">
          <h2 className="text-xl italic md:text-3xl lg:text-5xl font-black tracking-tighter text-black uppercase pb-2">
            MERCHANDISE SHOP
          </h2>
          {/* <div className="w-24 md:w-32 h-2 bg-black mx-auto mt-2 rounded-full" /> */}
        </div>

        {/*  Grid Section */}
        <section className="w-full bg-white pb-12 md:pb-16 flex justify-center">
          <div className="w-full mx-auto px-4 sm:px-6 md:px-8 max-w-[1600px] flex justify-center ">
            <div className="grid grid-cols-1 sm:grid-cols-3   gap-4 md:gap-6">
              {/* Grid 1
            <Link to="/booking" className="group block relative w-full aspect-[4/5] sm:aspect-square lg:aspect-[4/4] xl:aspect-[4/5]  max-w-[500px] overflow-hidden bg-gray-100 rounded-lg">
              <img src="/images/landing/TICKET FIX.PNG" alt="Booking Tiket" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors duration-300"></div>
              <div className="absolute bottom-6 left-0 w-full text-center z-10 px-4">
                <h3 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tighter drop-shadow-lg mb-2">ON STAGE TIKET</h3>
                <span className="inline-block text-white font-bold uppercase tracking-widest border-b-2 border-white pb-1 drop-shadow-md text-xs md:text-sm">BOOKING SEKARANG</span>
              </div>
            </Link> */}

              {/* Grid 2 */}
              <Link
                to="/glam"
                className="group block relative w-full aspect-[4/4] xl:aspect-[4/5] max-w-[500px] overflow-hidden bg-gray-100 rounded-lg"
              >
                <img
                  src="/images/glam page assets/VISUAL 1.png"
                  alt="Glam Room"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors duration-300"></div>
                <div className="absolute bottom-6 left-0 w-full text-center z-10 px-4">
                  <h3 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tighter drop-shadow-lg mb-2">
                    GLAM ROOM
                  </h3>
                  <span className="inline-block text-white font-bold uppercase tracking-widest border-b-2 border-white pb-1 drop-shadow-md text-xs md:text-sm">
                    LIHAT KOLEKSI
                  </span>
                </div>
              </Link>

              {/* Grid 3 */}
              <Link
                to="/charm-bar"
                className="group block relative w-full aspect-[4/4] xl:aspect-[4/5] max-w-[500px] overflow-hidden bg-gray-100 rounded-lg"
              >
                <img
                  src="/images/Charm Bar assets/CHARM VISUAL 1.png"
                  alt="CharmBar"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors duration-300"></div>
                <div className="absolute bottom-6 left-0 w-full text-center z-10 px-4">
                  <h3 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tighter drop-shadow-lg mb-2">
                    CHARM BAR
                  </h3>
                  <span className="inline-block text-white font-bold uppercase tracking-widest border-b-2 border-white pb-1 drop-shadow-md text-xs md:text-sm">
                    LIHAT KOLEKSI
                  </span>
                </div>
              </Link>

              {/* grid 4 */}
              <Link
                to="/shop"
                className="group block relative w-full aspect-[4/4]  xl:aspect-[4/5] max-w-[500px] overflow-hidden bg-gray-100 rounded-lg"
              >
                <img
                  src="/images/Charm Bar assets/CHARM VISUAL 2.png"
                  alt="Merchandise"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors duration-300"></div>
                <div className="absolute bottom-6 left-0 w-full text-center z-10 px-4">
                  <h3 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tighter drop-shadow-lg mb-2">
                    SPARK CLUB
                  </h3>
                  <span className="inline-block text-white font-bold uppercase tracking-widest border-b-2 border-white pb-1 drop-shadow-md text-xs md:text-sm">
                    LIHAT KOLEKSI
                  </span>
                </div>
              </Link>
            </div>
          </div>
        </section>
      </section>

      {/* Trending Section (Slider) */}
      {/* <section className="w-full bg-white pb-12 md:pb-16">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8">
          {/* Section Header */}
      {/* <div className="flex items-end justify-between mb-6 md:mb-8">
            <h2 className="text-4xl md:text-5xl lg:text-7xl font-black text-black uppercase tracking-tighter leading-none drop-shadow-sm">
              NOW TRENDING
            </h2>
            <Link
              to="/charm-bar"
              className="text-black font-bold uppercase tracking-widest border-b-2 border-black pb-0.5 hover:opacity-70 transition-opacity whitespace-nowrap text-xs md:text-sm mb-1"
            >
              View All
            </Link>
          </div> */}

      {/* Slider Container */}
      {/* <div className="relative -mx-4 px-4 sm:mx-0 sm:px-0 group/slider"> */}
      {/* Manual Navigation Arrows */}
      {/* <button
              type="button"
              onClick={() => scrollTrending("left")}
              className="absolute left-2 md:-left-4 top-1/2 -translate-y-1/2 z-20 bg-white/90 hover:bg-white text-black p-2 md:p-3 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.1)] opacity-0 group-hover/slider:opacity-100 transition-opacity"
            >
              <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
            </button>

            <button
              type="button"
              onClick={() => scrollTrending("right")}
              className="absolute right-2 md:-right-4 top-1/2 -translate-y-1/2 z-20 bg-white/90 hover:bg-white text-black p-2 md:p-3 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.1)] opacity-0 group-hover/slider:opacity-100 transition-opacity"
            >
              <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
            </button>

            <div
              ref={trendingSliderRef}
              className="flex overflow-x-auto snap-x snap-mandatory gap-4 md:gap-6 pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            >
              {trendingProducts.map((product, index) => (
                <div
                  key={`${product.id}-${index}`}
                  className="snap-start shrink-0 w-[65%] sm:w-[45%] md:w-[30%] lg:w-[22%] group relative"
                >
                  <Link
                    to={product.link}
                    className="block relative bg-[#f1f1f1] aspect-[3/4] overflow-hidden group-hover:shadow-xl transition-shadow duration-300"
                  >
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
                        className={`w-5 h-5 transition-colors ${likedProducts[product.id] ? "fill-pink-500 text-pink-500" : "text-black hover:text-pink-500"}`}
                        strokeWidth={1.5}
                      />
                    </button>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div> */}
      {/* </section> */}

      {/* Instagram Feed Section */}
      {/* <section className="w-full bg-white py-16 md:py-24">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 text-center mb-10 md:mb-16">
          <p className="text-xl md:text-2xl font-bold italic tracking-widest mb-4">
            Follow Us On IG
          </p>
          <a
            href="https://instagram.com/Spark_Stage55"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block hover:opacity-80 transition-opacity w-full"
          >
            <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black text-black uppercase tracking-tighter leading-none break-all sm:break-normal px-4">
              @SPARK_STAGE55
            </h2>
          </a>
        </div>

        <div className="w-full mx-auto max-w-[1800px] px-2 md:px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
            {[
              "/images/glam page assets/STAR GLITTER TRANSPARENT BG/AURA POP.png",
              "/images/landing/READY TO BE A STAR.PNG",
              "/images/glam page assets/STAR GLITTER TRANSPARENT BG/PINK RUSH.png",
              "/images/Charm Bar assets/CHARM VISUAL 3.png",
              "/images/glam page assets/STAR GLITTER TRANSPARENT BG/GOLD DRIP.png",
              "/images/landing/neon.png",
              "/images/glam page assets/STAR GLITTER TRANSPARENT BG/SILVER BLINK.png",
              "/images/glam page assets/STAR GLITTER TRANSPARENT BG/MIDNIGHT FX.png",
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
      </section> */}

      {/* News Banner Section */}
      <section
        className="w-full py-16 md:py-24 text-center relative bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/images/glam page assets/VISUAL 5.jpeg')",
        }}
      >
        <div className="absolute inset-0 bg-black/60" />
        <div className="max-w-[1200px] mx-auto px-4 flex flex-col items-center relative z-10">
          <h2 className="text-5xl md:text-6xl lg:text-8xl font-black text-white uppercase tracking-tighter mb-4 md:mb-6 drop-shadow-md">
            LATEST NEWS
          </h2>
          <p className="text-white text-lg md:text-xl lg:text-2xl font-bold italic tracking-widest mb-8 md:mb-12 max-w-2xl px-4">
            Stay up to date with exciting events, backstage passes and exclusive
            charm releases.
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
