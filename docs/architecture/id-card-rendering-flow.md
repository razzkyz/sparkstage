# ID Card Rendering Flow Architecture

## Overview

Sistem ID Card menggunakan **dual-rendering** approach untuk memastikan hasil PDF sesuai dengan preview yang terlihat di browser.

## Architecture Diagram

```
┌───────────────────────────────────────────────────────────────┐
│                    TEMPLATE MANAGER                           │
│              /admin/id-card-templates                         │
├───────────────────────────────────────────────────────────────┤
│  Admin Input:                                                 │
│  • Name top: 87px                                            │
│  • Zodiac top: 115px                                         │
│  • Hobby top: 143px                                          │
│                                                               │
│  Stored in Database → id_card_templates.config_front         │
└───────────────────┬───────────────────────────────────────────┘
                    │
                    │ Load Template
                    ▼
┌───────────────────────────────────────────────────────────────┐
│                    PRINT TEST PAGE                            │
│               /admin/dev-id-card-test                         │
└───────────────────────────────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
        ▼                       ▼
┌──────────────────┐   ┌──────────────────┐
│  PREVIEW RENDER  │   │   PDF RENDER     │
│   (Visible)      │   │   (Hidden)       │
├──────────────────┤   ├──────────────────┤
│ frontCardRef     │   │ frontCardPdfRef  │
│ backCardRef      │   │ backCardPdfRef   │
├──────────────────┤   ├──────────────────┤
│ Coordinates:     │   │ Coordinates:     │
│ • Name: 87px     │   │ • Name: 80px     │
│ • Zodiac: 115px  │   │ • Zodiac: 107px  │
│ • Hobby: 143px   │   │ • Hobby: 134px   │
├──────────────────┤   ├──────────────────┤
│ Uses:            │   │ Uses:            │
│ currentFront     │   │ pdfFront         │
│ (original)       │   │ (+ PDF_OFFSET)   │
└──────────────────┘   └──────────────────┘
        │                       │
        │                       │
        ▼                       ▼
    User Sees              html2canvas
    Preview                captures this
                               │
                               ▼
                          jsPDF creates
                          PDF file
                               │
                               ▼
                          Download
                          ID-Card.pdf
```

## Data Flow

### 1. Template Configuration

```typescript
// Stored in database: id_card_templates
{
  config_front: {
    name: { top: "87px", left: "175px", ... },
    zodiac: { top: "115px", left: "175px", ... },
    hobby: { top: "143px", left: "175px", ... }
  }
}
```

### 2. Load Template

```typescript
const activeTemplate = templates.find(t => t.id === selectedTemplateId);
const currentFront = activeTemplate 
  ? { image: activeTemplate.front_image_url, ...activeTemplate.config_front }
  : TEMPLATE_FRONT;
```

### 3. Preview Rendering (User-Visible)

```typescript
// Uses original coordinates from template
<div ref={frontCardRef}>
  <div style={{ top: currentFront.name.top }}>
    {name}
  </div>
  <div style={{ top: currentFront.zodiac.top }}>
    {zodiac}
  </div>
  <div style={{ top: currentFront.hobby.top }}>
    {hobby}
  </div>
</div>
```

### 4. PDF Rendering (Hidden)

```typescript
// Calculate coordinates with offset
const pdfFront = {
  ...currentFront,
  name: { ...currentFront.name, top: getPdfCoordinate(currentFront.name.top, -7) },
  zodiac: { ...currentFront.zodiac, top: getPdfCoordinate(currentFront.zodiac.top, -8) },
  hobby: { ...currentFront.hobby, top: getPdfCoordinate(currentFront.hobby.top, -9) },
};

// Hidden render with adjusted coordinates
<div ref={frontCardPdfRef} className="fixed -left-[9999px]">
  <div style={{ top: pdfFront.name.top }}>
    {name}
  </div>
  <div style={{ top: pdfFront.zodiac.top }}>
    {zodiac}
  </div>
  <div style={{ top: pdfFront.hobby.top }}>
    {hobby}
  </div>
</div>
```

### 5. PDF Generation

```typescript
const handlePrintPDF = async () => {
  // Capture HIDDEN element (with offset)
  const canvas = await html2canvas(frontCardPdfRef.current);
  
  // Convert to PDF
  const pdf = new jsPDF({ ... });
  pdf.addImage(canvas.toDataURL(), 'PNG', 0, 0, 85.6, 54);
  pdf.save('ID-Card-DEPAN.pdf');
};
```

## Why Dual Rendering?

### Problem

```
Browser Preview → html2canvas → PDF
    87px       →    renders   → 87px ❌ (turun karena line-height, font-rendering)
```

### Solution

```
Preview (visible)  → User sees correct position
   87px            → ✅ Matches template

PDF Render (hidden) → html2canvas → PDF
   80px (-7)        →   renders   → 87px ✅ (kompensasi offset)
```

## Offset Compensation Logic

```typescript
const PDF_OFFSET = {
  name: -7,    // Kompensasi: koordinat turun 7px
  zodiac: -8,  // Kompensasi: koordinat turun 8px
  hobby: -9,   // Kompensasi: koordinat turun 9px
};

const getPdfCoordinate = (originalPx: string, offsetPx: number): string => {
  const num = parseInt(originalPx);      // "87px" → 87
  return `${num + offsetPx}px`;          // 87 + (-7) → "80px"
};
```

## CSS Considerations

### Critical Styles

```typescript
{
  lineHeight: '1',    // No extra spacing
  padding: 0,         // No padding offset
  margin: 0,          // No margin offset
  position: 'absolute',
  whiteSpace: 'nowrap',
}
```

These styles are **identical** in both preview and PDF renders to ensure consistency.

## Edge Cases

### 1. Long Names

```typescript
// Width constraint
width: '130px'
overflow: 'hidden'
textOverflow: 'ellipsis'
whiteSpace: 'nowrap'
```

### 2. Multiple Templates

Each template can have different coordinates, but uses **same offset compensation**.

Future improvement: Per-template offset configuration.

### 3. Font Variations

Current system assumes same font rendering. If font changes, offset might need adjustment.

## Performance

- **Preview Render**: Real-time, reactive to user input
- **PDF Render**: Hidden, only rendered during PDF generation
- **Impact**: Minimal - hidden element doesn't affect layout or performance

## Maintenance

### Adjust Offset

If PDF results don't match preview:

1. Open `frontend/src/pages/admin/DevIDCardTest.tsx`
2. Locate `PDF_OFFSET` constant
3. Adjust values
4. Test and verify

### Add New Fields

1. Add to template config in database
2. Add to preview render
3. Add to PDF render with offset
4. Add offset value to `PDF_OFFSET`

## Future Enhancements

### Per-Template Offset

```typescript
// Store offset in database
{
  config_front: { ... },
  pdf_offset: { name: -7, zodiac: -8, hobby: -9 }
}
```

### Auto-Calibration

AI-based system that compares preview screenshot with PDF, automatically calculates optimal offset.

### Real-time Preview Comparison

Side-by-side preview showing:
- Left: Browser preview (original coordinates)
- Right: Simulated PDF result (with offset)

---

**Architecture Version:** 1.0  
**Last Updated:** 2026-07-22  
**Status:** Production Ready
