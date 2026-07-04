# SparkStage Documentation Index

**Last Updated:** 2026-07-04

## 📖 Overview

This index helps you find the right documentation quickly. All documentation has been organized into logical folders.

---

## 🚀 Quick Start

- **Getting Started:** `QUICK_START.md` - Basic setup and development guide

---

## 📋 Documentation Structure

### 1. **Architecture** (`architecture/`)
- `architecture.md` - Current system architecture and risk zones
- `stock-opname-flow.md` - Stock management system architecture

### 2. **Runbooks** (`runbooks/`)
Operational guides and how-to documentation:

**Database & Migrations:**
- `db-migrations.md` - Database change workflow

**Payments:**
- `doku-payments.md` - DOKU payment flow
- `WHATSAPP_README.md` - WhatsApp invoice notifications

**Product Management:**
- `admin-product-entry.md` - Product data-entry rules
- `imagekit-migration.md` - ImageKit migration status
- `r2-migration.md` - R2 Migration (ImageKit → Cloudflare R2)
- `R2_EGRESS_SETUP.md` - Zero cost R2 egress setup
- `R2_MIGRATION_QUICKSTART.md` - R2 migration quick start

**Stock Management:**
- `stock-opname-system.md` - Stock Opname system overview
- `STOCK_OPNAME_QUICKSTART.md` - Stock Opname quick start
- `STOCK_OPNAME_FINALIZE.md` - Stock Opname finalize workflow
- `STOCK_REALTIME_AUTO_REFRESH.md` - Realtime auto-refresh implementation

**Shipping:**
- (RajaOngkir integration docs - check for specific files)

**Categories:**
- `category-display-order.md` - How to manage category display order (NEW 2026-07-04)
- `PANDUAN_IMPORT_SHOP.md` - Shop category import guide

**Rollerblade:**
- `ROLLERBLADE_ROLE_SETUP.md` - Rollerblade role configuration
- `CREATE_ROLLERBLADE_USER.md` - Create Rollerblade users

**User Management:**
- `kasir-setup.md` - Kasir (Cashier) role setup

### 3. **Decisions** (`decisions/`)
Stable feature decisions and architectural choices:
- `voucher-system.md` - Voucher behavior and rules
- `FINAL_NAVIGATION_STRUCTURE.md` - Navigation structure decisions
- `SHOP_NAVIGATION_STRUCTURE.md` - Shop navigation structure
- `ROLLERBLADE_RENTAL_SYSTEM.md` - Rollerblade rental system design
- `ROLLERBLADE_CMS_PLAN.md` - Rollerblade CMS planning

### 4. **Deployment** (`deployment/`)
Deployment guides and readiness docs:
- `CATEGORY_DISPLAY_ORDER_READY.md` - Category display order feature (NEW 2026-07-04)
- `DEPLOYMENT_SUCCESS_RENTAL.md` - Rental system deployment
- `KATEGORI_BARU_SIAP_DEPLOY.md` - New category deployment
- `NEW_GLAM_CATEGORIES_READY.md` - Glam categories deployment

### 5. **Testing** (`testing/`)
Testing guides and checklists:
- `QUICK_TEST_KATEGORI.md` - Quick category testing
- `TESTING_CHECKLIST_KATEGORI_BARU.md` - New category testing checklist

### 6. **Archive** (`archive/`)
Completed features, migrations, and historical records:

**Features** (`archive/features/`)
- `GLAM_CATEGORIES_DEPLOYED.md` - GLAM categories implementation
- `LAPORAN_FINAL_KATEGORI_GLAM.md` - Final GLAM category report
- `LAPORAN_KATEGORI_SHOP_GLAM.md` - Shop/GLAM category report
- `SHOP_DEPARTMENT_CATEGORIES.md` - Shop department categories
- `SHOP_DEPARTMENT_COMPLETE.md` - Shop department completion
- `SHOP_DEPARTMENT_ADDED.md` - Shop department addition
- `DRESSING_NAVBAR_COMPLETE.md` - Dressing room navbar
- `NAVBAR_DRESSING_SUMMARY.md` - Navbar dressing summary
- `STOCK_EDIT_DELETE_COMPLETE.md` - Stock CRUD operations (if exists)

**Fixes** (`archive/fixes/`)
- `GLAM_CATEGORIES_FRONTEND_FIXED.md` - GLAM frontend fixes
- `KATEGORI_FIX_COMPLETE.md` - Category fixes
- `SHOP_DEPARTMENT_FIX.md` - Shop department fixes
- `FIX_MISSING_CHARM_PRODUCTS.md` - Missing charm products fix
- `FIX_SHOP_TAB_NOT_WORKING.md` - Shop tab fixes
- `FIX_SHOP_DEPARTMENT_IMPORT.md` - Shop import fixes

**R2 Migration** (`archive/r2-migration/`)
- Historical R2 migration documentation

**Shipping** (`archive/shipping/`)
- RajaOngkir & shipping integration historical docs

**Stock Opname** (`archive/stock-opname/`)
- Stock management system historical docs

**Migrations** (`archive/migrations/`)
- Data migration documentation

**Deployment** (`archive/deployment/`)
- Historical deployment procedures

---

## 🔍 Finding Documentation

### By Topic:

**Categories & Navigation:**
- Main navigation: `decisions/FINAL_NAVIGATION_STRUCTURE.md`
- Shop structure: `decisions/SHOP_NAVIGATION_STRUCTURE.md`
- Display order: `runbooks/category-display-order.md` ⭐ NEW
- GLAM categories: `archive/features/GLAM_CATEGORIES_DEPLOYED.md`

**Stock Management:**
- Overview: `runbooks/stock-opname-system.md`
- Quick start: `runbooks/STOCK_OPNAME_QUICKSTART.md`
- Finalize: `runbooks/STOCK_OPNAME_FINALIZE.md`
- Realtime: `runbooks/STOCK_REALTIME_AUTO_REFRESH.md`

**Payments:**
- DOKU flow: `runbooks/doku-payments.md`
- WhatsApp: `runbooks/WHATSAPP_README.md`

**Image Management:**
- R2 migration: `runbooks/r2-migration.md`
- Quick start: `runbooks/R2_MIGRATION_QUICKSTART.md`
- ImageKit: `runbooks/imagekit-migration.md`

**Rollerblade:**
- System design: `decisions/ROLLERBLADE_RENTAL_SYSTEM.md`
- CMS plan: `decisions/ROLLERBLADE_CMS_PLAN.md`
- Role setup: `runbooks/ROLLERBLADE_ROLE_SETUP.md`
- Create users: `runbooks/CREATE_ROLLERBLADE_USER.md`

### By Status:

**Active/Current:**
- Check `runbooks/` and `decisions/` folders

**Completed/Historical:**
- Check `archive/` folder

**Ready to Deploy:**
- Check `deployment/` folder

**Testing:**
- Check `testing/` folder

---

## 📝 Contributing

When adding new documentation:

1. **Active operational docs** → `runbooks/`
2. **Design decisions** → `decisions/`
3. **Deployment guides** → `deployment/`
4. **Testing guides** → `testing/`
5. **Completed features** → `archive/features/`
6. **Historical fixes** → `archive/fixes/`

Keep root directory clean - only `AGENTS.md`, `README.md`, and this index should be at root level.

---

## 🔗 Related Files

- **Main Reference:** `AGENTS.md` (Workspace memory and quick reference)
- **Architecture:** `architecture/architecture.md`
- **Quick Start:** `QUICK_START.md`

---

**Note:** This index is maintained manually. Please update when adding or moving documentation files.
