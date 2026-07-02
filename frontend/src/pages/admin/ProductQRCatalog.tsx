import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import QRCode from "react-qr-code";
import { Search, Loader2, QrCode, ChevronLeft, ChevronRight } from "lucide-react";
import AdminLayout from "../../components/AdminLayout";
import { ADMIN_MENU_ITEMS } from "../../constants/adminMenu";
import { useAdminMenuSections } from "../../hooks/useAdminMenuSections";
import { useAuth } from "../../contexts/AuthContext";
import QRScannerModal from "../../components/admin/QRScannerModal";

interface Variant {
  id: number;
  name: string;
  sku: string;
}

interface Product {
  id: number;
  name: string;
  sku: string;
  image_url: string;
  variants: Variant[];
}

interface QRCardItem {
  key: string;
  productName: string;
  variantName?: string;
  sku: string;
}

export default function ProductQRCatalog() {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const itemsPerPage = 12;

  const { signOut } = useAuth();
  const menuSections = useAdminMenuSections();

  const { data: products, isLoading, error } = useQuery({
    queryKey: ["admin", "product-qr-catalog"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(`
          id,
          name,
          sku,
          image_url,
          product_variants (
            id,
            name,
            sku
          )
        `)
        .eq("is_active", true)
        .order("name");

      if (error) throw error;

      return (data || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        sku: p.sku || "",
        image_url: p.image_url || "",
        variants: (p.product_variants || []).map((v: any) => ({
          id: v.id,
          name: v.name,
          sku: v.sku || "",
        })),
      })) as Product[];
    },
  });

  const filteredProducts = products?.filter((p) => {
    const term = searchTerm.toLowerCase();
    if (p.name.toLowerCase().includes(term)) return true;
    if (p.sku.toLowerCase().includes(term)) return true;
    if (p.variants.some((v) => v.sku.toLowerCase().includes(term) || v.name.toLowerCase().includes(term))) return true;
    return false;
  });

  // Flatten into a single array of items to render
  const flatItems: QRCardItem[] = (filteredProducts || []).flatMap((product) => {
    if (product.variants.length > 0) {
      const variantItems: QRCardItem[] = product.variants.map(v => ({
        key: `${product.id}-${v.id}`,
        productName: product.name,
        variantName: v.name,
        sku: v.sku || product.sku || product.id.toString()
      }));
      return variantItems;
    }
    
    const singleItem: QRCardItem[] = [{
      key: product.id.toString(),
      productName: product.name,
      variantName: undefined,
      sku: product.sku || product.id.toString()
    }];
    return singleItem;
  });

  const totalPages = Math.ceil(flatItems.length / itemsPerPage);
  const paginatedItems = flatItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Reset page when searching
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleScan = async (code: string) => {
    setSearchTerm(code);
    setCurrentPage(1);
    setIsScannerOpen(false);
  };

  return (
    <AdminLayout
      menuItems={ADMIN_MENU_ITEMS}
      menuSections={menuSections}
      defaultActiveMenuId="product-qr-catalog"
      title="Katalog QR Produk"
      onLogout={signOut}
    >
      <div className="p-4 md:p-6 bg-white rounded-xl border border-gray-200">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <QrCode className="w-6 h-6 text-main-500" />
              Katalog QR Produk
            </h1>
            <p className="text-gray-500 mt-1">Daftar semua produk dan varian beserta Barcode/SKU untuk keperluan scan Kasir.</p>
          </div>

          <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3 shrink-0">
            <button
              onClick={() => setIsScannerOpen(true)}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-main-600 text-white rounded-lg font-bold hover:bg-main-700 transition-colors shadow-sm w-full sm:w-auto shrink-0"
            >
              <QrCode className="w-5 h-5" />
              Scan QR Kamera
            </button>
            <div className="relative w-full sm:w-72 md:w-80 shrink-0">
              <input
                type="text"
                placeholder="Cari nama produk atau SKU..."
                value={searchTerm}
                onChange={handleSearch}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-main-500 focus:border-transparent outline-none shadow-sm"
              />
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            </div>
          </div>
        </div>

        {error ? (
          <div className="p-8 text-red-500 bg-red-50 rounded-xl border border-red-100">
            Error loading products: {(error as Error).message}
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-main-500 animate-spin" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {paginatedItems.map((item) => (
                <QRCard 
                  key={item.key}
                  productName={item.productName}
                  variantName={item.variantName}
                  sku={item.sku}
                />
              ))}
            </div>
            
            {flatItems.length === 0 && (
              <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-xl border border-gray-100 mt-6">
                <QrCode className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p>Tidak ada produk yang ditemukan.</p>
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-gray-200 mt-8 pt-6">
                <p className="text-sm text-gray-600 hidden sm:block">
                  Menampilkan <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> - <span className="font-medium">{Math.min(currentPage * itemsPerPage, flatItems.length)}</span> dari <span className="font-medium">{flatItems.length}</span> QR
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      // Simple pagination logic to show max 5 pages
                      let pageNum = i + 1;
                      if (totalPages > 5 && currentPage > 3) {
                        pageNum = currentPage - 2 + i;
                        if (pageNum > totalPages) pageNum = totalPages - (4 - i);
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                            currentPage === pageNum
                              ? "bg-main-500 text-white border border-main-500"
                              : "border border-gray-200 text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                  >
                    <ChevronRight className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* QR Scanner Modal */}
      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={handleScan}
        title="Scan QR Produk"
        preferredCamera="back"
        closeOnSuccess={true}
      />
    </AdminLayout>
  );
}

