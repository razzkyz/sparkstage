import * as xlsx from "xlsx";
import type { ProductRetail } from "../types";

// =====================================================
// SHARED EXCEL FORMAT — harus sama persis antara Indo & US
// Kolom: ID, Name, Slug, Description, Price, Stock,
//        Weight, Length, Width, Height, Image_URL,
//        Is_Active, Category_ID, Subcategory_ID,
//        Variant, Department
// =====================================================

export interface ExcelProductRow {
  ID?: number;
  Name: string;
  Slug: string;
  Description: string;
  Price: number;
  Stock: number;
  Weight: number;
  Length?: number;
  Width?: number;
  Height?: number;
  Image_URL?: string;
  Is_Active: string; // "Yes" | "No"
  Category_ID?: number;
  Subcategory_ID?: number;
  Variant?: string;
  Department?: string;
}

/**
 * Export a list of Retail Products to an Excel file.
 * Format kolom ini identik dengan yang digunakan di website US
 * agar file bisa langsung diimport di sana tanpa perubahan.
 */
export const exportProductsToExcel = (products: ProductRetail[], filename = "sparkstage_products.xlsx") => {
  const data: ExcelProductRow[] = products.map((p) => ({
    ID: p.id,
    Name: p.name,
    Slug: p.slug,
    Description: p.description || "",
    Price: p.price,
    Stock: p.stock,
    Weight: p.weight,
    Length: p.length || 0,
    Width: p.width || 0,
    Height: p.height || 0,
    Image_URL: p.image || "",
    Is_Active: p.is_active ? "Yes" : "No",
    Category_ID: p.retail_category_id || undefined,
    Subcategory_ID: p.retail_subcategory_id || undefined,
    Variant: p.variant || "",
    Department: p.retail_category || "",
  }));

  const worksheet = xlsx.utils.json_to_sheet(data);
  const workbook = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(workbook, worksheet, "Products");
  
  xlsx.writeFile(workbook, filename);
};

/**
 * Parse an uploaded Excel file and return the list of products as JSON.
 * Membaca format yang sama (kolom kapital) sehingga file yang diexport
 * dari website US bisa diimport ke Indo dan sebaliknya.
 */
export const parseExcelToProducts = (file: File): Promise<ExcelProductRow[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) throw new Error("No data found in file.");
        
        const workbook = xlsx.read(data, { type: "binary" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        const jsonData = xlsx.utils.sheet_to_json<ExcelProductRow>(worksheet);
        resolve(jsonData);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = (error) => {
      reject(error);
    };

    reader.readAsBinaryString(file);
  });
};
