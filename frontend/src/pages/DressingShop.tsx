import { useEffect, useMemo, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { mapSearchQueryToRoute } from "../lib/searchRouteMap";
import { ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useCart } from "../contexts/cartStore";
import { useAuth } from "../contexts/AuthContext";

import { formatCurrency } from "../utils/formatters";
import { useProductSummaries, type Product } from "../hooks/useProducts";
import { useRetailCategories } from "../hooks/useRetailCategories";
import { useBanners } from "../hooks/useBanners";
import { fetchProductDetail } from "../hooks/useProduct";
import { useCharmBarSettings } from "../hooks/useCharmBarSettings";
import { useToast } from "../components/Toast";
import { PageTransition } from "../components/PageTransition";
import ProductCardSkeleton from "../components/skeletons/ProductCardSkeleton";
import { queryKeys } from "../lib/queryKeys";
import { useShopFilters } from "./shop/useShopFilters";
import { CHARM_BAR_CATEGORY_SLUGS } from "./shop/charmBarSlugs";
import { AppLoadingScreen } from "../app/AppLoadingScreen";
import { buildImageKitThumbUrl } from "../lib/imagekit";

const PRODUCTS_PER_PAGE = 20;

type DressingShopResultsProps = {
  filteredProducts: Product[];
  loading: boolean;
  resetSignal: string;
  onPrefetchProduct: (productId: number) => void;
  onAddToCart: (product: Product) => void;
};

function DressingShopResults({
  filteredProducts,
  loading,
  resetSignal,
  onPrefetchProduct,
  onAddToCart,
}: DressingShopResultsProps) {
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
    const skeletonKeys = [
      "product-skeleton-1",
      "product-skeleton-2",
      "product-skeleton-3",
      "product-skeleton-4",
      "product-skeleton-5",
      "product-skeleton-6",
      "product-skeleton-7",
      "product-skeleton-8",
      "product-skeleton-9",
      "product-skeleton-10",
    ];
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {skeletonKeys.map((skeletonKey) => (
          <ProductCardSkeleton key={skeletonKey} />
        ))}
      </div>
    );
  }

  return (
    <>
      {totalProducts === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-gray-50 px-6 py-10 text-center">
          <p className="text-sm text-gray-500">
            No products found for this filter.
          </p>
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
              onMouseEnter={() => onPrefetchProduct(product.id)}
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
                      src={buildImageKitThumbUrl(product.image, {
                        width: 480,
                        quality: 60,
                      })}
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-300">
                      <span className="material-symbols-outlined text-5xl">
                        {product.placeholder}
                      </span>
                    </div>
                  )}
                  {!product.defaultVariantId && (
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
                    disabled={!product.defaultVariantId}
                    className="absolute bottom-3 right-3 bg-[#ff4b86] text-white p-2.5 rounded-full opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 shadow-lg hover:bg-[#e63d75] ux-transition-color ux-transition-opacity ux-transition-transform ux-motion-safe disabled:opacity-0 disabled:cursor-not-allowed"
                  >
                    <span className="material-symbols-outlined text-lg">
                      add_shopping_cart
                    </span>
                  </button>
                  {product.badge && (
                    <span className="absolute top-3 left-3 bg-[#ff4b86] text-white px-2.5 py-1 text-[10px] uppercase tracking-wider font-bold rounded-full shadow-sm">
                      {product.badge}
                    </span>
                  )}
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
                    {product.originalPrice ? (
                      <span className="text-xs text-gray-400 line-through font-light">
                        {formatCurrency(product.originalPrice)}
                      </span>
                    ) : null}
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
              onClick={() =>
                setCurrentPage((prev) =>
                  Math.max(1, Math.min(totalPages, prev - 1)),
                )
              }
              disabled={page <= 1}
              className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 duration-200 ux-transition-color hover:border-[#ff4b86] hover:text-[#ff4b86] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
              Prev
            </button>
            <button
              type="button"
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
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

const DressingShop = () => {
  const queryClient = useQueryClient();
  const { addItem } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const productsRef = useRef<HTMLDivElement>(null);
  const {
    activeCategory,
    searchQuery,
    setSearchQuery,
    updateFilters,
    deferredSearchQuery,
    resultsResetSignal,
  } = useShopFilters();

  const {
    data: products = [],
    error: productsError,
    isLoading: productsLoading,
    refetch: refetchProducts,
  } = useProductSummaries();
  const {
    categories = [],
    error: categoriesError,
    isLoading: categoriesLoading,
  } = useRetailCategories();
  useBanners("dressing"); // preload dressing banners (reserved for future hero section)
  const { settings: charmBarSettings, isLoading: charmBarLoading } =
    useCharmBarSettings();

  const dressingCategoriesFlat = useMemo(() => {
    return categories.filter((c) => c.department === "dressing" && c.is_active);
  }, [categories]);

  const loading =
    (productsLoading || categoriesLoading || charmBarLoading) &&
    products.length === 0;
  const error = productsError || categoriesError;

  useEffect(() => {
    if (error) {
      showToast(
        "error",
        error instanceof Error ? error.message : "Failed to load dressing data",
      );
    }
  }, [error, showToast]);

  const GLAM_CATEGORY_SLUGS = new Set([
    "makeup",
    "eyewear",
    "glitter",
    "headliner",
    "starglitter",
    "star-glitter",
    "popsocket",
    "pop-socket",
    "popsockets",
  ]);

  const nonCharmBarProducts = useMemo(
    () =>
      products.filter((p) => {
        const nameLower = p.name.toLowerCase();

        // Filter out specific products by name (in case they don't have a category slug)
        if (
          nameLower.includes("headliner") ||
          nameLower.includes("pop socket") ||
          nameLower.includes("popsocket") ||
          nameLower.includes("lucky charm") ||
          nameLower.includes("lucky") ||
          nameLower.includes("lucky-charm") ||
          nameLower.includes("charm")
        ) {
          return false;
        }

        if (!p.categorySlug) return true;
        const slugLower = p.categorySlug.toLowerCase();
        return (
          !CHARM_BAR_CATEGORY_SLUGS.has(slugLower) &&
          !GLAM_CATEGORY_SLUGS.has(slugLower)
        );
      }),
    [products],
  );

  const filteredProducts = useMemo(() => {
    let matches = nonCharmBarProducts;

    // 1. Filter by category
    const currentActiveCategory =
      activeCategory === null ? "all" : activeCategory;
    if (currentActiveCategory !== "all") {
      const cat = dressingCategoriesFlat.find(
        (c) => c.slug === currentActiveCategory,
      );
      if (cat) {
        matches = matches.filter(
          (product) => product.retail_category_id === cat.id,
        );
      } else {
        matches = matches.filter(
          (product) =>
            product.retailCategorySlug === currentActiveCategory ||
            product.categorySlug === currentActiveCategory,
        );
      }
    } else {
      // If "All Products" is selected, only show products that belong to the dressing department categories
      const dressingCategoryIds = new Set(
        dressingCategoriesFlat.map((c) => c.id),
      );
      const dressingCategorySlugs = new Set(
        dressingCategoriesFlat.map((c) => c.slug),
      );

      matches = matches.filter(
        (product) =>
          (product.retail_category_id &&
            dressingCategoryIds.has(product.retail_category_id)) ||
          (product.retailCategorySlug &&
            dressingCategorySlugs.has(product.retailCategorySlug)) ||
          (product.categorySlug &&
            dressingCategorySlugs.has(product.categorySlug)),
      );
    }

    // 2. Search
    if (deferredSearchQuery) {
      const q = deferredSearchQuery.toLowerCase();
      matches = matches.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q)),
      );
    }

    // Sort best sellers if needed
    if (charmBarSettings?.best_seller_charms?.length) {
      matches.sort((a, b) => {
        const aIndex = charmBarSettings.best_seller_charms.indexOf(a.id);
        const bIndex = charmBarSettings.best_seller_charms.indexOf(b.id);
        if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
        if (aIndex !== -1) return -1;
        if (bIndex !== -1) return 1;
        return 0;
      });
    }

    return matches;
  }, [
    activeCategory,
    deferredSearchQuery,
    dressingCategoriesFlat,
    charmBarSettings,
    nonCharmBarProducts,
  ]);
  const handleAddToCart = (product: Product) => {
    if (!user) {
      showToast("error", "Please login to add items to cart");
      navigate("/login", { state: { from: window.location.pathname } });
      return;
    }
    if (!product.defaultVariantId || !product.defaultVariantName) return;

    try {
      addItem(
        {
          productId: product.id,
          productName: product.name,
          productImageUrl: product.image,
          variantId: product.defaultVariantId,
          variantName: product.defaultVariantName,
          unitPrice: product.price,
        },
        1,
      );
      showToast("success", "Berhasil memasukkan ke keranjang");
    } catch {
      showToast("error", "Gagal menambahkan ke keranjang");
    }
  };

  const scrollToProducts = () => {
    if (productsRef.current) {
      productsRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  const handleCategoryChange = () => {
    scrollToProducts();
  };

  useEffect(() => {
    handleCategoryChange();
  }, [activeCategory]);

  const prefetchProduct = (productId: number) => {
    void queryClient.prefetchQuery({
      queryKey: queryKeys.product(productId),
      queryFn: ({ signal }) => fetchProductDetail(productId, signal),
      staleTime: 60000,
    });
  };

  if (loading) {
    return <AppLoadingScreen />;
  }

  return (
    <PageTransition>
      <div className="bg-white min-h-screen">
        <main className="max-w-7xl mx-auto px-6 lg:px-8 py-5">
          {/* ── Shop Section Navigator ──────────────────────────── */}
          <div className="mb-6">
            <div className="flex gap-3 sm:gap-4 justify-center flex-nowrap w-full px-2 sm:px-0 pb-2 -mb-2">
              {/* Glam */}
              <Link
                to="/beauty"
                className="flex-shrink-0 flex items-center gap-1.5 sm:gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full border-2 border-gray-200 text-gray-600 text-[11px] sm:text-sm font-bold uppercase tracking-wider hover:border-[#ff4b86] hover:text-[#ff4b86] hover:shadow-md transition-all duration-200"
              >
                <span className="material-symbols-outlined text-[14px] sm:text-[16px]">
                  face_retouching_natural
                </span>
                Glam
              </Link>

              {/* Charm Bar */}
              <Link
                to="/charm-bar"
                className="flex-shrink-0 flex items-center gap-1.5 sm:gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full border-2 border-gray-200 text-gray-600 text-[11px] sm:text-sm font-bold uppercase tracking-wider hover:border-[#ff4b86] hover:text-[#ff4b86] hover:shadow-md transition-all duration-200"
              >
                <span className="material-symbols-outlined text-[14px] sm:text-[16px]">
                  diamond
                </span>
                Charm
              </Link>

              {/* Spark Club */}
              <Link
                to="/shop"
                className="flex-shrink-0 flex items-center gap-1.5 sm:gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full border-2 border-gray-200 text-gray-600 text-[11px] sm:text-sm font-bold uppercase tracking-wider hover:border-[#ff4b86] hover:text-[#ff4b86] hover:shadow-md transition-all duration-200"
              >
                <span className="material-symbols-outlined text-[14px] sm:text-[16px]">
                  shopping_bag
                </span>
                Spark
              </Link>

              {/* Dressing — current page (active) */}
              <Link
                to="/dressing"
                className="flex-shrink-0 flex items-center gap-1.5 sm:gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full border-2 border-[#ff4b86] bg-[#ff4b86] text-white text-[11px] sm:text-sm font-bold uppercase tracking-wider shadow-sm"
              >
                <span className="material-symbols-outlined text-[14px] sm:text-[16px]">
                  checkroom
                </span>
                Dressing
              </Link>
            </div>
          </div>

          <div
            ref={productsRef}
            className="mb-8 border-b border-gray-100 pb-0 sticky top-0 bg-white z-40 pt-4 -mt-6"
          >
            <div className="flex flex-col space-y-4">
              <div className="relative w-full max-w-md mx-auto mb-2 px-2">
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      updateFilters({ q: e.target.value });
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const mapped = mapSearchQueryToRoute(searchQuery || "");
                        if (mapped) {
                          e.currentTarget.blur();
                          navigate(mapped);
                        }
                      }
                    }}
                    placeholder="Search products..."
                    className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:border-[#ff4b86] focus:ring-1 focus:ring-[#ff4b86] ux-transition-color"
                  />
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  {searchQuery ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery("");
                        updateFilters({ q: null });
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 rounded-full hover:bg-gray-200 ux-transition-color"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="w-full mt-4 mb-2">
                <div className="mx-auto w-fit max-w-full overflow-x-auto category-scroll px-4 sm:px-6">
                  <div className="flex items-center space-x-6 md:space-x-8 pb-2">
                    <button
                      type="button"
                      onClick={() => {
                        updateFilters({
                          category: null,
                          subcategory: null,
                          subsubcategory: null,
                        });
                      }}
                      className={`text-sm whitespace-nowrap pb-2 border-b-2 transition-colors ${
                        !activeCategory || activeCategory === "all"
                          ? "font-semibold text-[#ff4b86] border-[#ff4b86]"
                          : "font-semibold text-gray-500 border-transparent hover:text-[#ff4b86]"
                      }`}
                    >
                      All Products
                    </button>
                    {dressingCategoriesFlat.map((category) => {
                      const isActive = activeCategory === category.slug;
                      return (
                        <button
                          key={category.slug}
                          type="button"
                          onClick={() => {
                            updateFilters({
                              category: isActive ? null : category.slug,
                              subcategory: null,
                              subsubcategory: null,
                            });
                          }}
                          className={`text-sm whitespace-nowrap pb-2 border-b-2 transition-colors ${
                            isActive
                              ? "font-semibold text-[#ff4b86] border-[#ff4b86]"
                              : "font-semibold text-gray-500 border-transparent hover:text-[#ff4b86]"
                          }`}
                        >
                          {category.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {error ? (
            <div className="mb-8 rounded-xl border border-red-500/20 bg-red-500/10 p-6 text-center">
              <p className="text-sm text-red-700 mb-4">
                {error instanceof Error
                  ? error.message
                  : "Failed to load dressing data"}
              </p>
              <button
                type="button"
                onClick={() => {
                  refetchProducts();
                }}
                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark ux-transition-color text-sm font-medium"
              >
                Retry
              </button>
            </div>
          ) : null}

          <DressingShopResults
            filteredProducts={filteredProducts}
            loading={loading}
            resetSignal={resultsResetSignal}
            onPrefetchProduct={prefetchProduct}
            onAddToCart={handleAddToCart}
          />
        </main>
      </div>
    </PageTransition>
  );
};

export default DressingShop;
