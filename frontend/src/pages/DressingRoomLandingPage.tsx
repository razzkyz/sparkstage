import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Heart, ShieldCheck, Zap, ArrowRight, Star } from 'lucide-react';
import { PageTransition } from '../components/PageTransition';
import { HeroCarousel } from '../components/dressing-room/HeroCarousel';
import { ProductImageCarousel } from '../components/dressing-room/ProductImageCarousel';
import { DRESSING_ROOM_DEMO } from '../mock/dressingRoomDemo';
import { useDressingRoomCollection, type DressingRoomLook as DBLook } from '../hooks/useDressingRoomCollection';
import { useProductSummaries, type ProductSummary } from '../hooks/useProducts';
import { useCategories } from '../hooks/useCategories';
import { useAuth } from '../contexts/AuthContext';
import { AppLoadingScreen } from '../app/AppLoadingScreen';
import { formatCurrency } from '../utils/formatters';
import RentalFlowModal from '../components/dressing-room/RentalFlowModal';
import { buildShopCategoryIndex } from './shop/buildShopCategoryIndex';
import { filterShopProducts } from './shop/filterShopProducts';

// Helper to convert ProductSummary to DressingRoomLook for single product rental
function productToLook(product: ProductSummary): DBLook {
  return {
    id: 0, // Temporary ID
    collection_id: 0,
    look_number: 0,
    model_image_url: product.image || '',
    model_name: null,
    sort_order: 0,
    items: [
      {
        id: product.id,
        look_id: 0,
        product_variant_id: product.defaultVariantId || 0,
        label: product.name,
        sort_order: 0,
        resolved_image_url: product.image || null,
        product_variant: {
          id: product.defaultVariantId || 0,
          name: product.defaultVariantName || product.name,
          sku: '',
          price: product.price,
          deposit_amount: null, // Will be calculated as 75% of price
          product: {
            id: product.id,
            name: product.name,
            slug: '',
            image_url: product.image || null,
          },
        },
      },
    ],
  };
}