function QRCard({ productName, variantName, sku }: { productName: string, variantName?: string, sku: string }) {
  // If variant name is exactly the same as product name or it's "Default", hide it to avoid redundancy
  const showVariant = variantName && variantName !== "Default" && variantName.toLowerCase() !== productName.toLowerCase();

  const handleDownloadQR = () => {
    const canvas = document.getElementById(`qr-${sku}`) as HTMLCanvasElement;
    if (!canvas) {
      console.error('QR canvas not found');
      return;
    }

    // Get the SVG QR code
    const svg = canvas.querySelector('svg');
    if (!svg) {
      console.error('QR SVG not found');
      return;
    }

    // Create a canvas to convert SVG to PNG
    const tempCanvas = document.createElement('canvas');
    const ctx = tempCanvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size (larger for better quality)
    const size = 512;
    tempCanvas.width = size;
    tempCanvas.height = size;

    // Fill white background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, size, size);

    // Convert SVG to image
    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, size, size);
      URL.revokeObjectURL(url);

      // Download as PNG with SKU as filename
      tempCanvas.toBlob((blob) => {
        if (!blob) return;
        const downloadUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `${sku}.png`;
        link.click();
        URL.revokeObjectURL(downloadUrl);
      }, 'image/png');
    };
    img.src = url;
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md flex flex-col items-center text-center transition-shadow relative overflow-hidden group">
      {/* Product Name */}
      <h3 className="font-bold text-gray-900 text-base leading-tight line-clamp-2 w-full px-1 mb-3">
        {productName}
      </h3>

      {/* Variant Badge */}
      {showVariant && (
        <span className="bg-gray-100 text-gray-700 text-xs px-3 py-1.5 rounded-md mb-4 font-medium">
          {variantName}
        </span>
      )}

      {/* QR Code - Large and centered */}
      <div id={`qr-${sku}`} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm mb-4 w-48 h-48 flex items-center justify-center">
        <QRCode
          value={sku}
          size={176}
          style={{ height: "auto", maxWidth: "100%", width: "100%" }}
          viewBox={`0 0 256 256`}
        />
      </div>

      {/* SKU */}
      <p className="text-main-500 font-mono text-sm font-bold bg-main-50 px-4 py-2 rounded-md w-full truncate border border-main-100 mb-3" title={sku}>
        {sku}
      </p>

      {/* Download Button */}
      <button
        onClick={handleDownloadQR}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors text-sm"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        Download QR
      </button>
    </div>
  );
}
