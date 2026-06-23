# 📚 Documentation

SparkStage documentation organized for easy access.

## 🎯 Quick Access

### Recent/Active Docs
- **[architecture.md](architecture.md)** - System architecture overview
- **[SECURITY_CHECKLIST.md](SECURITY_CHECKLIST.md)** - Security best practices
- **[SECURITY_IMPLEMENTATION_MAY_2026.md](SECURITY_IMPLEMENTATION_MAY_2026.md)** - Security features

### Repository Cleanup (2024-06-23)
- **[CLEANUP_COMPLETE.md](CLEANUP_COMPLETE.md)** - Summary of repository cleanup
- **[DOCUMENTATION_RESTRUCTURE.md](DOCUMENTATION_RESTRUCTURE.md)** - Restructure details
- **[SECURITY_FIX_ENV_FILES.md](SECURITY_FIX_ENV_FILES.md)** - ENV security fix
- **[PUSH_GUIDE.md](PUSH_GUIDE.md)** - Complete guide to push changes
- **[READY_TO_PUSH.md](READY_TO_PUSH.md)** - Ready-to-copy push commands

## 📁 Documentation Structure

### Active Documentation

#### `/runbooks/`
Operational procedures and how-to guides:
- Database migrations
- Payment flows (DOKU)
- WhatsApp notifications
- Stock opname system
- RajaOngkir shipping
- Kasir role setup
- And more...

#### `/decisions/`
Architectural decision records (ADRs):
- Design decisions
- Technology choices
- Feature constraints
- System trade-offs

### Historical Documentation

#### `/archive/`
Archived documentation for completed features and migrations:

- **`/archive/r2-migration/`** (21 files)
  - Cloudflare R2 migration from ImageKit
  - Setup guides, checklists, troubleshooting

- **`/archive/shipping/`** (16 files)
  - RajaOngkir integration
  - Shipping cache implementation
  - Rate limiting fixes

- **`/archive/stock-opname/`** (13 files)
  - Stock management system
  - Opening, adjustments, opname features

- **`/archive/migrations/`** (10 files)
  - Data migrations (products, lucky charm, etc.)
  - Migration guides and summaries

- **`/archive/deployment/`** (5 files)
  - Deployment procedures
  - Verification checklists

- **`/archive/features/`** (10 files)
  - Staff reports
  - Retail product features
  - Print role
  - Kasir scanning

See: **[archive/README.md](archive/README.md)** for complete archive index

## 🔍 Finding Documentation

### By Topic
- **Architecture:** `architecture.md`
- **Security:** `SECURITY_*.md` files
- **Operations:** `/runbooks/`
- **Decisions:** `/decisions/`
- **History:** `/archive/`

### By Feature
- **Tickets:** `/runbooks/entrance-booking.md`
- **Products:** `/runbooks/admin-product-entry.md`
- **Payments:** `/runbooks/doku-payments.md`
- **Shipping:** `/runbooks/rajaongkir/` or `/archive/shipping/`
- **Stock:** `/runbooks/stock-opname-system.md` or `/archive/stock-opname/`
- **WhatsApp:** `/runbooks/WHATSAPP_README.md`

### By Date
- **Recent (2024-06):** Cleanup docs in root `/docs/`
- **May 2024:** Security implementation
- **Historical:** `/archive/` folder

## 📝 Documentation Guidelines

### Where to Put New Docs

- **Active procedures** → `/runbooks/`
- **Design decisions** → `/decisions/`
- **Architecture** → Update `architecture.md`
- **Completed features** → Eventually move to `/archive/`
- **Project context** → Update `/AGENTS.md` (root)

### When to Archive

Move docs to `/archive/` when:
- Feature is complete and stable
- Migration is finished
- Deployment is done
- No longer actively referenced

### Keep Docs Compact

Before creating new docs:
1. Check if existing doc can be updated
2. Consolidate related information
3. Remove redundant content
4. Keep archives lean

## 🔐 Sensitive Information

**Never commit:**
- Actual `.env` files (only `.env.*.example`)
- API keys or secrets
- Database passwords
- Private keys
- Customer data

**Always use:**
- Placeholders in example files
- Environment variables
- Supabase secrets for production

## 📚 Other Documentation

### Outside `/docs/`

- **Root `/README.md`** - Project overview
- **Root `/AGENTS.md`** - AI agent context
- **Root `/QUICK_START.md`** - Quick start guide
- **`/scripts/*/README.md`** - Script documentation
- **`/templates/README.md`** - Template documentation
- **`/assets/README.md`** - Asset documentation

## 🆘 Need Help?

1. Check `/runbooks/` for procedures
2. Review `architecture.md` for system design
3. See `/decisions/` for rationale
4. Search `/archive/` for historical context
5. Ask team members

---

**Last Updated:** 2024-06-23 (Repository Cleanup)
