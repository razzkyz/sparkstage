import { PageTransition } from "../components/PageTransition";
import useSeo from "../hooks/useSeo";

export default function RollerbladePage() {
  useSeo({
    title: "Rollerblade - SparkStage",
    description: "Temukan koleksi rollerblade terbaik di SparkStage",
  });

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
        {/* Hero Section */}
        <section className="relative h-[60vh] min-h-[400px] flex items-center justify-center overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage:
                "linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url('/images/rollerblade-hero.jpg')",
            }}
          />
          <div className="relative z-10 text-center text-white px-4">
            <h1 className="text-5xl md:text-7xl font-black mb-4 tracking-tight">
              ROLLERBLADE
            </h1>
            <p className="text-xl md:text-2xl font-light max-w-2xl mx-auto">
              Nikmati pengalaman bermain rollerblade yang seru dan menyenangkan
            </p>
          </div>
        </section>

        {/* Content Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Bermain Rollerblade di SparkStage
              </h2>
              <p className="text-lg text-gray-600 mb-4">
                SparkStage menyediakan arena rollerblade yang aman dan nyaman untuk
                semua kalangan. Dengan peralatan berkualitas tinggi dan instruktur
                berpengalaman, kami siap memberikan pengalaman bermain yang tak
                terlupakan.
              </p>
              <p className="text-lg text-gray-600 mb-6">
                Baik pemula maupun yang sudah mahir, semua bisa menikmati keseruan
                bermain rollerblade bersama teman dan keluarga.
              </p>
              <div className="flex flex-wrap gap-4">
                <button className="px-8 py-4 bg-gradient-to-r from-pink-600 to-rose-600 text-white font-bold rounded-xl hover:shadow-xl hover:scale-105 transition-all duration-300">
                  Booking Sekarang
                </button>
                <button className="px-8 py-4 bg-white border-2 border-pink-600 text-pink-600 font-bold rounded-xl hover:bg-pink-50 transition-all duration-300">
                  Lihat Harga
                </button>
              </div>
            </div>
            <div className="relative h-[400px] rounded-2xl overflow-hidden shadow-2xl">
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage: "url('/images/rollerblade-arena.jpg')",
                }}
              />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="bg-gradient-to-b from-pink-50 to-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">
              Kenapa Memilih SparkStage?
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300">
                <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-rose-500 rounded-full flex items-center justify-center mb-6 mx-auto">
                  <span className="text-3xl">🛼</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">
                  Peralatan Berkualitas
                </h3>
                <p className="text-gray-600 text-center">
                  Kami menyediakan rollerblade dan pelindung berkualitas tinggi untuk
                  kenyamanan dan keamanan Anda.
                </p>
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300">
                <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-rose-500 rounded-full flex items-center justify-center mb-6 mx-auto">
                  <span className="text-3xl">👨‍🏫</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">
                  Instruktur Profesional
                </h3>
                <p className="text-gray-600 text-center">
                  Belajar dari instruktur berpengalaman yang siap membimbing dari level
                  pemula hingga mahir.
                </p>
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300">
                <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-rose-500 rounded-full flex items-center justify-center mb-6 mx-auto">
                  <span className="text-3xl">🏟️</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">
                  Arena Luas & Aman
                </h3>
                <p className="text-gray-600 text-center">
                  Arena luas dengan permukaan yang aman dan nyaman untuk bermain
                  rollerblade sepuasnya.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gradient-to-r from-pink-600 to-rose-600 py-16">
          <div className="max-w-4xl mx-auto text-center px-4">
            <h2 className="text-4xl font-bold text-white mb-6">
              Siap Mencoba Rollerblade?
            </h2>
            <p className="text-xl text-white/90 mb-8">
              Booking sekarang dan dapatkan pengalaman bermain rollerblade yang seru!
            </p>
            <button className="px-10 py-4 bg-white text-pink-600 font-bold rounded-xl hover:shadow-2xl hover:scale-105 transition-all duration-300">
              Booking Sekarang
            </button>
          </div>
        </section>
      </div>
    </PageTransition>
  );
}
