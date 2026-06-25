import { PageTransition } from "../components/PageTransition";
import useSeo from "../hooks/useSeo";
import { useState } from "react";

// TODO: Akan diintegrasikan dengan CMS untuk konten dinamis
// Saat ini menggunakan data statis sebagai placeholder
/**
 * HERO BANNER IMAGE SPECIFICATIONS FOR CMS
 * 
 * Recommended Image Size (Single Universal Image):
 * - Dimensions: 1920x1080px (16:9 aspect ratio)
 * - Format: JPG or WebP (recommended for better compression)
 * - Max File Size: 500KB (compressed)
 * 
 * Image Guidelines:
 * - Gunakan rasio 16:9 (landscape) untuk kompatibilitas semua device
 * - Pastikan subjek utama berada di TENGAH HORIZONTAL & VERTIKAL
 * - Area aman (safe area): 60% tengah gambar untuk konten penting
 * - Hindari elemen penting di tepi atas/bawah (akan terpotong di mobile)
 * - Hindari teks penting di gambar karena akan tertutup overlay
 * - Gunakan gambar dengan kontras tinggi untuk keterbacaan teks
 * - Test di berbagai ukuran layar sebelum publish
 * 
 * Technical Notes:
 * - Gambar akan otomatis crop menggunakan object-fit: cover
 * - Posisi fokus: center center (bisa disesuaikan jika perlu)
 * - Responsive di semua device tanpa distorsi
 */
const HERO_BANNER = {
  image: "/images/rollerblade-hero.jpg",  // 1920x1080 (16:9) - Universal size
  title: "ROLLERBLADE ARENA",
  subtitle: "Nikmati pengalaman bermain rollerblade yang seru bersama teman dan keluarga",
};

const FEATURES = [
  {
    id: 1,
    icon: "🛼",
    title: "Peralatan Berkualitas",
    description: "Peralatan lengkap dari sepatu rollerblade hingga alat keselamatan untuk semua usia",
    details: [
      "Sepatu rollerblade berbagai ukuran (Kids, Teens, Adult)",
      "Helm keselamatan disesuaikan dengan ukuran kepala",
      "Pelindung lengkap (knee pad, elbow pad, wrist guard)",
      "Peralatan terawat dan dibersihkan secara rutin",
    ],
  },
  {
    id: 2,
    icon: "🏢",
    title: "Arena Indoor Nyaman",
    description: "Ruang bermain dalam gedung yang luas, aman, dan nyaman untuk segala cuaca",
    details: [
      "Area indoor dengan AC untuk kenyamanan maksimal",
      "Lantai khusus anti-slip berkualitas tinggi",
      "Bebas cuaca - main kapan saja tanpa khawatir hujan",
      "Pencahayaan optimal dan sirkulasi udara baik",
    ],
  },
  {
    id: 3,
    icon: "⏰",
    title: "Jam Operasional Fleksibel",
    description: "Sesi bermain yang fleksibel setiap hari, cocok untuk jadwal sibuk Anda",
    details: [
      "Senin - Jumat: 10.00 - 21.00 WIB",
      "Sabtu - Minggu: 09.00 - 22.00 WIB",
      "Sistem booking mudah untuk reservasi sesi",
      "Paket sesi khusus untuk acara grup & keluarga",
    ],
  },
  {
    id: 4,
    icon: "☕",
    title: "Cafe & Ruang Tunggu",
    description: "Area istirahat yang nyaman dengan cafe untuk menikmati makanan dan minuman",
    details: [
      "Cafe dengan menu makanan dan minuman lengkap",
      "Ruang tunggu nyaman untuk keluarga dan teman",
      "Free WiFi untuk yang ingin bekerja sambil menunggu",
      "Area duduk luas dengan view arena rollerblade",
    ],
  },
];

/**
 * CTA BANNER IMAGE SPECIFICATIONS FOR CMS
 * 
 * Recommended Image Size (Single Universal Image):
 * - Dimensions: 1920x1080px (16:9 aspect ratio)
 * - Format: JPG or WebP (recommended for better compression)
 * - Max File Size: 300KB (compressed)
 * 
 * Image Guidelines:
 * - Gunakan rasio 16:9 (landscape) untuk kompatibilitas semua device
 * - Pastikan subjek utama berada di TENGAH untuk visibility optimal
 * - Area aman (safe area): 60% tengah gambar
 * - Gambar bisa lebih gelap karena ada overlay tambahan
 * - Hindari detail penting di tepi karena akan tertutup konten
 * - Kontras menengah OK karena ada dark overlay
 */
const CTA_BANNER = {
  image: "/images/rollerblade-cta.jpg",  // 1920x1080 (16:9) - Universal size
  title: "Siap untuk Pengalaman Rollerblade Seru?",
  subtitle: "Datang langsung ke SparkStage Arena dan nikmati keseruan bermain rollerblade!",
};

