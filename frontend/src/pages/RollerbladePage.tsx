import { PageTransition } from "../components/PageTransition";
import useSeo from "../hooks/useSeo";
import { useState } from "react";
import {
  useRollerbladeSettings,
  DEFAULT_ROLLERBLADE_PAGE_SETTINGS,
} from "../hooks/useRollerbladeSettings";

export default function RollerbladePage() {
  const [expandedFeature, setExpandedFeature] = useState<number | null>(null);
  const { settings, isLoading } = useRollerbladeSettings();

  // Use CMS data or fallback to defaults
  const pageData = settings || DEFAULT_ROLLERBLADE_PAGE_SETTINGS;

  useSeo({
    title: "Rollerblade - SparkStage",
    description:
      pageData.hero_subtitle ||
      "Temukan pengalaman rollerblade terbaik di SparkStage",
  });

  // Loading skeleton
  if (isLoading && !settings) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-white">
          <div className="relative w-full h-[50vh] bg-gray-200 animate-pulse" />
          <section className="max-w-7xl mx-auto px-4 py-16">
            <div className="h-8 w-64 bg-gray-200 animate-pulse rounded mb-4 mx-auto" />
            <div className="h-4 w-96 bg-gray-200 animate-pulse rounded mb-12 mx-auto" />
            <div className="grid md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-48 bg-gray-200 animate-pulse rounded-2xl"
                />
              ))}
            </div>
          </section>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-white">
        {/* Hero Banner */}
        <section className="relative w-full overflow-hidden bg-gray-900">
          {/* Mobile/tablet: 16:9 aspect ratio to prevent image distortion. Desktop: vh-based height (unchanged) */}
          <div className="relative w-full aspect-video md:aspect-auto md:h-[70vh] lg:h-[80vh] md:min-h-[400px] md:max-h-[900px]">
            <img
              src={pageData.hero_image_url || "/images/rollerblade-hero.jpg"}
              alt={pageData.hero_title || "Rollerblade"}
              className="absolute inset-0 w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-black/60 sm:from-black/20 sm:via-black/30 sm:to-black/50" />
            <div className="relative z-10 h-full flex items-center justify-center px-4 sm:px-6 lg:px-8">
              <div className="text-center text-white max-w-5xl mx-auto">
                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black mb-3 sm:mb-4 md:mb-6 tracking-tight leading-tight drop-shadow-2xl">
                  {pageData.hero_title || "ROLLERBLADE ARENA"}
                </h1>
                <p className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-light leading-relaxed px-2 sm:px-4 max-w-3xl mx-auto drop-shadow-lg">
                  {pageData.hero_subtitle ||
                    "Nikmati pengalaman bermain rollerblade yang seru"}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Kenapa Rollerblade di SparkStage?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Arena rollerblade dengan fasilitas lengkap dan nyaman untuk semua
              kalangan
            </p>
          </div>

          {pageData.features && pageData.features.length > 0 ? (
            <div className="grid sm:grid-cols-2  gap-4 md:gap-6">
              {pageData.features.map((feature) => {
                const isExpanded = expandedFeature === feature.id;
                return (
                  <div
                    key={feature.id}
                    className="group relative rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer h-72 md:h-86 xl:h-96"
                    onClick={() =>
                      setExpandedFeature(isExpanded ? null : feature.id)
                    }
                  >
                    {/* Background Image - Now using feature.image from database */}
                    <div className="absolute inset-0 w-full h-full">
                      <img
                        src={
                          feature.image ||
                          "/images/rollerblade-feature-default.jpg"
                        }
                        alt={feature.title || "Feature"}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      {/* Gradient Overlay - Light gradient for title readability, darker on hover/expand */}
                      <div
                        className={`absolute inset-0 bg-gradient-to-b transition-all duration-500 ${
                          isExpanded
                            ? "from-black/90 via-black/75 to-black/90"
                            : "from-black/50 via-transparent to-transparent md:from-black/40 md:opacity-0 md:group-hover:opacity-100 md:group-hover:from-black/90 md:group-hover:via-black/75 md:group-hover:to-black/90"
                        }`}
                      />
                    </div>

                    {/* Content Container */}
                    <div className="relative z-10 h-full flex flex-col p-4 md:p-5">
                      {/* Title - Always Visible at Top */}
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-lg md:text-xl font-bold text-white drop-shadow-lg leading-tight flex-1">
                          {feature.title || "Feature"}
                        </h3>

                        {/* Mobile Tap Indicator - Only on mobile, only when NOT expanded */}
                        <div
                          className={`md:hidden ml-2 ${isExpanded ? "hidden" : "block"}`}
                        >
                          <div className="w-7 h-7 flex items-center justify-center bg-white/20 backdrop-blur-sm rounded-full animate-bounce flex-shrink-0">
                            <svg
                              className="w-4 h-4 text-white"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 9l-7 7-7-7"
                              />
                            </svg>
                          </div>
                        </div>
                      </div>

                      {/* Description & Details - Scrollable Content */}
                      <div
                        className={`
                        flex-1 overflow-hidden transition-all duration-500
                        md:max-h-0 md:opacity-0 md:group-hover:max-h-full md:group-hover:opacity-100
                        ${isExpanded ? "max-h-full opacity-100" : "max-h-0 opacity-0 md:max-h-0 md:opacity-0"}
                      `}
                      >
                        <div className="h-full overflow-y-auto pr-2 custom-scrollbar">
                          <p className="text-white/90 text-xs md:text-sm leading-relaxed mb-3 drop-shadow-md">
                            {feature.description || ""}
                          </p>
                          {feature.details && feature.details.length > 0 && (
                            <div className="space-y-1.5">
                              {feature.details.map((detail, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-start gap-1.5"
                                >
                                  <span className="text-pink-400 mt-0.5 flex-shrink-0 font-bold text-sm">
                                    ✓
                                  </span>
                                  <span className="text-white/85 text-xs md:text-sm">
                                    {detail}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p>No features available yet.</p>
            </div>
          )}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500 italic">
              <span className="md:hidden">
                💡 Tap pada setiap box untuk melihat detail lebih lanjut
              </span>
              <span className="hidden md:inline">
                💡 Hover pada setiap box untuk melihat detail lebih lanjut
              </span>
            </p>
          </div>
        </section>

        {/* Gallery Grid */}
        <section className="bg-gradient-to-b from-gray-50 to-white py-16 sm:py-20 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-4 sm:mb-6">
                Galeri Foto
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
                Lihat keseruan bermain rollerblade di SparkStage Arena
              </p>
            </div>

            {pageData.gallery_items && pageData.gallery_items.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                {pageData.gallery_items.map((item) => (
                  <div
                    key={item.id}
                    className="group relative overflow-hidden rounded-xl md:rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500"
                  >
                    <div
                      className="relative w-full"
                      style={{ paddingBottom: "66.67%" }}
                    >
                      <img
                        src={item.image || "/images/placeholder-gallery.jpg"}
                        alt={item.caption || "Gallery"}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-60 group-hover:opacity-95 transition-opacity duration-500" />
                      <div className="absolute inset-x-0 bottom-0 p-4 md:p-6">
                        <div className="transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                          <p className="text-white font-bold text-sm md:text-base lg:text-lg leading-tight drop-shadow-lg">
                            {item.caption || "Gallery Item"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <p>No gallery items available yet.</p>
              </div>
            )}
          </div>
        </section>

        {/* CTA Banner */}
        <section className="relative w-full overflow-hidden bg-gray-900">
          {/* Fixed 16:6 aspect ratio across all screen sizes */}
          <div className="relative w-full h-72 md:h-86 xl:h-96  flex items-center justify-center">
            <img
              src={pageData.cta_image_url || "/images/rollerblade-cta.jpg"}
              alt={pageData.cta_title || "CTA"}
              className="absolute inset-0 w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-gray-900/85 via-gray-800/80 to-gray-900/85" />
            <div className="relative z-10 flex items-center justify-center w-full h-full px-4 sm:px-6 lg:px-8">
              <div className="text-center w-full max-w-4xl mx-auto">
                <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 sm:mb-6 leading-tight">
                  {pageData.cta_title ||
                    "Siap untuk Pengalaman Rollerblade Seru?"}
                </h2>
                <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-white/90 leading-relaxed max-w-3xl mx-auto">
                  {pageData.cta_subtitle ||
                    "Datang langsung ke SparkStage Arena"}
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </PageTransition>
  );
}
