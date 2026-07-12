/**
 * ESC/POS Command Builder for Thermal Printers
 * Digunakan untuk merakit instruksi byte array (Uint8Array) untuk printer kasir (Bluetooth/USB)
 */

export class EscPosBuilder {
  private buffer: number[] = [];

  constructor() {
    this.init();
  }

  /**
   * Reset / Initialize printer
   */
  init(): this {
    this.buffer.push(0x1b, 0x40); // ESC @
    return this;
  }

  /**
   * Text Alignment
   */
  alignLeft(): this {
    this.buffer.push(0x1b, 0x61, 0x00); // ESC a 0
    return this;
  }

  alignCenter(): this {
    this.buffer.push(0x1b, 0x61, 0x01); // ESC a 1
    return this;
  }

  alignRight(): this {
    this.buffer.push(0x1b, 0x61, 0x02); // ESC a 2
    return this;
  }

  /**
   * Text Styling (Bold)
   */
  bold(enable: boolean = true): this {
    this.buffer.push(0x1b, 0x45, enable ? 0x01 : 0x00); // ESC E n
    return this;
  }

  /**
   * Text Size
   */
  size(width: 1 | 2 = 1, height: 1 | 2 = 1): this {
    let n = 0;
    if (width === 2) n += 0x10;
    if (height === 2) n += 0x01;
    this.buffer.push(0x1d, 0x21, n); // GS ! n
    return this;
  }

  /**
   * Tambahkan Teks (dengan encoding UTF-8 standar)
   * Catatan: Thermal printer basic biasanya memakai encoding ASCII/CodePage
   * tapi untuk teks standar bahasa Inggris/Indonesia (tanpa karakter khusus), 
   * UTF-8 byte stream sudah cukup.
   */
  text(str: string): this {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(str);
    this.buffer.push(...Array.from(bytes));
    return this;
  }

  /**
   * Cetak garis pembatas standar 58mm (32 karakter)
   */
  separator(char: string = '-'): this {
    this.text(char.repeat(32));
    this.newline();
    return this;
  }

  /**
   * Pindah Baris / Enter (Line Feed)
   */
  newline(count: number = 1): this {
    for (let i = 0; i < count; i++) {
      this.buffer.push(0x0a); // LF
    }
    return this;
  }

  /**
   * Mengeluarkan kertas / margin bawah agar mudah disobek
   * (Printer portable jarang memiliki auto-cutter, jadi butuh paper feed manual)
   */
  feedAndTear(): this {
    this.newline(4); // Tambah spasi 4 baris
    return this;
  }

  /**
   * Generate hasil akhir dalam bentuk Uint8Array
   * yang siap dikirim via Web Bluetooth / Web Serial
   */
  build(): Uint8Array {
    return new Uint8Array(this.buffer);
  }
}