/**
 * GALLERY IMAGE SPECIFICATIONS FOR CMS
 * 
 * IMPORTANT - Fixed Aspect Ratio untuk Konsistensi:
 * - Dimensions: 1200x800px (3:2 aspect ratio) - STRICTLY ENFORCED
 * - Format: JPG or WebP (recommended)
 * - Max File Size: 200KB per image (compressed)
 * 
 * Image Guidelines:
 * - WAJIB menggunakan rasio 3:2 (landscape)
 * - Crop gambar ke 1200x800px sebelum upload
 * - Subjek utama di tengah untuk hasil terbaik
 * - High quality & well-lit photos
 * - Variety: mix action shots, venue, people, equipment
 * - Minimum 6 photos (kelipatan 6 untuk grid balance)
 * 
 * Grid Layout:
 * - Mobile: 2 columns (3 rows for 6 photos)
 * - Tablet: 3 columns (2 rows for 6 photos)  
 * - Desktop: 3 columns (2 rows for 6 photos)
 * - All images sama ukuran untuk consistency
 */
const GALLERY_ITEMS = [
  { 
    id: 1, 
    image: "/images/rollerblade-gallery-1.jpg", 
    caption: "Arena Luas & Aman",
    category: "venue"
  },
  { 
    id: 2, 
    image: "/images/rollerblade-gallery-2.jpg", 
    caption: "Peralatan Berkualitas",
    category: "equipment"
  },
  { 
    id: 3, 
    image: "/images/rollerblade-gallery-3.jpg", 
    caption: "Seru Bersama Teman",
    category: "activity"
  },
  { 
    id: 4, 
    image: "/images/rollerblade-gallery-4.jpg", 
    caption: "Pengalaman Tak Terlupakan",
    category: "activity"
  },
  { 
    id: 5, 
    image: "/images/rollerblade-gallery-5.jpg", 
    caption: "Fasilitas Lengkap",
    category: "venue"
  },
  { 
    id: 6, 
    image: "/images/rollerblade-gallery-6.jpg", 
    caption: "Momen Kebersamaan",
    category: "activity"
  },
];

