import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import { useCart } from "../contexts/cartStore";
import { useAuth } from "../contexts/AuthContext";

import { formatCurrency } from "../utils/formatters";
import { useProductRetailSummaries } from "../hooks/useProductRetail";
import { useToast } from "../components/Toast";
import { PageTransition } from "../components/PageTransition";
import ProductCardSkeleton from "../components/skeletons/ProductCardSkeleton";
import { AppLoadingScreen } from "../app/AppLoadingScreen";
import { buildImageKitThumbUrl } from "../lib/imagekit";
import type { ProductRetail } from "../types";
import useSeo from "../hooks/useSeo";

const PRODUCTS_PER_PAGE = 20;

type SparkClubResultsProps = {
  filteredProducts: ProductRetail[];
  loading: boolean;
  resetSignal: string;
  onAddToCart: (product: ProductRetail) => void;
};

function SparkClubResults({
  filteredProducts,
  loading,
  resetSignal,
  onAddToCart,
}: SparkClubResultsProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [isAnimating, setIsAnimating] = useState(false);
  const totalProducts = filteredProducts.length;
  const totalPages = Math.max(1, Math.ceil(totalProducts / PRODUCTS_PER_PAGE));
  const page = Math.min(currentPage, totalPages);

  useEffect(() => {
    setCurrentPage(1);
    setIsAnimating(true);
    const timer = setTimeout(() => setIsAnimating(false), 300);
    return () => clearTimeout(timer);
  }, [resetSignal]);

  const paginatedProducts = useMemo(() => {
    const start = (page - 1) * PRODUCTS_PER_PAGE;
    return filteredProducts.slice(start, start + PRODUCTS_PER_PAGE);
  }, [filteredProducts, page]);

  if (loading) {
    const skeletonKeys = Array.from({ length: 10 }, (_, i) => `skeleton-${i}`);
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {skeletonKeys.map((k) => (
          <ProductCardSkeleton key={k} />
        ))}
      </div>
    );
  }

  return (
    <>
      {totalProducts === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-gray-50 px-6 py-10 text-center">
          <p className="text-sm text-gray-500">No products found for this filter.</p>
        </div>
      ) : (
        <div
          className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 transition-opacity duration-300 ${isAnimating ? "opacity-0" : "opacity-100"}`}
        >
          {paginatedProducts.map((product, index) => (
            <Link
              key={product.id}
              to={`/shop/product/${product.id}`}
              className="group cursor-pointer flex flex-col h-full"
              style={{
                animation: isAnimating
                  ? `fadeInUp 0.5s ease-out ${index * 0.05}s both`
                  : "none",
              }}
            >
              <div className="flex flex-col h-full rounded-xl border-2 border-gray-100 bg-white overflow-hidden duration-300 ux-transition-color hover:border-[#ff4b86] hover:shadow-lg hover:shadow-pink-100">
                <div className="relative overflow-hidden aspect-square bg-gray-50 shrink-0">
                  {product.image ? (
                    <img
                      alt={product.name}
                      className="w-full h-full object-cover duration-500 ux-transition-transform ux-motion-safe group-hover:scale-[1.03]"
                      src={buildImageKitThumbUrl(product.image, { width: 480, quality: 60 })}
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-300">
                      <span className="material-symbols-outlined text-5xl">inventory_2</span>
                    </div>
                  )}
                  {product.stock <= 0 && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                      <span className="text-white text-xs font-bold uppercase tracking-widest px-3 py-1 border border-white/50 bg-black/20 backdrop-blur-sm">
                        Out of Stock
                      </span>
                    </div>
                  )}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onAddToCart(product);
                    }}
                    disabled={product.stock <= 0}
                    className="absolute bottom-3 right-3 bg-[#ff4b86] text-white p-2.5 rounded-full opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 shadow-lg hover:bg-[#e63d75] ux-transition-color ux-transition-opacity ux-transition-transform ux-motion-safe disabled:opacity-0 disabled:cursor-not-allowed"
                  >
                    <span className="material-symbols-outlined text-lg">add_shopping_cart</span>
                  </button>
                </div>
                <div className="p-3 flex flex-col flex-grow">
                  <h3 className="font-semibold text-sm text-gray-900 mb-1 line-clamp-1 ux-transition-color group-hover:text-[#ff4b86]">
                    {product.name}
                  </h3>
                  <p className="text-[11px] text-gray-400 mb-2 line-clamp-1 font-light min-h-[16px]">
                    {product.description || "\u00A0"}
                  </p>
                  <div className="flex items-center gap-2 mt-auto">
                    <span className="text-base font-black text-[#ff4b86]">
                      {formatCurrency(product.price)}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {totalProducts > 0 ? (
        <div className="mt-14 flex flex-col items-center gap-4">
          <p className="text-sm text-gray-500">
            Page {page} of {totalPages} ({totalProducts} products)
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.max(1, Math.min(totalPages, prev - 1)))}
              disabled={page <= 1}
              className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 duration-200 ux-transition-color hover:border-[#ff4b86] hover:text-[#ff4b86] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
              Prev
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={page >= totalPages}
              className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 duration-200 ux-transition-color hover:border-[#ff4b86] hover:text-[#ff4b86] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
              Next
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

const SparkClub = () => {
  useSeo({
    title: "Spark Club · Stage 55",
    description: "Discover exclusive Spark Club products at Stage 55.",
    canonical: `${window.location.origin}/spark-club`,
  });

  const { addItem } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [resultsResetSignal, setResultsResetSignal] = useState("init");

  const {
    data: allProducts = [],
    error: productsError,
    isLoading: productsLoading,
  } = useProductRetailSummaries();

  // Filter hanya produk Spark Club dari tabel product_retail
  const products = useMemo(
    () => allProducts.filter((p) => p.retail_category === "sparkclub"),
    [allProducts],
  );

  const loading = productsLoading && allProducts.length === 0;

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    const q = searchQuery.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.description ?? "").toLowerCase().includes(q),
    );
  }, [products, searchQuery]);

  useEffect(() => {
    setResultsResetSignal(`${searchQuery}__${Date.now()}`);
  }, [searchQuery]);

  const handleAddToCart = (product: ProductRetail) => {
    if (!user) {
      showToast("error", "Please login to add items to cart");
      navigate("/login", { state: { from: window.location.pathname } });
      return;
    }
    if (product.stock <= 0) return;

    try {
      addItem(
        {
          productId: product.id,
          productName: product.name,
          productImageUrl: product.image ?? undefined,
          retailProductId: product.id,
          variantName: product.variant || "Default",
          unitPrice: product.price,
        },
        1,
      );
      showToast("success", "Berhasil memasukkan ke keranjang");
    } catch {
      showToast("error", "Gagal menambahkan ke keranjang");
    }
  };

  if (loading) {
    return <AppLoadingScreen />;
  }

  return (
    <PageTransition>
      <div className="bg-white min-h-screen">
        <main className="max-w-7xl mx-auto px-6 lg:px-8 py-12">

          {/* Department nav */}
          <div className="flex gap-2 sm:gap-3 justify-center flex-nowrap w-full px-2 sm:px-0 pb-2 mb-6">
            <Link
              to="/glam"
              className="flex-shrink-0 flex items-center gap-1.5 sm:gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full border-2 border-gray-200 text-gray-600 text-[11px] sm:text-sm font-bold uppercase tracking-wider hover:border-[#ff4b86] hover:text-[#ff4b86] hover:shadow-md transition-all duration-200"
            >
              <span className="material-symbols-outlined text-[14px] sm:text-[16px]">auto_awesome</span>
              Glam
            </Link>
            <Link
              to="/charm-bar"
              className="flex-shrink-0 flex items-center gap-1.5 sm:gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full border-2 border-gray-200 text-gray-600 text-[11px] sm:text-sm font-bold uppercase tracking-wider hover:border-[#ff4b86] hover:text-[#ff4b86] hover:shadow-md transition-all duration-200"
            >
              <span className="material-symbols-outlined text-[14px] sm:text-[16px]">diamond</span>
              Charm
            </Link>
            <Link
              to="/spark-club"
              className="flex-shrink-0 flex items-center gap-1.5 sm:gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full border-2 border-[#ff4b86] bg-[#ff4b86] text-white text-[11px] sm:text-sm font-bold uppercase tracking-wider shadow-sm"
            >
              <span className="material-symbols-outlined text-[14px] sm:text-[16px]">storefront</span>
              Spark Club
            </Link>
          </div>

          {/* Sticky search */}
          <div className="sticky top-0 bg-white z-40 pt-4 pb-4 -mt-2 mb-8 border-b border-gray-100">
            <div className="relative w-full max-w-md mx-auto px-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Spark Club products..."
                className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:border-[#ff4b86] focus:ring-1 focus:ring-[#ff4b86] ux-transition-color"
              />
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 rounded-full hover:bg-gray-200 ux-transition-color"
                >
                  <X className="w-4 h-4" />
                </button>
              ) : null}
            </div>
          </div>

          {/* Error */}
          {productsError ? (
            <div className="mb-8 rounded-xl border border-red-500/20 bg-red-500/10 p-6 text-center">
              <p className="text-sm text-red-700">
                {productsError instanceof Error
                  ? productsError.message
                  : "Failed to load spark club data"}
              </p>
            </div>
          ) : null}

          {/* Products */}
          <SparkClubResults
            filteredProducts={filteredProducts}
            loading={productsLoading && allProducts.length === 0}
            resetSignal={resultsResetSignal}
            onAddToCart={handleAddToCart}
          />
        </main>
      </div>
    </PageTransition>
  );
};

export default SparkClub;
