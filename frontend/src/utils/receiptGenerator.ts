import { EscPosBuilder } from '../lib/escpos';

export interface ReceiptItem {
  name: string;
  price: number;
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
    .text('SPARKSTAGE')
    .newline()
    .bold(false)
    .text('Senayan Park, Jakarta')
    .newline()
    .separator(); // --------------------------------

  // --- ORDER INFO ---
  printer
    .alignLeft()
    .text(`No : ${data.orderCode}`)
    .newline()
    .text(`Tgl: ${data.date}`)
    .newline()
    .text(`Plg: ${data.customerName}`)
    .newline()
    .separator();

  // --- ITEMS ---
  data.items.forEach(item => {
    let itemName = item.name;
    if (item.qty > 1) {
      itemName = `${item.qty}x ${item.name}`;
    }
    const itemPrice = formatCurrency(item.price);
    
    printer
      .text(createLineRow(itemName, itemPrice))
      .newline();
  });

  // --- TOTAL ---
  printer.separator();
  printer
    .bold(true)
    .text(createLineRow('Total', formatCurrency(data.total)))
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
    .bold(false)
    .newline()
    
  // --- FOOTER ---
  printer
    .text('Terima kasih atas pesanan')
    .newline()
    .text('Anda!')
    .newline()
    .feedAndTear(); // Feed paper

  return printer.build();
};