export default function RollerbladePage() {
  const [expandedFeature, setExpandedFeature] = useState<number | null>(null);

  useSeo({
    title: "Rollerblade - SparkStage",
    description: "Temukan koleksi rollerblade terbaik di SparkStage",
  });

  return (
    <PageTransition>
      <div className="min-h-screen bg-white">
        {/* Universal Responsive Hero Banner */}
        <section className="relative w-full overflow-hidden bg-gray-900">
          {/* Responsive Height Container */}
          <div className="relative w-full h-[50vh] sm:h-[60vh] md:h-[70vh] lg:h-[80vh] min-h-[400px] max-h-[900px]">
            
            {/* Universal Background Image - Single image for all devices */}
            <img
              src={HERO_BANNER.image}
              alt={HERO_BANNER.title}
              className="absolute inset-0 w-full h-full object-cover object-center"
            />

            {/* Gradient Overlay - Responsive opacity */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-black/60 sm:from-black/20 sm:via-black/30 sm:to-black/50" />

            {/* Hero Content - Responsive positioning and sizing */}
            <div className="relative z-10 h-full flex items-center justify-center px-4 sm:px-6 lg:px-8">
              <div className="text-center text-white max-w-5xl mx-auto">
                {/* Responsive Title */}
                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black mb-3 sm:mb-4 md:mb-6 tracking-tight leading-tight drop-shadow-2xl">
                  {HERO_BANNER.title}
                </h1>
                
                {/* Responsive Subtitle */}
                <p className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-light leading-relaxed px-2 sm:px-4 max-w-3xl mx-auto drop-shadow-lg">
                  {HERO_BANNER.subtitle}
                </p>
              </div>
            </div>

            {/* Scroll Indicator - Hidden on mobile */}
            <div className="hidden sm:block absolute bottom-6 md:bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
              <div className="flex flex-col items-center gap-2">
                <span className="text-white/75 text-xs font-medium uppercase tracking-wider hidden md:block">
                  Scroll
                </span>
                <svg
                  className="w-5 h-5 md:w-6 md:h-6 text-white/75"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 14l-7 7m0 0l-7-7m7 7V3"
                  />
                </svg>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section - Enhanced with Expandable Details */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Kenapa Rollerblade di SparkStage?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Arena rollerblade dengan fasilitas lengkap dan nyaman untuk semua kalangan
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {FEATURES.map((feature) => {
              const isExpanded = expandedFeature === feature.id;
              
              return (
                <div
                  key={feature.id}
                  className="bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-pink-100"
                  onClick={() => setExpandedFeature(isExpanded ? null : feature.id)}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 bg-pink-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <span className="text-4xl">{feature.icon}</span>
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xl font-bold text-gray-900">
                          {feature.title}
                        </h3>
                        <svg
                          className={`w-5 h-5 text-pink-500 transition-transform duration-300 ${
                            isExpanded ? "rotate-180" : ""
                          }`}
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
                      
                      <p className="text-gray-600 text-sm leading-relaxed mb-3">
                        {feature.description}
                      </p>

                      {/* Expandable Details */}
                      <div
                        className={`overflow-hidden transition-all duration-300 ${
                          isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                        }`}
                      >
                        <div className="pt-3 border-t border-gray-100">
                          <ul className="space-y-2">
                            {feature.details.map((detail, idx) => (
                              <li
                                key={idx}
                                className="flex items-start gap-2 text-sm text-gray-700"
                              >
                                <span className="text-pink-500 mt-1 flex-shrink-0">✓</span>
                                <span>{detail}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500 italic">
              💡 Klik pada setiap kartu untuk melihat detail lebih lanjut
            </p>
          </div>
        </section>

        {/* Enhanced Gallery Grid - Fixed Aspect Ratio */}
        <section className="bg-gradient-to-b from-gray-50 to-white py-16 sm:py-20 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            {/* Section Header */}
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-4 sm:mb-6">
                Galeri Foto
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
                Lihat keseruan bermain rollerblade di SparkStage Arena
              </p>
            </div>

            {/* Balanced Grid - Consistent Aspect Ratio 3:2 */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              {GALLERY_ITEMS.map((item) => (
                <div
                  key={item.id}
                  className="group relative overflow-hidden rounded-xl md:rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500"
                >
                  {/* Fixed Aspect Ratio Container 3:2 */}
                  <div className="relative w-full" style={{ paddingBottom: '66.67%' }}>
                    {/* Image with object-fit contain to prevent stretching */}
                    <img
                      src={item.image}
                      alt={item.caption}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      style={{ objectPosition: 'center' }}
                    />
                    
                    {/* Gradient Overlay - Visible on hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-60 group-hover:opacity-95 transition-opacity duration-500" />

                    {/* Caption - Slides up on hover */}
                    <div className="absolute inset-x-0 bottom-0 p-4 md:p-6">
                      <div className="transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                        {/* Category Badge */}
                        <span className="inline-block px-2.5 md:px-3 py-1 bg-pink-500/90 backdrop-blur-sm text-white text-xs md:text-sm font-semibold rounded-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                          {item.category === 'venue' && '🏟️ Venue'}
                          {item.category === 'equipment' && '🛼 Equipment'}
                          {item.category === 'activity' && '⚡ Activity'}
                        </span>
                        
                        {/* Caption Text */}
                        <p className="text-white font-bold text-sm md:text-base lg:text-lg leading-tight drop-shadow-lg">
                          {item.caption}
                        </p>
                      </div>
                    </div>

                    {/* Zoom Icon - Appears on hover */}
                    <div className="absolute top-3 right-3 md:top-4 md:right-4 opacity-0 group-hover:opacity-100 transition-all duration-500 delay-200">
                      <div className="w-8 h-8 md:w-10 md:h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg">
                        <svg
                          className="w-4 h-4 md:w-5 md:h-5 text-gray-800"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* View More Hint */}
            <div className="text-center mt-10 sm:mt-12 md:mt-16">
              <p className="text-sm sm:text-base text-gray-500 mb-4">
                📸 Hover pada foto untuk melihat detail
              </p>
              <div className="inline-flex items-center gap-2 text-pink-600 font-semibold text-sm sm:text-base hover:gap-3 transition-all duration-300 cursor-pointer">
                <span>Lihat Lebih Banyak Foto</span>
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Banner - Universal Responsive */}
        <section className="relative w-full overflow-hidden bg-gray-900">
          {/* Responsive Height Container */}
          <div className="relative w-full py-16 sm:py-20 md:py-24 lg:py-32 min-h-[400px]">
            
            {/* Universal Background Image */}
            <img
              src={CTA_BANNER.image}
              alt={CTA_BANNER.title}
              className="absolute inset-0 w-full h-full object-cover object-center"
            />
            
            {/* Dark Overlay for readability */}
            <div className="absolute inset-0 bg-gradient-to-br from-gray-900/85 via-gray-800/80 to-gray-900/85" />

            {/* Content Container */}
            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center">
                {/* Responsive Title */}
                <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 sm:mb-6 leading-tight px-2">
                  {CTA_BANNER.title}
                </h2>
                
                {/* Responsive Subtitle */}
                <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-white/90 leading-relaxed px-4 max-w-3xl mx-auto">
                  {CTA_BANNER.subtitle}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CMS Integration Notice (Temporary - untuk developer) */}
        <div className="bg-yellow-50 border-t-4 border-yellow-400 p-4 sm:p-6">
          <div className="max-w-7xl mx-auto px-4">
            <div className="space-y-2">
              <p className="text-sm sm:text-base text-yellow-800">
                <strong>🚧 Developer Note:</strong> Halaman ini siap untuk integrasi CMS.
              </p>
              <div className="text-xs sm:text-sm text-yellow-700 space-y-1">
                <p><strong>4 Section Utama:</strong></p>
                <ul className="list-disc list-inside ml-2 space-y-1">
                  <li><strong>Hero Banner:</strong> 1 gambar universal (1920x1080, 16:9)</li>
                  <li><strong>Features:</strong> Expandable cards dengan detail items</li>
                  <li><strong>Gallery Grid:</strong> 6 foto dengan aspect ratio dinamis</li>
                  <li><strong>CTA Banner:</strong> 1 gambar universal (1920x1080, 16:9) dengan info cards</li>
                </ul>
                <p className="mt-2 italic">✅ Semua menggunakan rasio 16:9 untuk kemudahan CMS</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
