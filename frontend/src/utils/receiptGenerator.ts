import { EscPosBuilder } from '../lib/escpos';

export interface ReceiptItem {
  name: string;
  variant: string;
  price: number;
  subtotal: number;
  qty: number;
}

export interface ReceiptData {
  orderCode: string;
  date: string;
  customerName: string;
  items: ReceiptItem[];
  total: number;
}

/**
 * Format currency ke dalam Rupiah (tanpa simbol Rp, hanya angka berpemisah)
 */
const formatCurrency = (amount: number) => {
  return amount.toLocaleString('id-ID');
};

/**
 * Membuat baris item dengan perataan Kiri - Kanan (total 32 karakter)
 * Contoh: "Hoodie                    25.000"
 */
const createLineRow = (leftText: string, rightText: string, maxWidth = 32) => {
  if (leftText.length + rightText.length > maxWidth) {
    // Jika nama terlalu panjang, potong dan tambahkan spasi
    const maxLeft = maxWidth - rightText.length - 1;
    leftText = leftText.substring(0, maxLeft);
  }
  const spaces = maxWidth - (leftText.length + rightText.length);
  return leftText + ' '.repeat(Math.max(0, spaces)) + rightText;
};

/**
 * Generate byte array (Uint8Array) untuk printer ESC/POS
 */
export const generatePickupReceipt = (data: ReceiptData): Uint8Array => {
  const printer = new EscPosBuilder();

  // --- HEADER ---
  printer
    .init()
    .alignCenter()
    .bold(true)
    .text('SPARK STAGE 55')
    .newline()
    .bold(false)
    .text('Jl. Flores No. 8, Citarum')
    .newline()
    .text('Kec. Bandung Wetan, Bandung')
    .newline()
    .text('Jawa Barat 40115')
    .newline()
    .newline()
    .text('Telp: 0815-5820-0089')
    .newline()
    .text('IG: @spark_stage55')
    .newline()
    .separator(); // --------------------------------

  // --- ORDER INFO ---
  printer
    .alignLeft()
    .text(`No.   : ${data.orderCode}`)
    .newline()
    .text(`Tgl.  : ${data.date}`)
    .newline()
    .text(`Cust. : ${data.customerName}`)
    .newline()
    .separator();

  // --- ITEMS ---
  data.items.forEach(item => {
    // Baris 1: Nama Produk (potong jika terlalu panjang agar tidak merusak layout)
    let title = `${item.name}`;
    if (item.variant && item.variant.toLowerCase() !== 'default') {
      title += ` - ${item.variant}`;
    }
    // Jika lebih dari 32, potong
    if (title.length > 32) title = title.substring(0, 32);
    
    printer
      .alignLeft()
      .text(title)
      .newline();

    // Baris 2: Qty x Harga        Subtotal
    const leftText = `${item.qty}x ${formatCurrency(item.price)}`;
    const rightText = formatCurrency(item.subtotal);
    
    printer
      .text(createLineRow(leftText, rightText))
      .newline();
  });

  // --- TOTAL ---
  printer.separator();
  printer
    .bold(true)
    .text(createLineRow('TOTAL', formatCurrency(data.total)))
    .newline()
    .bold(false)
    .separator();

  // --- STATUS (LUNAS/PICKUP) ---
  printer
    .alignCenter()
    .newline()
    .bold(true)
    .text('LUNAS / SUDAH DIAMBIL')
    .newline()
    .newline()
    .bold(false)
    
  // --- FOOTER ---
  printer
    .text('Terima Kasih Telah Berbelanja')
    .newline()
    .text('di SPARK STAGE 55')
    .newline()
    .separator()
    .newline()
    .text('Belanja minimum Rp300.000')
    .newline()
    .text('dan dapatkan 300 SPARK COINS!')
    .newline()
    .newline()
    .text('Kumpulkan dan tukarkan')
    .newline()
    .text('SPARK COINS untuk service')
    .newline()
    .text('pilihan di SPARK ME UP!')
    .newline()
    .newline()
    .text('Face • Hair • Nails • Body')
    .newline()
    .newline()
    .text('Simpan struk ini sebagai bukti')
    .newline()
    .text('kepemilikan SPARK COINS.')
    .newline()
    .newline()
    .bold(true)
    .text('SEE YOU IN THE SPOTLIGHT *')
    .newline()
    .bold(false)
    .text('@spark_stage55')
    .newline()
    .feedAndTear(); // Feed paper

  return printer.build();
};
