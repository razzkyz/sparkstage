# Panduan Import Produk ke Department "Shop"

## Format Excel yang Benar

### Kolom Wajib:

| Kolom | Nilai | Contoh | Keterangan |
|-------|-------|--------|------------|
| `product_name` | Nama produk | "Mar" Lettering Welded Charm | Wajib diisi di baris pertama variant |
| `department` | **shop** | shop | LOWERCASE, bukan "Shop" |
| `category` | Nama kategori shop | SPARK MY CHARMS | Harus sesuai kategori di database |
| `sub_category` | Nama subcategory | WELDED CHARM | Opsional, kosongkan jika tidak ada |
| `variant_sku` | SKU variant | ICIJ171 | Wajib untuk setiap variant |
| `variant_name` | Nama variant | "Mar" Lettering | Nama display variant |
| `price` | Harga | 20000 | Harga jual |
| `stock` | Stok | 8 | Jumlah stok |

### ⚠️ Kesalahan Umum:

1. **Department dengan huruf kapital** ❌
   ```
   department: Shop  ← SALAH
   department: shop  ← BENAR ✅
   ```

2. **Category digabung dengan subcategory** ❌
   ```
   category: SPARK MY CHARMS, WELDED CHARM  ← SALAH
   
   category: SPARK MY CHARMS       ← BENAR ✅
   sub_category: WELDED CHARM      ← BENAR ✅
   ```

3. **Sub_category diisi "ya"** ❌
   ```
   sub_category: ya  ← SALAH
   
   sub_category: WELDED CHARM  ← BENAR ✅
   sub_category:               ← BENAR ✅ (kosong jika tidak ada)
   ```

## Kategori Shop yang Tersedia

Berdasarkan screenshot, kategori shop yang tersedia:

1. **SPARK MY CHARMS** - Untuk produk charm/aksesoris
2. **SPARK MY FACE** - Untuk produk makeup/face
3. **SPARK MY HAIR** - Untuk produk rambut
4. **SPARK MY NAILS** - Untuk produk kuku
5. **SPARK MY STYLE** - Untuk produk fashion/style

## Contoh Excel yang Benar

### Single Variant:
```
| product_name              | department | category         | sub_category | variant_name  | variant_sku | price  | stock |
|---------------------------|------------|------------------|--------------|---------------|-------------|--------|-------|
| "Mar" Lettering Charm     | shop       | SPARK MY CHARMS  | WELDED CHARM | "Mar" Letter  | ICIJ171     | 20000  | 8     |
```

### Multiple Variants:
```
| product_name              | department | category         | sub_category | variant_name  | variant_sku | price  | stock |
|---------------------------|------------|------------------|--------------|---------------|-------------|--------|-------|
| Abstract Heart Charm      | shop       | SPARK MY CHARMS  | WELDED CHARM | Abstract Red  | ICIJ920     | 20000  | 8     |
|                           |            |                  |              | Abstract Blue | ICIJ921     | 20000  | 7     |
|                           |            |                  |              | Abstract Gold | ICIJ922     | 20000  | 6     |
```

## Cara Memperbaiki Excel Anda

### Langkah 1: Pisahkan Category dan Subcategory

Jika Anda punya data seperti ini:
```
category: "SPARK MY CHARMS, WELDED CHARM"
```

Ubah menjadi:
```
category: SPARK MY CHARMS
sub_category: WELDED CHARM
```

### Langkah 2: Lowercase Department

Ubah semua:
```
department: Shop  → department: shop
department: SHOP  → department: shop
```

### Langkah 3: Hapus Nilai "ya" di sub_category

Jika `sub_category` diisi "ya", kosongkan atau isi dengan nama subcategory yang benar.

## Template Excel Kosong

Download template yang sudah benar dari admin:
1. Buka **Store & Inventory**
2. Klik **Import Excel**
3. Klik **Download Template**

Template akan include semua kategori yang tersedia.

## Troubleshooting

### Produk masih masuk ke Glam?

**Penyebab:**
1. Department ditulis dengan huruf besar ("Shop" bukan "shop")
2. Nama category tidak sesuai dengan database
3. Category digabung dengan subcategory dalam satu kolom

**Solusi:**
- Pastikan `department: shop` (lowercase)
- Pastikan `category` sesuai dengan list di atas (case-sensitive)
- Pisahkan category dan subcategory ke kolom berbeda

### Kategori tidak ditemukan?

**Cek dulu kategori yang tersedia:**
1. Buka Store & Inventory
2. Klik tab "Shop"
3. Lihat dropdown "All Categories"
4. Copy nama kategori persis seperti yang terlihat

### Produk tidak muncul di Shop tab?

**Kemungkinan:**
1. Produk masuk ke department lain (cek di Glam/CharmBar)
2. Category salah (lihat di Store & Inventory → All Departments)
3. Produk inactive (cek kolom `is_active: ya`)

---

**Need Help?**
Export data produk yang sudah benar dari Shop tab, lalu gunakan sebagai reference untuk format yang benar.
