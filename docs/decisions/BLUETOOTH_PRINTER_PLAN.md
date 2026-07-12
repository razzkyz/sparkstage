# Rencana Implementasi Printer Bluetooth EPPOS EP5859 V2

## 1. Spesifikasi Singkat Printer
**EPPOS EP5859 V2** adalah printer termal portabel berukuran kecil yang sangat ideal untuk kasir/POS.
*   **Tipe Cetak:** Thermal Line Printing (Tidak butuh tinta, hanya kertas termal).
*   **Lebar Kertas:** 58mm (Area cetak efektif 48mm).
*   **Kapasitas Baris:** Sekitar 32 karakter per baris (Font standar ukuran normal).
*   **Konektivitas:** Bluetooth 4.0 / USB.
*   **Protokol Komunikasi:** Kompatibel dengan instruksi perintah **ESC/POS** (Standar industri yang dibuat Epson).
*   **Baterai:** Portable (Dapat dicas).

## 2. Alur Kerja (Workflow) Sistem Web ke Printer (Bluetooth & USB)
Karena SparkStage berbasis web (React/Vite), kita akan menggunakan **Web Bluetooth API** (untuk tablet di produksi) dan **Web Serial API / WebUSB API** (untuk laptop/PC saat development) bawaan dari browser. Kedua metode ini menerima format data (ESC/POS) yang persis sama, sehingga kodenya bisa digunakan secara dinamis.

1.  **Inisiasi Koneksi:** 
    *   Kasir menekan tombol "Hubungkan Printer" di dashboard.
    *   Browser akan memunculkan *native pop-up* untuk mencari perangkat Bluetooth di sekitar.
    *   Kasir memilih printer "EPPOS" dari daftar.
2.  **Membangun Koneksi GATT:** 
    *   Web Bluetooth API akan mengkoneksikan web ke *GATT Server* printer.
    *   Sistem mencari *Service UUID* dan *Characteristic UUID* dari printer tersebut yang mengizinkan operasi "Write" (Tulis data).
3.  **Encoding Struk (ESC/POS):** 
    *   Saat kasir menekan "Cetak Struk" (pada pesanan yang sudah *Pickup/Selesai*), data pesanan dari Supabase di-generate menjadi teks.
    *   Teks tersebut ditambahkan dengan kode-kode rahasia (ESC/POS) untuk mengatur *styling*. (Contoh: `ESC a 1` untuk rata tengah, `GS ! 17` untuk huruf besar).
    *   Semua data ini diubah menjadi *byte array* (Uint8Array) karena printer Bluetooth hanya mengerti bit/byte.
4.  **Pengiriman & Pencetakan:** 
    *   Byte data dikirim ke printer dalam ukuran kecil (chunks).
    *   Printer menerima instruksi dan langsung mencetak struk secara instan.

> **Catatan Kompatibilitas:** Web Bluetooth dan Web Serial berjalan sangat mulus di Chrome (Android/Windows/Mac). Jika kasir menggunakan tablet/HP Android (Bluetooth) atau Laptop PC (Kabel USB), sistem ini akan berjalan lancar 100%. Untuk laptop yang tidak memiliki Bluetooth, Web Serial API sangat cocok digunakan untuk testing dengan kabel USB.

## 3. Rencana Implementasi Kode (Markdown Plan)

### Fase 1: Pembuatan Utilitas ESC/POS
Kita tidak butuh *library* besar, cukup membuat satu file *helper* untuk perintah dasar ESC/POS.
*   **File:** `frontend/src/lib/escpos.ts`
*   **Isi Fungsi:**
    *   `initPrinter()` - Mereset printer ke pengaturan awal.
    *   `alignCenter()`, `alignLeft()` - Mengatur perataan teks.
    *   `boldOn()`, `boldOff()` - Mengatur ketebalan font.
    *   `text(string)` - Mengubah teks string menjadi Uint8Array.
    *   `feed(lines)` - Memberi spasi / enter agar kertas bisa disobek.

### Fase 2: Pembuatan Custom Hook Dual-Mode (USB & Bluetooth)
Mengelola siklus hidup koneksi agar mudah dipanggil di komponen React. Hook ini mendeteksi apakah kasir memilih USB atau Bluetooth.
*   **File:** `frontend/src/hooks/useThermalPrinter.ts`
*   **Fungsi:** 
    *   State `isConnected`, `isPrinting`, `printerDevice`, `connectionType` ('bluetooth' | 'usb').
    *   Method `connectBluetooth()`: Memanggil `navigator.bluetooth.requestDevice()`.
    *   Method `connectUSB()`: Memanggil `navigator.serial.requestPort()` (Web Serial API).
    *   Method `print(receiptData: Uint8Array)`: Mengecek jenis koneksi yang aktif, lalu mengirimkan chunk data 512 bytes baik via Bluetooth GATT atau Web Serial Writer.

### Fase 3: Desain Template Struk Toko
Membuat fungsi generator yang menerima data pesanan (items, total, info pembeli) dan meramunya menggunakan fungsi ESC/POS dari Fase 1.
*   **File:** `frontend/src/utils/receiptGenerator.ts`
*   **Format Struk 58mm (32 Karakter):**
    ```text
             SPARKSTAGE           
      Jl. Contoh Alamat, Jakarta  
    --------------------------------
    No: PRX-614-09E
    Tgl: 12-Jul-2026 15:17
    Plg: Spark User
    --------------------------------
    Hoodie                    25.000
    Maxi skirt                20.000
    Top                       15.000
    --------------------------------
    Total                     60.000
    --------------------------------
          LUNAS / SUDAH DIAMBIL     
    
       Terima kasih atas pesanan    
               Anda!              
    ```

### Fase 4: Integrasi ke UI `ProductOrders.tsx`
*   Tambahkan tombol **"Hubungkan Printer"** di menu header kasir atau di modal detail.
*   Pada `ProductOrderDetailsModal.tsx`, tambahkan tombol **"Cetak Struk"** yang muncul jika status pesanan valid (misal: Selesai / Lunas).
*   Ketika tombol ditekan, panggil `receiptGenerator` lalu kirim ke hook `useThermalPrinter`.

## 4. Requirement Tambahan untuk Web
Karena fitur ini menggunakan *Hardware API* bawaan Browser:
*   Aplikasi website wajib menggunakan **HTTPS** (Web Bluetooth/Serial diblokir di HTTP, kecuali `localhost` untuk development).
*   Proses pairing/connect *harus* dipicu dari interaksi klik langsung oleh user (`onClick`), tidak bisa auto-connect secara otomatis di *background* untuk alasan keamanan browser.
*   Untuk mode USB di Windows, terkadang pengguna perlu mengganti driver USB bawaan pabrik menjadi WinUSB menggunakan *Zadig* agar Web Serial/WebUSB Chrome bisa mengakses printer tersebut (ini hanya untuk laptop/PC development).
