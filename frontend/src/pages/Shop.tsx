import { useEffect, useMemo, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { mapSearchQueryToRoute } from "../lib/searchRouteMap";
import useSeo from "../hooks/useSeo";
import { ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useCart } from "../contexts/cartStore";
import { useAuth } from "../contexts/AuthContext";

import { formatCurrency } from "../utils/formatters";
import { useProductSummaries, type Product } from "../hooks/useProducts";
import { useRetailCategories } from "../hooks/useRetailCategories";
// import { useBanners } from '../hooks/useBanners';
import { fetchProductDetail } from "../hooks/useProduct";
import { useCharmBarSettings } from "../hooks/useCharmBarSettings";
import { useToast } from "../components/Toast";
import { PageTransition } from "../components/PageTransition";
import ProductCardSkeleton from "../components/skeletons/ProductCardSkeleton";
import { queryKeys } from "../lib/queryKeys";
import { useShopFilters } from "./shop/useShopFilters";
import { AppLoadingScreen } from "../app/AppLoadingScreen";
import { buildImageKitThumbUrl } from "../lib/imagekit";

const PRODUCTS_PER_PAGE = 20;

/**
 * Deterministic shuffle using a seeded PRNG (mulberry32).
 * Same seed always produces the same order — we use the date string
 * so products rotate daily while staying stable within a single day.
 */
function seededShuffle<T>(array: T[], seed: string): T[] {
  // Simple string → number hash
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  }
  // mulberry32 PRNG
  const rng = () => {
    h |= 0;
    h = (h + 0x6d2b79f5) | 0;
    let t = Math.imul(h ^ (h >>> 15), 1 | h);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/** Returns today's date as YYYY-MM-DD, used as the daily shuffle seed. */
function todaySeed(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

type ShopResultsProps = {
  filteredProducts: Product[];
  loading: boolean;
  resetSignal: string;
  onPrefetchProduct: (productId: number) => void;
  onAddToCart: (product: Product) => void;
};

function ShopResults({
  filteredProducts,
  loading,
  resetSignal,
  onPrefetchProduct,
  onAddToCart,
}: ShopResultsProps) {
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
    ];
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5 lg:gap-6">
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
          className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5 lg:gap-6 transition-opacity duration-300 ${isAnimating ? "opacity-0" : "opacity-100"}`}
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
                <div className="p-3.5 md:p-4 flex flex-col flex-grow">
                  <h3 className="font-semibold text-sm md:text-base text-gray-900 mb-1.5 line-clamp-2 ux-transition-color group-hover:text-[#ff4b86]">
                    {product.name}
                  </h3>
                  <p className="text-[11px] md:text-xs text-gray-400 mb-2.5 line-clamp-2 font-light min-h-[32px] md:min-h-[36px]">
                    {product.description || "\u00A0"}
                  </p>
                  <div className="flex items-center gap-2 mt-auto">
                    <span className="text-base md:text-lg font-black text-[#ff4b86]">
                      {formatCurrency(product.price)}
                    </span>
                    {product.originalPrice ? (
                      <span className="text-xs md:text-sm text-gray-400 line-through font-light">
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
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}

const Shop = () => {
  useSeo({
    title: "SparkStage Shop · Stage 55",
    description:
      "Discover Glam Room, Charm Bar, and Spark Club products in SparkStage Shop.",
    canonical: `${window.location.origin}/shop`,
  });

  const queryClient = useQueryClient();
  const { addItem } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const productsRef = useRef<HTMLDivElement>(null);
  const {
    activeCategory,
    activeSubcategory,
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
    categories: retailCategories = [],
    isLoading: retailCategoriesLoading,
  } = useRetailCategories();
  // const { data: shopBanners = [] } = useBanners('shop');
  const { settings: charmBarSettings, isLoading: charmBarLoading } =
    useCharmBarSettings();

  const loading =
    (productsLoading || charmBarLoading || retailCategoriesLoading) &&
    products.length === 0;
  const error = productsError;

  useEffect(() => {
    if (error) {
      showToast(
        "error",
        error instanceof Error ? error.message : "Failed to load shop data",
      );
    }
  }, [error, showToast]);

  // Shop categories from retail_categories table (department = 'shop')
  // Only show parent categories (main categories, not subcategories)
  // Sort by display_order
  const shopCategoriesFlat = useMemo(() => {
    return retailCategories
      .filter((c) => c.department === "shop" && c.is_active && c.parent_id === null)
      .sort((a, b) => (a.display_order || 999) - (b.display_order || 999));
  }, [retailCategories]);

  // Get subcategories for the active category
  // Sort by display_order
  const activeSubcategories = useMemo(() => {
    if (!activeCategory || activeCategory === "all") return [];
    
    const selectedCategory = shopCategoriesFlat.find(
      (c) => c.slug === activeCategory
    );
    
    if (!selectedCategory) return [];
    
    return retailCategories
      .filter((c) => c.department === "shop" && c.is_active && c.parent_id === selectedCategory.id)
      .sort((a, b) => (a.display_order || 999) - (b.display_order || 999));
  }, [activeCategory, shopCategoriesFlat, retailCategories]);

  // Filter products to only include shop department products
  const shopProducts = useMemo(
    () =>
      products.filter((p) => {
        // Include products that belong to shop department categories
        if (p.retail_category_id) {
          const category = retailCategories.find((c) => c.id === p.retail_category_id);
          return category?.department === 'shop' && category?.is_active;
        }
        return false;
      }),
    [products, retailCategories],
  );

  const filteredProducts = useMemo(() => {
    let matches = shopProducts;

    // 1. Filter by category and subcategory
    const currentActiveCategory =
      activeCategory === null ? "all" : activeCategory;
    const currentActiveSubcategory =
      activeSubcategory === null ? "all" : activeSubcategory;
    
    if (currentActiveCategory !== "all") {
      const cat = shopCategoriesFlat.find(
        (c) => c.slug === currentActiveCategory,
      );
      if (cat) {
        // If subcategory is selected, filter by subcategory only
        if (currentActiveSubcategory !== "all") {
          const subcat = activeSubcategories.find(
            (sc) => sc.slug === currentActiveSubcategory,
          );
          if (subcat) {
            matches = matches.filter(
              (product) => 
                product.retail_category_id === subcat.id ||
                product.retail_subcategory_id === subcat.id
            );
          }
        } else {
          // No subcategory selected, show products from:
          // 1. Products directly in the parent category
          // 2. Products in any of the subcategories
          const subcategoryIds = activeSubcategories.map((sc) => sc.id);
          matches = matches.filter(
            (product) => {
              // Product is directly in parent category
              if (product.retail_category_id === cat.id) return true;
              // Product is in a subcategory (via retail_category_id)
              if (product.retail_category_id && subcategoryIds.includes(product.retail_category_id)) return true;
              // Product is in a subcategory (via retail_subcategory_id)
              if (product.retail_subcategory_id && subcategoryIds.includes(product.retail_subcategory_id)) return true;
              return false;
            }
          );
        }
      } else {
        matches = matches.filter(
          (product) =>
            product.retailCategorySlug === currentActiveCategory ||
            product.categorySlug === currentActiveCategory,
        );
      }
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

    // 3. Daily randomization — rotate product order every day.
    //    Applies to: "All Products" view AND category "All" subcategory view.
    //    Skipped when a specific subcategory is selected or a search is active.
    const noSearch = !deferredSearchQuery;
    const isAllProducts = currentActiveCategory === "all";
    const isAllSubcategory = currentActiveSubcategory === "all";
    if (noSearch && (isAllProducts || isAllSubcategory)) {
      // Mix category slug into seed so each category gets a unique daily order
      const seed = todaySeed() + (isAllProducts ? "" : `-${currentActiveCategory}`);
      matches = seededShuffle(matches, seed);
    }

    return matches;
  }, [
    activeCategory,
    activeSubcategory,
    deferredSearchQuery,
    shopCategoriesFlat,
    activeSubcategories,
    charmBarSettings,
    shopProducts,
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
        {/* menonaktidakn sementara banner */}
        {/* <header className="relative w-full overflow-hidden">
          {shopBanners.length > 0 ? (
            <HeroBannerCarousel
              slides={shopBanners}
              intervalMs={5000}
              containerClassName="relative w-full"
              imageClassName="w-full h-auto object-contain opacity-90"
              autoHeight={true}
              prevButtonClassName="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-gray-900 p-3 rounded-full ux-transition-color"
              nextButtonClassName="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-gray-900 p-3 rounded-full ux-transition-color"
              indicatorActiveClassName="bg-primary"
              indicatorInactiveClassName="bg-white/50 hover:bg-white/70"
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
            <>
              <img
                alt="Soft artistic studio setting"
                className="w-full h-full object-contain opacity-90"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBXsDj0az3zzKzPuGWFNVkv93Z05vEWEttTgUqh4SS7iW-kLSNN2_0jvc-v4pho8kz2OqrqnpiQWh4vBzn87isw1yCP1VE1HXsHHOHubRuhCY6LmQpM3KdjfATKhPb2413xZu1naHDWVkwgWTK9sWUI-jwpMrYUO-6Uad1Qcq7NStqNGjpzbzTLH7nXSLD8e_CIiD6qurTg-eVxRwpK34LWyWrNCYPlMJqhFEbs2rUPPUn2uOz-B8JOZCi3FsjDK7b_ExLsUFMJyrA"
              />
            </>
          )}
        </header> */}

        <main className="max-w-7xl mx-auto px-6 lg:px-8 py-5">
          {/* Shop Header */}
          <div className="flex justify-center mb-8 mt-4">
            <div className="text-center">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-gray-800 mb-2 tracking-tight">
                SHOP
              </h1>
              <p className="text-sm sm:text-base text-gray-500">
                Discover our curated collection
              </p>
            </div>
          </div>

          <div
            ref={productsRef}
            className="mb-3 border-b border-gray-100 pb-0 sticky top-0 md:top-4 bg-white z-40 pt-4 -mt-6"
          >
            <div className="flex flex-col space-y-4">
              <div className="relative w-full max-w-md mx-auto mb-2 px-2">
                <div className="relative mb-3">
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

              <div className="w-full mt-3 mb-3">
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
                    {shopCategoriesFlat.map((category) => {
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

              {/* Subcategory tabs - shown when a category is selected and has subcategories */}
              {activeCategory !== "all" && activeSubcategories.length > 0 ? (
                <div className="w-full -mt-1 mb-3">
                  <div className="mx-auto w-fit max-w-full overflow-x-auto category-scroll-thin px-2 pb-2">
                    <div className="flex gap-1.5 md:gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          updateFilters({
                            subcategory: null,
                          });
                        }}
                        className={`px-3 md:px-5 py-2 rounded-full text-xs font-semibold whitespace-nowrap border ux-transition-color ${
                          activeSubcategory === "all"
                            ? "bg-[#ff4b86] text-white border-[#ff4b86] shadow-sm"
                            : "bg-white text-gray-500 border-gray-200 hover:border-[#ff4b86] hover:text-[#ff4b86]"
                        }`}
                      >
                        All
                      </button>
                      {activeSubcategories.map((subcategory) => (
                        <button
                          key={subcategory.slug}
                          type="button"
                          onClick={() => {
                            updateFilters({
                              subcategory: subcategory.slug,
                            });
                          }}
                          className={`px-3 md:px-5 py-2 rounded-full text-xs font-semibold whitespace-nowrap border ux-transition-color ${
                            activeSubcategory === subcategory.slug
                              ? "bg-[#ff4b86] text-white border-[#ff4b86] shadow-sm"
                              : "bg-white text-gray-500 border-gray-200 hover:border-[#ff4b86] hover:text-[#ff4b86]"
                          }`}
                        >
                          {subcategory.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {error ? (
            <div className="mb-8 rounded-xl border border-red-500/20 bg-red-500/10 p-6 text-center">
              <p className="text-sm text-red-700 mb-4">
                {error instanceof Error
                  ? error.message
                  : "Failed to load shop data"}
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

          <ShopResults
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

export default Shop;
