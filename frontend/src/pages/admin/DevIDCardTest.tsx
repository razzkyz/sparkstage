import React, { useState, useRef, useEffect } from "react";
import AdminLayout from "../../components/AdminLayout";
import { supabase } from "../../lib/supabase";
import { ADMIN_MENU_ITEMS } from "../../constants/adminMenu";
import { useAdminMenuSections } from "../../hooks/useAdminMenuSections";
import { useAuth } from "../../contexts/AuthContext";

import { removeBackground } from "@imgly/background-removal";
import Barcode from "react-barcode";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

// ============================================================
// PDF OFFSET COMPENSATION
// ============================================================
// Koordinat ini HANYA dipakai saat generate PDF untuk kompensasi rendering
// Preview tetap menggunakan koordinat asli dari template
const PDF_OFFSET = {
  name: -4,    // Preview di template: 87px → PDF: 87-4 = 83px
  zodiac: -4,  // Preview di template: 115px → PDF: 115-4 = 111px
  hobby: -4,   // Preview di template: 143px → PDF: 143-4 = 139px
};

// TEMPLATE CONFIG FALLBACK (jika tidak ada template dari database)
const TEMPLATE_FRONT = {
  image: "/images/templates/card-front.png",
  photo: { top: "22px", left: "20px", width: "125px", height: "160px", borderRadius: "0px" },
  name: {
    top: "87px",  // Koordinat asli untuk preview
    left: "175px",
    width: "130px",
    fontSize: "12px",
    color: "#c2185b",
  },
  zodiac: {
    top: "115px",  // Koordinat asli untuk preview
    left: "175px",
    width: "130px",
    fontSize: "11px",
    color: "#c2185b",
  },
  hobby: {
    top: "143px",  // Koordinat asli untuk preview
    left: "175px",
    width: "130px",
    fontSize: "11px",
    color: "#c2185b",
  },
};

const TEMPLATE_BACK = {
  image: "/images/templates/card-back.png",
  barcode: { bottom: "15px", right: "15px", width: "80px", height: "30px" },
  serial: {
    bottom: "48px",
    right: "15px",
    width: "80px",
    fontSize: "9px",
    color: "#c2185b",
  },
};