export default function DressingRoomLandingPage() {
  const { user } = useAuth();
  const { collection, looks: dbLooks, isLoading: looksLoading } = useDressingRoomCollection();
  const { data: allProducts = [], isLoading: productsLoading } = useProductSummaries();
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
  const [selectedLook, setSelectedLook] = useState<DBLook | null>(null);
  const [showRentalModal, setShowRentalModal] = useState(false);
  const activeCategory = 'dressing-room';
  const [activeSubcategory, setActiveSubcategory] = useState<string>('all');
  const [activeSubSubcategory, setActiveSubSubcategory] = useState<string>('all');

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      window.location.href = '/login';
    }
  }, [user]);

  const displayLooks = dbLooks.length > 0 ? dbLooks : [];

  const title = collection?.title || DRESSING_ROOM_DEMO.title;
  const description = collection?.description || DRESSING_ROOM_DEMO.description;

  // Build category index for filtering
  const { parentCategories, childCategoriesByParentSlug, allowedSlugMap } = useMemo(
    () => buildShopCategoryIndex(categories),
    [categories]
  );

  // Get dressing-room category and its subcategories
  const dressingRoomCategory = parentCategories.find(c => c.slug === 'dressing-room');
  const dressingRoomSubcategories = useMemo(() => {
    if (!dressingRoomCategory) return [];
    return childCategoriesByParentSlug.get(dressingRoomCategory.slug) ?? [];
  }, [dressingRoomCategory, childCategoriesByParentSlug]);

  // Get sub-subcategories for the active subcategory
  const activeSubSubcategories = useMemo(() => {
    if (activeSubcategory === 'all') return [];
    return childCategoriesByParentSlug.get(activeSubcategory) ?? [];
  }, [activeSubcategory, childCategoriesByParentSlug]);

  // Filter products based on selected category/subcategory
  const filteredProducts = useMemo(
    () =>
      filterShopProducts({
        products: allProducts,
        activeCategory,
        activeSubcategory,
        activeSubSubcategory,
        searchQuery: '',
        allowedSlugMap,
        bestSellerIds: [],
      }),
    [allProducts, activeCategory, activeSubcategory, activeSubSubcategory, allowedSlugMap]
  );

  // Collect all model images from looks for carousel
  const carouselImages = displayLooks
    .map((look) => look.model_image_url)
    .filter((url) => url && typeof url === 'string');


  if (looksLoading || productsLoading || categoriesLoading) {
    return <AppLoadingScreen />;
  }

  return (
    <PageTransition>
      <div className="bg-white">
        {/* Hero Carousel Section */}
        {carouselImages.length > 0 && (
          <HeroCarousel images={carouselImages} />
        )}

        {/* Hero Section - Enhanced */}
        <section className="relative bg-linear-to-b from-[#f6dbe6] to-white border-b border-gray-300 overflow-hidden">
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-20 right-10 w-64 h-64 bg-main-200 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-10 w-96 h-96 bg-pink-100 rounded-full blur-3xl"></div>
          </div>

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 md:py-24">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-3xl"
            >
              <div className="inline-block mb-4 px-3 py-1 bg-main-100 text-main-700 rounded-full text-xs font-bold uppercase tracking-widest">
                ✨ Sewa Baju Impianmu
              </div>
              <h1 className="text-5xl md:text-7xl font-black tracking-tight text-black leading-tight">
                {title}
              </h1>
              <p className="mt-6 text-base md:text-lg text-gray-700 max-w-2xl leading-relaxed italic">
                {description}
              </p>
              
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => document.querySelector('[data-scroll-to="looks"]')?.scrollIntoView({ behavior: 'smooth' })}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-main-500 text-white font-bold uppercase tracking-wider hover:bg-main-600 transition-colors text-sm sm:text-base rounded-lg"
                >
                  Lihat Koleksi <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 border-2 border-gray-900 text-gray-900 font-bold uppercase tracking-wider hover:bg-gray-100 transition-colors text-sm sm:text-base rounded-lg"
                >
                  Pelajari Lebih <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Trust badges */}
              <div className="mt-8 flex flex-wrap gap-4 text-xs sm:text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <ShieldCheck className="w-4 h-4 text-green-500" />
                  Pembayaran Aman
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Proses Mudah
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Heart className="w-4 h-4 text-red-500" />
                  +1000 Customer
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="bg-white border-b border-gray-300 py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-gray-500 sm:text-xs">
                Mudah & Cepat
              </p>
              <h2 className="mt-4 font-serif text-4xl italic text-gray-900 sm:text-5xl">
                Cara Kerja Rental
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 sm:gap-8">
              {[
                { number: '1', title: 'Pilih Look', desc: 'Browse koleksi dan pilih look favorit Anda' },
                { number: '2', title: 'Tentukan Durasi', desc: 'Pilih berapa hari Anda ingin menyewa (1-7 hari)' },
                { number: '3', title: 'Isi Data', desc: 'Lengkapi data pribadi dan rekening bank Anda' },
                { number: '4', title: 'Bayar & Terima', desc: 'Bayar dan tunggu barang sampai ke alamat' },
              ].map((step, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  viewport={{ once: true }}
                  className="relative text-center"
                >
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-main-100 text-main-600 font-black text-xl mb-4">
                    {step.number}
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2 text-lg">{step.title}</h3>
                  <p className="text-sm text-gray-600">{step.desc}</p>

                  {idx < 3 && (
                    <div className="hidden md:flex absolute top-8 -right-4 text-main-300">
                      <ArrowRight className="w-6 h-6" />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="bg-gray-50 border-b border-gray-300 py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-gray-500 sm:text-xs">
                Keuntungan
              </p>
              <h2 className="mt-4 font-serif text-4xl italic text-gray-900 sm:text-5xl">
                Mengapa Pilih Kami?
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: <Zap className="w-6 h-6" />,
                  title: 'Hemat Biaya',
                  desc: 'Sewa jauh lebih murah dibanding membeli. Bayar hanya untuk waktu yang Anda gunakan.',
                },
                {
                  icon: <CheckCircle2 className="w-6 h-6" />,
                  title: 'Kualitas Terjamin',
                  desc: 'Setiap item sudah dicek kondisinya. Asuransi damage protection tersedia.',
                },
                {
                  icon: <Heart className="w-6 h-6" />,
                  title: 'Berbagai Pilihan',
                  desc: '1000+ item terbaru dalam koleksi kami. Update setiap minggu dengan trends terkini.',
                },
                {
                  icon: <ShieldCheck className="w-6 h-6" />,
                  title: 'Deposit Aman',
                  desc: 'Deposit dikembalikan penuh jika tidak ada kerusakan. Proses cepat tanpa ribet.',
                },
                {
                  icon: <Zap className="w-6 h-6" />,
                  title: 'Pengiriman Cepat',
                  desc: 'Kirim ke seluruh Indonesia. Proses 1-2 hari kerja setelah pembayaran.',
                },
                {
                  icon: <Star className="w-6 h-6" />,
                  title: 'Customer Support 24/7',
                  desc: 'Tim kami siap membantu melalui chat, email, dan WhatsApp kapan saja.',
                },
              ].map((feature, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ delay: idx * 0.1 }}
                  viewport={{ once: true }}
                  className="p-6 bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-shadow"
                >
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-main-100 text-main-600 mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-600">{feature.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Info Section */}
        <section className="bg-white border-b border-gray-300 py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-gray-500 sm:text-xs">
                Transparansi Harga
              </p>
              <h2 className="mt-4 font-serif text-4xl italic text-gray-900 sm:text-5xl">
                Cara Perhitungan Biaya
              </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Left - Example */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="bg-linear-to-br from-main-50 to-pink-50 rounded-2xl p-8 border border-main-200"
              >
                <h3 className="font-bold text-lg text-gray-900 mb-6">Contoh Perhitungan</h3>
                
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between items-start pb-3 border-b border-main-200">
                    <div>
                      <p className="font-semibold text-gray-900">Baju A</p>
                      <p className="text-sm text-gray-600">Sewa: 50.000/hari × 3 hari</p>
                    </div>
                    <p className="font-bold text-gray-900">Rp 150.000</p>
                  </div>

                  <div className="flex justify-between items-start pb-3 border-b border-main-200">
                    <div>
                      <p className="font-semibold text-gray-900">Deposit (75%)</p>
                      <p className="text-sm text-gray-600">Jaminan kondisi barang</p>
                    </div>
                    <p className="font-bold text-yellow-700">Rp 112.500</p>
                  </div>

                  <div className="flex justify-between items-start pt-3">
                    <p className="font-black text-gray-900">TOTAL</p>
                    <p className="text-2xl font-black text-main-600">Rp 262.500</p>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-3 text-xs text-gray-600 space-y-1">
                  <p>📝 Deposit dikembalikan saat pengembalian jika:</p>
                  <ul className="list-disc list-inside space-y-1 text-gray-600">
                    <li>Tidak ada noda atau kerusakan</li>
                    <li>Kembali tepat waktu</li>
                    <li>Semua aksesoris lengkap</li>
                  </ul>
                </div>
              </motion.div>

              {/* Right - Rules */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="space-y-4"
              >
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-bold text-blue-900 text-sm mb-2">💡 Durasi Sewa</h4>
                  <p className="text-sm text-blue-800">Mulai dihitung sejak pembayaran selesai, jam yang sama. Contoh: bayar jam 10.00 → kembali besok jam 10.00 untuk 1 hari sewa.</p>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-bold text-yellow-900 text-sm mb-2">⚠️ Keterlambatan</h4>
                  <p className="text-sm text-yellow-800">Telat Rp 5.000/jam. Contoh: kembali 2 jam telat = Rp 10.000 dari deposit.</p>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-bold text-red-900 text-sm mb-2">🚨 Kerusakan</h4>
                  <ul className="text-sm text-red-800 space-y-1">
                    <li>• Noda kecil: -Rp 10.000</li>
                    <li>• Kancing copot: -Rp 10.000</li>
                    <li>• Rusak parah: Deposit hangus</li>
                    <li>• Jika kerusakan {'>'} deposit → bayar selisih</li>
                  </ul>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-bold text-green-900 text-sm mb-2">✅ Pengalaman Lancar</h4>
                  <p className="text-sm text-green-800">Lihat item dengan baik sebelum menerima. Foto kondisi awal jika perlu sebagai bukti. Hubungi support jika ada pertanyaan!</p>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Looks Grid Section */}
        <section className="bg-gray-50 border-b border-gray-300 py-16 sm:py-24" data-scroll-to="looks">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center text-center mb-12">
              <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-gray-500 sm:text-xs">
                Koleksi Kami
              </p>
              <h2 className="mt-4 font-serif text-4xl italic text-gray-900 sm:text-5xl">
                Pilih Produk Favoritmu
              </h2>
              <p className="mt-4 text-gray-600 max-w-2xl">
                Ribuan koleksi fashion pilihan tersedia untuk disewa. Dari dress, jeans, outer, hingga aksesoris - semua ada di sini!
              </p>
            </div>

            {/* Category Navigation */}
            <div className="mb-8 border-b border-gray-100 pb-0 sticky top-0 bg-gray-50 z-40 pt-4 -mt-6">
              <div className="flex flex-col space-y-4">
                {/* Subcategories */}
                {dressingRoomSubcategories.length > 0 ? (
                  <div className="w-full justify-center md:justify-start flex overflow-x-auto hide-scrollbar pb-2 px-2">
                    <div className="flex gap-1.5 md:gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveSubcategory('all');
                          setActiveSubSubcategory('all');
                        }}
                        className={`px-3 md:px-5 py-2 rounded-full text-xs font-semibold whitespace-nowrap border transition-colors ${
                          activeSubcategory === 'all'
                            ? 'bg-main-500 text-white border-main-500 shadow-sm'
                            : 'bg-white text-gray-500 border-gray-200 hover:border-main-500 hover:text-main-500'
                        }`}
                      >
                        Semua
                      </button>
                      {dressingRoomSubcategories.map((subcategory) => (
                        <button
                          key={subcategory.slug}
                          type="button"
                          onClick={() => {
                            setActiveSubcategory(subcategory.slug);
                            setActiveSubSubcategory('all');
                          }}
                          className={`px-3 md:px-5 py-2 rounded-full text-xs font-semibold whitespace-nowrap border transition-colors ${
                            activeSubcategory === subcategory.slug
                              ? 'bg-main-500 text-white border-main-500 shadow-sm'
                              : 'bg-white text-gray-500 border-gray-200 hover:border-main-500 hover:text-main-500'
                          }`}
                        >
                          {subcategory.name}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                {/* Sub-subcategories */}
                {activeSubcategory !== 'all' && activeSubSubcategories.length > 0 ? (
                  <div className="w-full justify-center md:justify-start flex overflow-x-auto hide-scrollbar pb-3 px-2">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveSubSubcategory('all')}
                        className={`px-4 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap border transition-colors ${
                          activeSubSubcategory === 'all'
                            ? 'bg-main-500/10 text-main-500 border-main-500/30'
                            : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-main-500/50 hover:text-main-500'
                        }`}
                      >
                        Semua {dressingRoomSubcategories.find(s => s.slug === activeSubcategory)?.name || ''}
                      </button>
                      {activeSubSubcategories.map((subcategory) => (
                        <button
                          key={subcategory.slug}
                          type="button"
                          onClick={() => setActiveSubSubcategory(subcategory.slug)}
                          className={`px-4 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap border transition-colors ${
                            activeSubSubcategory === subcategory.slug
                              ? 'bg-main-500/10 text-main-500 border-main-500/30'
                              : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-main-500/50 hover:text-main-500'
                          }`}
                        >
                          {subcategory.name}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">Tidak ada produk dressing room yang tersedia saat ini.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {filteredProducts.map((product, idx) => (
                  <motion.div
                    key={product.id}
                    className="group cursor-pointer text-left"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    viewport={{ once: true }}
                    onClick={() => {
                      setSelectedLook(productToLook(product));
                      setShowRentalModal(true);
                    }}
                  >
                    <div className="rounded-xl border-2 border-gray-100 bg-white overflow-hidden duration-300 hover:border-main-500 hover:shadow-lg hover:shadow-pink-100 transition-all">
                      <div className="relative overflow-hidden aspect-square bg-gray-50 group">
                        <ProductImageCarousel
                          images={product.images}
                          primaryImage={product.image}
                          productName={product.name}
                          onError={(event) => {
                            event.currentTarget.src = '/images/landing/neon.png';
                          }}
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300" />
                      </div>
                      <div className="p-3 sm:p-4">
                        <h3 className="text-sm sm:text-base font-bold text-gray-900 line-clamp-2 h-9">
                          {product.name}
                        </h3>
                        <p className="mt-2 text-sm font-bold text-main-600">
                          {formatCurrency(product.price)}/hari
                        </p>
                        <div className="mt-3 flex items-center gap-1 text-main-600 font-bold text-xs uppercase opacity-0 group-hover:opacity-100 transition-opacity">
                          Sewa <ArrowRight className="w-3 h-3" />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* FAQ Section */}
        <section className="bg-white border-b border-gray-300 py-16 sm:py-24">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-gray-500 sm:text-xs">
                Pertanyaan Umum
              </p>
              <h2 className="mt-4 font-serif text-4xl italic text-gray-900 sm:text-5xl">
                FAQ
              </h2>
            </div>

            <div className="space-y-3">
              {[
                {
                  q: 'Apakah baju sudah dicuci sebelum diterima?',
                  a: 'Ya, semua item sudah dicuci dan diseterika. Kami memastikan Anda mendapat baju dalam kondisi bersih dan siap pakai.',
                },
                {
                  q: 'Bagaimana jika baju rusak saat saya gunakan?',
                  a: 'Deposit Anda akan dikurangi sesuai tingkat kerusakan. Kerusakan kecil dipotong Rp 10.000, kerusakan parah maka deposit hangus penuh.',
                },
                {
                  q: 'Bisa perpanjang durasi sewa?',
                  a: 'Tentu! Hubungi customer service kami minimal H-1 sebelum tanggal pengembalian. Biaya akan dihitung dan dikirim invoice tambahan.',
                },
                {
                  q: 'Berapa biaya pengiriman?',
                  a: 'Gratis pengiriman ke seluruh Indonesia untuk pembelian minimal Rp 200.000. Untuk di bawah itu, biaya pengiriman sesuai lokasi.',
                },
                {
                  q: 'Apakah ada asuransi kerusakan?',
                  a: 'Deposit berfungsi sebagai asuransi. Selain itu, kami juga menerima custom insurance untuk tambahan perlindungan jika dibutuhkan.',
                },
              ].map((faq, idx) => (
                <FAQItem key={idx} question={faq.q} answer={faq.a} />
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-linear-to-r from-main-600 to-pink-600 py-16 sm:py-24">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl sm:text-5xl font-black text-white mb-4">
                Siap Sewa Baju Impianmu?
              </h2>
              <p className="text-white/90 text-lg mb-8 max-w-2xl mx-auto">
                Jangan lewatkan kesempatan untuk terlihat menakjubkan dengan harga yang terjangkau. Pilih look favorit Anda sekarang!
              </p>
              <button
                type="button"
                onClick={() => document.querySelector('[data-scroll-to="looks"]')?.scrollIntoView({ behavior: 'smooth' })}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-main-600 font-bold uppercase tracking-wider hover:bg-gray-100 transition-colors text-sm sm:text-base rounded-lg"
              >
                Lihat Koleksi Lengkap <ArrowRight className="w-5 h-5" />
              </button>
            </motion.div>
          </div>
        </section>

        {/* Rental Flow Modal */}
        {selectedLook && (
          <RentalFlowModal
            look={selectedLook}
            isOpen={showRentalModal}
            onClose={() => setShowRentalModal(false)}
          />
        )}
      </div>
    </PageTransition>
  );
}

// FAQ Item Component
function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div
      className="border border-gray-200 rounded-lg overflow-hidden"
      initial={false}
    >
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-start justify-between hover:bg-gray-50 transition-colors text-left"
      >
        <span className="font-bold text-gray-900 pr-4">{question}</span>
        <span className={`text-main-500 font-bold shrink-0 transition-transform ${isOpen ? 'rotate-45' : ''}` }>
          +
        </span>
      </button>
      
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
        transition={{ duration: 0.2 }}
        className="overflow-hidden"
      >
        <div className="px-6 py-4 bg-gray-50 text-gray-600 border-t border-gray-200 text-sm leading-relaxed">
          {answer}
        </div>
      </motion.div>
    </motion.div>
  );
}


