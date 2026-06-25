# Rollerblade Page - Layout Design

## Visual Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│                      SECTION 1: HERO BANNER                  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                                                         │  │
│  │              [BACKGROUND IMAGE OVERLAY]                │  │
│  │                                                         │  │
│  │              ROLLERBLADE ARENA                         │  │
│  │     Nikmati pengalaman bermain rollerblade            │  │
│  │                                                         │  │
│  │     [📍 Pembayaran Sesi Dilakukan On-Site]            │  │
│  │                                                         │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│             SECTION 2: PROMO CARDS (3-COLUMN GRID)          │
│                                                              │
│         Promo & Penawaran Spesial                           │
│  Jangan lewatkan penawaran menarik untuk pengalaman        │
│                                                              │
│  ┌───────────┐    ┌───────────┐    ┌───────────┐          │
│  │  [IMAGE]  │    │  [IMAGE]  │    │  [IMAGE]  │          │
│  │  [PROMO]  │    │  [GRUP]   │    │  [NEW]    │          │
│  │           │    │           │    │           │          │
│  │ Weekend   │    │  Paket    │    │  Kelas    │          │
│  │ Special   │    │  Grup     │    │  Pemula   │          │
│  │           │    │           │    │           │          │
│  │ Diskon    │    │ Booking   │    │ Belajar   │          │
│  │ 20%...    │    │ untuk...  │    │ roller... │          │
│  └───────────┘    └───────────┘    └───────────┘          │
│                                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│         SECTION 3: INFO BANNER (FULL-WIDTH GRADIENT)        │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  [PINK GRADIENT BACKGROUND]                           │  │
│  │                                                         │  │
│  │  LEFT COLUMN:                  RIGHT COLUMN:          │  │
│  │  Bermain Rollerblade           ┌──────┐  ┌──────┐    │  │
│  │  di SparkStage                 │ 🛼   │  │ 👨‍🏫  │    │  │
│  │                                 │      │  │      │    │  │
│  │  SparkStage menyediakan        └──────┘  └──────┘    │  │
│  │  arena rollerblade yang        ┌──────┐  ┌──────┐    │  │
│  │  aman dan nyaman...            │ 🏟️   │  │ ⏰   │    │  │
│  │                                 │      │  │      │    │  │
│  │                                 └──────┘  └──────┘    │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│           SECTION 4: GALLERY GRID (4 COLUMNS)               │
│                                                              │
│                    Galeri Foto                              │
│         Lihat keseruan bermain rollerblade                  │
│                                                              │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐                   │
│  │      │  │      │  │      │  │      │                   │
│  │ IMG1 │  │ IMG2 │  │ IMG3 │  │ IMG4 │                   │
│  │      │  │      │  │      │  │      │                   │
│  └──────┘  └──────┘  └──────┘  └──────┘                   │
│  Arena     Peralatan Instruktur Seru                       │
│  Luas      Berkualit  Profesion Bersama                    │
│                                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│       SECTION 5: BOTTOM CTA BANNER (FULL-WIDTH IMAGE)       │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  [BACKGROUND IMAGE WITH DARK OVERLAY]                 │  │
│  │                                                         │  │
│  │           Siap Mencoba Rollerblade?                    │  │
│  │  Datang langsung ke SparkStage dan nikmati            │  │
│  │         pengalaman bermain yang seru!                  │  │
│  │                                                         │  │
│  │  ┌─────────────────┐    ┌─────────────────┐          │  │
│  │  │ 💳 Pembayaran   │    │ 📍 SparkStage   │          │  │
│  │  │    On-Site      │    │    Arena        │          │  │
│  │  └─────────────────┘    └─────────────────┘          │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Section Details

### Section 1: Hero Banner
**Height:** 70vh (min 500px)  
**Background:** Image with dark overlay (40% opacity)  
**Text:** Centered, white, large typography  
**Badge:** Bottom, on-site payment info  
**Animation:** Background image zoom on hover

### Section 2: Promo Cards
**Layout:** 3-column grid (desktop), 1-column (mobile)  
**Card Height:** Auto (image 256px + content)  
**Hover Effect:** Card lift (-8px) + shadow  
**Badge Position:** Top-right corner of image  
**Colors:** Red (PROMO), Blue (GRUP), Green (NEW)