export default function DevIDCardTest() {
  const [name, setName] = useState("John Doe");
  const [serial, setSerial] = useState("SPARK-001");
  const [zodiac, setZodiac] = useState("Aries");
  const [hobby, setHobby] = useState("Dancing");
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [processedImg, setProcessedImg] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const { signOut } = useAuth();
  const menuSections = useAdminMenuSections();

  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");

  // Ref untuk preview (tampilan yang dilihat user)
  const frontCardRef = useRef<HTMLDivElement>(null);
  const backCardRef = useRef<HTMLDivElement>(null);
  
  // Ref untuk PDF (dengan offset kompensasi, hidden)
  const frontCardPdfRef = useRef<HTMLDivElement>(null);
  const backCardPdfRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchTemplates = async () => {
      const { data, error } = await supabase
        .from("id_card_templates")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setTemplates(data);
        if (data.length > 0) {
          setSelectedTemplateId(data[0].id);
        }
      }
    };
    fetchTemplates();
  }, []);

  const activeTemplate = templates.find((t) => t.id === selectedTemplateId);
  const currentFront = activeTemplate
    ? { image: activeTemplate.front_image_url, ...activeTemplate.config_front }
    : TEMPLATE_FRONT;
  const currentBack = activeTemplate
    ? { image: activeTemplate.back_image_url, ...activeTemplate.config_back }
    : TEMPLATE_BACK;

  // Helper: Hitung koordinat dengan offset untuk PDF
  const getPdfCoordinate = (originalPx: string, offsetPx: number): string => {
    const num = parseInt(originalPx);
    return `${num + offsetPx}px`;
  };

  // Koordinat untuk PDF (dengan kompensasi offset)
  const pdfFront = {
    ...currentFront,
    name: {
      ...currentFront.name,
      top: getPdfCoordinate(currentFront.name.top, PDF_OFFSET.name),
    },
    zodiac: {
      ...currentFront.zodiac,
      top: getPdfCoordinate(currentFront.zodiac.top, PDF_OFFSET.zodiac),
    },
    hobby: {
      ...currentFront.hobby,
      top: getPdfCoordinate(currentFront.hobby.top, PDF_OFFSET.hobby),
    },
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImageSrc(url);
      setProcessedImg(null);
    }
  };

  const handleRemoveBackground = async () => {
    if (!imageSrc) return;
    setIsProcessing(true);
    try {
      console.log('🎨 Starting background removal...');
      console.log('📍 Environment:', {
        isDev: import.meta.env.DEV,
        isProd: import.meta.env.PROD,
        mode: import.meta.env.MODE,
        baseUrl: import.meta.env.BASE_URL,
        origin: window.location.origin,
      });
      
      // Configure library with explicit publicPath for production
      const config = {
        publicPath: window.location.origin + '/',
        debug: import.meta.env.DEV,
      };
      
      console.log('🔧 Config:', config);
      console.log('🚀 Calling removeBackground...');
      
      const imageBlob = await removeBackground(imageSrc, config);
      
      const url = URL.createObjectURL(imageBlob);
      setProcessedImg(url);
      console.log('✅ Background removal successful!');
    } catch (error) {
      console.error("❌ Error removing background:", error);
      console.error("Error stack:", error instanceof Error ? error.stack : 'No stack trace');
      
      // Show more helpful error message
      let errorMsg = "Gagal memproses AI. ";
      
      if (error instanceof Error) {
        const msg = error.message.toLowerCase();
        
        if (msg.includes('wasm') || msg.includes('backend')) {
          errorMsg += "WASM files tidak dapat diakses. Pastikan deployment include WASM files di root.\n\n";
        } else if (msg.includes('cross-origin') || msg.includes('cors')) {
          errorMsg += "CORS error. Pastikan server headers sudah benar.\n\n";
        } else if (msg.includes('json') || msg.includes('unexpected token')) {
          errorMsg += "Konfigurasi error. Check WASM file paths.\n\n";
        } else if (msg.includes('fetch') || msg.includes('network')) {
          errorMsg += "Network error. Check internet connection.\n\n";
        } else if (msg.includes('heic')) {
          errorMsg += "File format not supported. Please use JPEG or PNG.\n\n";
        } else {
          errorMsg += "Unknown error. Check browser console for details.\n\n";
        }
        
        errorMsg += "Technical detail: " + error.message;
      } else {
        errorMsg += String(error);
      }
      
      alert(errorMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePrintPDF = async () => {
    if (!frontCardPdfRef.current || !backCardPdfRef.current) return;
    try {
      // Helper: Preload image to ensure it's rendered in canvas
      const preloadImage = (src: string): Promise<HTMLImageElement> => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = "anonymous"; // Enable CORS
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = src;
        });
      };

      // Preload template images
      await preloadImage(currentFront.image);
      await preloadImage(currentBack.image);

      // Small delay to ensure images are fully rendered in DOM
      await new Promise((resolve) => setTimeout(resolve, 300));

      // --- 1. RENDER SISI DEPAN (dengan offset kompensasi) ---
      const canvasFront = await html2canvas(frontCardPdfRef.current, {
        scale: 4,
        useCORS: true,
        allowTaint: false,
        logging: false,
      });
      const imgDataFront = canvasFront.toDataURL("image/png");
      const pdfFront = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: [85.6, 54],
      });
      pdfFront.addImage(imgDataFront, "PNG", 0, 0, 85.6, 54);
      pdfFront.save(`ID-Card-${serial}-DEPAN.pdf`);

      // Delay 1.5 detik agar browser tidak memblokir download kedua
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // --- 2. RENDER SISI BELAKANG (dengan offset kompensasi) ---
      const canvasBack = await html2canvas(backCardPdfRef.current, {
        scale: 4,
        useCORS: true,
        allowTaint: false,
        logging: false,
      });
      const imgDataBack = canvasBack.toDataURL("image/png");
      const pdfBack = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: [85.6, 54],
      });
      pdfBack.addImage(imgDataBack, "PNG", 0, 0, 85.6, 54);
      pdfBack.save(`ID-Card-${serial}-BELAKANG.pdf`);
      
      alert('✅ PDF berhasil didownload! Text di PDF sudah otomatis disesuaikan agar sesuai dengan preview.');
    } catch (err) {
      console.error("Error generating PDF:", err);
      alert("Gagal membuat file PDF. Pastikan gambar template dapat diakses dengan benar.");
    }
  };

  return (
    <AdminLayout
      menuItems={ADMIN_MENU_ITEMS}
      menuSections={menuSections}
      defaultActiveMenuId="dev-id-card-test"
      title="ID Card Print Test"
      onLogout={signOut}
    >
      <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6 sm:space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-800">
            DevOps: ID Card Print Test
          </h1>
          <p className="text-sm text-gray-500">
            Eksperimen cetak ID Card untuk printer Epson L8050.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* ========== FORM CONTROLS ========== */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-200/60 space-y-4">
            <h3 className="text-lg font-semibold text-neutral-800">
              1. Pilih Template
            </h3>
            <div>
              <select
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-neutral-300 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 bg-white"
              >
                {templates.length === 0 ? (
                  <option value="">Memuat template...</option>
                ) : (
                  templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            <h3 className="text-lg font-semibold text-neutral-800 pt-4 border-t">
              2. Data Customer
            </h3>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Nama
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-neutral-300 focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Serial Number
              </label>
              <input
                type="text"
                value={serial}
                onChange={(e) => setSerial(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-neutral-300 focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Zodiak
              </label>
              <input
                type="text"
                value={zodiac}
                onChange={(e) => setZodiac(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-neutral-300 focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Hobby
              </label>
              <input
                type="text"
                value={hobby}
                onChange={(e) => setHobby(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-neutral-300 focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
              />
            </div>

            <h3 className="text-lg font-semibold text-neutral-800 pt-4 border-t">
              3. Upload Foto
            </h3>

            <div>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="w-full"
              />
            </div>

            <div className="pt-4 border-t flex flex-col gap-3">
              <button
                onClick={handleRemoveBackground}
                disabled={!imageSrc || isProcessing}
                className="w-full bg-neutral-900 text-white py-2 rounded-lg hover:bg-neutral-800 disabled:opacity-50 transition-colors"
              >
                {isProcessing
                  ? "⏳ Memproses AI..."
                  : "🪄 Hapus Background (Tes AI)"}
              </button>

              <button
                onClick={handlePrintPDF}
                className="w-full bg-pink-600 text-white py-2 rounded-lg hover:bg-pink-700 transition-colors"
              >
                📄 Unduh PDF Depan + Belakang
              </button>
              
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <p className="text-xs text-blue-800">
                  💡 <strong>Preview</strong> menampilkan koordinat asli dari template.<br/>
                  <strong>PDF</strong> otomatis disesuaikan agar hasil print sesuai dengan preview.
                </p>
              </div>
            </div>
          </div>

          {/* ========== LIVE PREVIEW ========== */}
          <div className="bg-neutral-100 p-6 rounded-xl border border-neutral-200/60 flex flex-col items-center justify-start gap-8 overflow-y-auto max-h-[800px]">
            {/* --- SISI DEPAN --- */}
            <div className="w-full flex flex-col items-center">
              <h3 className="text-sm font-semibold text-neutral-600 mb-3 w-full text-left">
                🎴 Sisi Depan
              </h3>
              <div
                ref={frontCardRef}
                className="shadow-xl relative overflow-hidden"
                style={{
                  width: "324px",
                  height: "204px",
                  borderRadius: "8px",
                }}
              >
                {/* Template Background Image */}
                <img
                  src={currentFront.image}
                  alt="Template Front"
                  crossOrigin="anonymous"
                  className="absolute inset-0 w-full h-full"
                  style={{ borderRadius: "8px", objectFit: "fill", zIndex: 10 }}
                />

                {/* Photo Area (Di atas template) */}
                <div
                  className="absolute overflow-hidden flex items-center justify-center"
                  style={{
                    top: currentFront.photo.top,
                    left: currentFront.photo.left,
                    width: currentFront.photo.width,
                    height: currentFront.photo.height,
                    borderRadius: currentFront.photo.borderRadius || '0px',
                    zIndex: 20, // Layer atas
                  }}
                >
                  {processedImg || imageSrc ? (
                    <img
                      src={processedImg || imageSrc || ""}
                      alt="Customer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="bg-white/50 text-pink-600 text-xs text-center p-2 rounded border-2 border-dashed border-pink-300">
                      Area Foto
                    </div>
                  )}
                </div>

                {/* Layer 3: Text - PREVIEW (Koordinat Asli dari Template) */}
                {/* Name */}
                <div
                  className="absolute font-bold whitespace-nowrap"
                  style={{
                    top: currentFront.name.top,
                    left: currentFront.name.left,
                    width: currentFront.name.width,
                    fontSize: currentFront.name.fontSize,
                    color: currentFront.name.color,
                    lineHeight: '1',
                    padding: 0,
                    margin: 0,
                    zIndex: 30,
                  }}
                >
                  {name}
                </div>

                {/* Zodiac */}
                <div
                  className="absolute font-semibold whitespace-nowrap"
                  style={{
                    top: currentFront.zodiac.top,
                    left: currentFront.zodiac.left,
                    width: currentFront.zodiac.width,
                    fontSize: currentFront.zodiac.fontSize,
                    color: currentFront.zodiac.color,
                    lineHeight: '1',
                    padding: 0,
                    margin: 0,
                    zIndex: 30,
                  }}
                >
                  {zodiac}
                </div>

                {/* Hobby */}
                <div
                  className="absolute font-semibold whitespace-nowrap"
                  style={{
                    top: currentFront.hobby.top,
                    left: currentFront.hobby.left,
                    width: currentFront.hobby.width,
                    fontSize: currentFront.hobby.fontSize,
                    color: currentFront.hobby.color,
                    lineHeight: '1',
                    padding: 0,
                    margin: 0,
                    zIndex: 30,
                  }}
                >
                  {hobby}
                </div>
              </div>
            </div>

            {/* --- SISI BELAKANG --- */}
            <div className="w-full flex flex-col items-center pt-6 border-t border-neutral-200">
              <h3 className="text-sm font-semibold text-neutral-600 mb-3 w-full text-left">
                🎴 Sisi Belakang
              </h3>
              <div
                ref={backCardRef}
                className="shadow-xl relative overflow-hidden"
                style={{
                  width: "324px",
                  height: "204px",
                  borderRadius: "8px",
                }}
              >
                {/* Template Background Image */}
                <img
                  src={currentBack.image}
                  alt="Template Back"
                  crossOrigin="anonymous"
                  className="absolute inset-0 w-full h-full"
                  style={{ borderRadius: "8px", objectFit: "fill" }}
                />

                {/* Serial Number — di atas barcode */}
                <div
                  className="absolute text-center font-mono font-bold whitespace-nowrap"
                  style={{
                    bottom: currentBack.serial.bottom,
                    right: currentBack.serial.right,
                    width: currentBack.serial.width,
                    fontSize: currentBack.serial.fontSize,
                    color: currentBack.serial.color,
                    lineHeight: '1',
                    padding: 0,
                    margin: 0,
                  }}
                >
                  {serial}
                </div>

                <div
                  className="absolute flex items-center justify-center"
                  style={{
                    bottom: currentBack.barcode.bottom,
                    right: currentBack.barcode.right,
                    width: currentBack.barcode.width,
                    height: currentBack.barcode.height,
                  }}
                >
                  <Barcode
                    value={serial || "000000"}
                    width={0.8}
                    height={22}
                    displayValue={false}
                    margin={0}
                    background="transparent"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* ========== HIDDEN PDF RENDER (dengan offset kompensasi) ========== */}
        <div className="fixed -left-[9999px] -top-[9999px] pointer-events-none">
          {/* SISI DEPAN - PDF */}
          <div
            ref={frontCardPdfRef}
            className="shadow-xl relative overflow-hidden"
            style={{
              width: "324px",
              height: "204px",
              borderRadius: "8px",
            }}
          >
            <img
              src={currentFront.image}
              alt="Template Front"
              crossOrigin="anonymous"
              className="absolute inset-0 w-full h-full"
              style={{ borderRadius: "8px", objectFit: "fill", zIndex: 10 }}
            />

            {/* Photo Area */}
            <div
              className="absolute overflow-hidden flex items-center justify-center"
              style={{
                top: currentFront.photo.top,
                left: currentFront.photo.left,
                width: currentFront.photo.width,
                height: currentFront.photo.height,
                borderRadius: currentFront.photo.borderRadius || '0px',
                zIndex: 20,
              }}
            >
              {processedImg || imageSrc ? (
                <img
                  src={processedImg || imageSrc || ""}
                  alt="Customer"
                  className="w-full h-full object-cover"
                />
              ) : null}
            </div>

            {/* Text dengan OFFSET KOMPENSASI untuk PDF */}
            <div
              className="absolute font-bold whitespace-nowrap"
              style={{
                top: pdfFront.name.top,
                left: pdfFront.name.left,
                width: pdfFront.name.width,
                fontSize: pdfFront.name.fontSize,
                color: pdfFront.name.color,
                lineHeight: '1',
                padding: 0,
                margin: 0,
                zIndex: 30,
              }}
            >
              {name}
            </div>

            <div
              className="absolute font-semibold whitespace-nowrap"
              style={{
                top: pdfFront.zodiac.top,
                left: pdfFront.zodiac.left,
                width: pdfFront.zodiac.width,
                fontSize: pdfFront.zodiac.fontSize,
                color: pdfFront.zodiac.color,
                lineHeight: '1',
                padding: 0,
                margin: 0,
                zIndex: 30,
              }}
            >
              {zodiac}
            </div>

            <div
              className="absolute font-semibold whitespace-nowrap"
              style={{
                top: pdfFront.hobby.top,
                left: pdfFront.hobby.left,
                width: pdfFront.hobby.width,
                fontSize: pdfFront.hobby.fontSize,
                color: pdfFront.hobby.color,
                lineHeight: '1',
                padding: 0,
                margin: 0,
                zIndex: 30,
              }}
            >
              {hobby}
            </div>
          </div>

          {/* SISI BELAKANG - PDF */}
          <div
            ref={backCardPdfRef}
            className="shadow-xl relative overflow-hidden"
            style={{
              width: "324px",
              height: "204px",
              borderRadius: "8px",
            }}
          >
            <img
              src={currentBack.image}
              alt="Template Back"
              crossOrigin="anonymous"
              className="absolute inset-0 w-full h-full"
              style={{ borderRadius: "8px", objectFit: "fill" }}
            />

            <div
              className="absolute text-center font-mono font-bold whitespace-nowrap"
              style={{
                bottom: currentBack.serial.bottom,
                right: currentBack.serial.right,
                width: currentBack.serial.width,
                fontSize: currentBack.serial.fontSize,
                color: currentBack.serial.color,
                lineHeight: '1',
                padding: 0,
                margin: 0,
              }}
            >
              {serial}
            </div>

            <div
              className="absolute flex items-center justify-center"
              style={{
                bottom: currentBack.barcode.bottom,
                right: currentBack.barcode.right,
                width: currentBack.barcode.width,
                height: currentBack.barcode.height,
              }}
            >
              <Barcode
                value={serial || "000000"}
                width={0.8}
                height={22}
                displayValue={false}
                margin={0}
                background="transparent"
              />
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
