import { PageTransition } from "../components/PageTransition";
import useSeo from "../hooks/useSeo";
import { useState } from "react";
import { useRollerbladeSettings, DEFAULT_ROLLERBLADE_PAGE_SETTINGS } from "../hooks/useRollerbladeSettings";

export default function RollerbladePage() {
  const [expandedFeature, setExpandedFeature] = useState<number | null>(null);
  const { settings, isLoading } = useRollerbladeSettings();

  // Use CMS data or fallback to defaults
  const pageData = settings || DEFAULT_ROLLERBLADE_PAGE_SETTINGS;

  useSeo({
    title: "Rollerblade - SparkStage",
    description: pageData.hero_subtitle || "Temukan pengalaman rollerblade terbaik di SparkStage",
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
                <div key={i} className="h-48 bg-gray-200 animate-pulse rounded-2xl" />
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
          <div className="relative w-full h-[50vh] sm:h-[60vh] md:h-[70vh] lg:h-[80vh] min-h-[400px] max-h-[900px]">
            <img
              src={pageData.hero_image_url || '/images/rollerblade-hero.jpg'}
              alt={pageData.hero_title || 'Rollerblade'}
              className="absolute inset-0 w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-black/60 sm:from-black/20 sm:via-black/30 sm:to-black/50" />
            <div className="relative z-10 h-full flex items-center justify-center px-4 sm:px-6 lg:px-8">
              <div className="text-center text-white max-w-5xl mx-auto">
                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black mb-3 sm:mb-4 md:mb-6 tracking-tight leading-tight drop-shadow-2xl">
                  {pageData.hero_title || 'ROLLERBLADE ARENA'}
                </h1>
                <p className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-light leading-relaxed px-2 sm:px-4 max-w-3xl mx-auto drop-shadow-lg">
                  {pageData.hero_subtitle || 'Nikmati pengalaman bermain rollerblade yang seru'}
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
              Arena rollerblade dengan fasilitas lengkap dan nyaman untuk semua kalangan
            </p>
          </div>

          {pageData.features && pageData.features.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-6">
              {pageData.features.map((feature) => {
                const isExpanded = expandedFeature === feature.id;
                return (
                  <div
                    key={feature.id}
                    className="bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-pink-100"
                    onClick={() => setExpandedFeature(isExpanded ? null : feature.id)}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 bg-pink-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <span className="text-4xl">{feature.icon || '✨'}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-xl font-bold text-gray-900">{feature.title || 'Feature'}</h3>
                          <svg className={`w-5 h-5 text-pink-500 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                        <p className="text-gray-600 text-sm leading-relaxed mb-3">{feature.description || ''}</p>
                        {feature.details && feature.details.length > 0 && (
                          <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}>
                            <div className="pt-3 border-t border-gray-100">
                              <ul className="space-y-2">
                                {feature.details.map((detail, idx) => (
                                  <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                                    <span className="text-pink-500 mt-1 flex-shrink-0">✓</span>
                                    <span>{detail}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        )}
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
            <p className="text-sm text-gray-500 italic">💡 Klik pada setiap kartu untuk melihat detail lebih lanjut</p>
          </div>
        </section>

        {/* Gallery Grid */}
        <section className="bg-gradient-to-b from-gray-50 to-white py-16 sm:py-20 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-4 sm:mb-6">Galeri Foto</h2>
              <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">Lihat keseruan bermain rollerblade di SparkStage Arena</p>
            </div>

            {pageData.gallery_items && pageData.gallery_items.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                {pageData.gallery_items.map((item) => (
                  <div key={item.id} className="group relative overflow-hidden rounded-xl md:rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500">
                    <div className="relative w-full" style={{ paddingBottom: '66.67%' }}>
                      <img 
                        src={item.image || '/images/placeholder-gallery.jpg'} 
                        alt={item.caption || 'Gallery'} 
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-60 group-hover:opacity-95 transition-opacity duration-500" />
                      <div className="absolute inset-x-0 bottom-0 p-4 md:p-6">
                        <div className="transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                          <span className="inline-block px-2.5 md:px-3 py-1 bg-pink-500/90 backdrop-blur-sm text-white text-xs md:text-sm font-semibold rounded-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                            {item.category === 'venue' && '🏟️ Venue'}
                            {item.category === 'equipment' && '🛼 Equipment'}
                            {item.category === 'activity' && '⚡ Activity'}
                          </span>
                          <p className="text-white font-bold text-sm md:text-base lg:text-lg leading-tight drop-shadow-lg">{item.caption || 'Gallery Item'}</p>
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
          <div className="relative w-full py-16 sm:py-20 md:py-24 lg:py-32 min-h-[400px]">
            <img 
              src={pageData.cta_image_url || '/images/rollerblade-cta.jpg'} 
              alt={pageData.cta_title || 'CTA'} 
              className="absolute inset-0 w-full h-full object-cover object-center" 
            />
            <div className="absolute inset-0 bg-gradient-to-br from-gray-900/85 via-gray-800/80 to-gray-900/85" />
            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center">
                <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 sm:mb-6 leading-tight px-2">
                  {pageData.cta_title || 'Siap untuk Pengalaman Rollerblade Seru?'}
                </h2>
                <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-white/90 leading-relaxed px-4 max-w-3xl mx-auto">
                  {pageData.cta_subtitle || 'Datang langsung ke SparkStage Arena'}
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </PageTransition>
  );
}