### Section 3: Info Banner
**Layout:** 2-column split (desktop), stacked (mobile)  
**Background:** Linear gradient (pink-600 → rose-600 → pink-600)  
**Left:** Text content (60% width)  
**Right:** 2x2 feature grid (40% width)  
**Card Style:** White/20% opacity, backdrop blur

### Section 4: Gallery Grid
**Layout:** 4-column grid (desktop), 2-column (mobile)  
**Aspect Ratio:** 1:1 (square)  
**Gap:** 24px between items  
**Hover Effect:** Image zoom + caption overlay  
**Caption:** Bottom gradient overlay on hover

### Section 5: Bottom CTA
**Height:** Auto (py-20)  
**Background:** Image with 70% dark overlay  
**Content:** Centered text + 2 info cards  
**Card Style:** White/20% opacity, backdrop blur  
**Text:** White, large typography

## Responsive Breakpoints

### Desktop (≥1024px)
- 3-column promo cards
- 4-column gallery
- Side-by-side info layout
- Full-width hero & CTA

### Tablet (768-1023px)
- 2-3 column promo cards
- 3-4 column gallery
- May stack info sections
- Smaller typography

### Mobile (<768px)
- 1 column promo cards
- 2 column gallery
- Stacked info sections
- Smaller hero height (min-height)

## Color Palette

**Primary Pink:** `#ff2d72` to `#ff6b9d`  
**Background Gradient:** `from-pink-50` to `white`  
**Text Primary:** `gray-900`  
**Text Secondary:** `gray-600`  
**Overlay Dark:** `rgba(0,0,0,0.4)` to `rgba(0,0,0,0.7)`  
**Badge Colors:**
- Red (PROMO): `bg-red-500`
- Blue (GRUP): `bg-blue-500`
- Green (NEW): `bg-green-500`

## Typography

**Hero Title:** 
- Desktop: `text-6xl md:text-8xl`
- Weight: `font-black`
- Tracking: `tracking-tight`

**Section Headings:**
- Size: `text-4xl md:text-5xl`
- Weight: `font-bold`

**Card Titles:**
- Size: `text-2xl`
- Weight: `font-bold`

**Body Text:**
- Size: `text-xl`
- Weight: `font-normal`

**Badge Text:**
- Size: `text-sm`
- Weight: `font-bold`

## Animation Effects

### Hover Animations
1. **Card Lift:** `hover:-translate-y-2`
2. **Image Zoom:** `hover:scale-110` (duration: 500ms)
3. **Shadow Grow:** `hover:shadow-2xl` (duration: 300ms)
4. **Opacity Fade:** `opacity-0 hover:opacity-100`

### Transition Timing
- **Card hover:** 300ms
- **Image zoom:** 500ms
- **Overlay fade:** 300ms
- **Scale effects:** 200ms

## Content Guidelines

### Hero Banner
- **Image:** Wide landscape, action shot of arena
- **Title:** Short, impactful (2-4 words)
- **Subtitle:** One sentence, max 15 words

### Promo Cards
- **Image:** Square/portrait, clear subject
- **Title:** 2-4 words, attention-grabbing
- **Description:** 1-2 sentences, max 20 words
- **Badge:** 1-2 words uppercase

### Gallery
- **Images:** Square crop, consistent style
- **Captions:** 2-5 words descriptive
- **Mix:** Variety of shots (people, equipment, arena)

### CTA Banner
- **Image:** Dynamic action shot
- **Title:** Question or statement (4-8 words)
- **Subtitle:** Call to action (10-15 words)

## Accessibility Notes

- Use `alt` text for all images
- Maintain color contrast (WCAG AA)
- Keyboard navigation support
- Focus visible on interactive elements
- Semantic HTML structure

## Performance Tips

- Lazy load images below fold
- Use WebP format when supported
- Optimize images: 70-80% quality
- Set explicit width/height to prevent CLS
- Use CDN for faster delivery

## Future Enhancements

- [ ] Video hero banner option
- [ ] Auto-rotating promo carousel
- [ ] Lightbox for gallery images
- [ ] Instagram feed integration
- [ ] Testimonial section
- [ ] Pricing table
- [ ] Booking calendar widget (optional)
- [ ] Live availability indicator

---

**Last Updated:** 2026-06-24  
**Design Status:** Complete  
**Implementation:** Static content (CMS-ready)
