# 🚀 Quick Start Guide

Welcome to SparkStage! This guide helps you navigate the repository quickly.

## 📖 Essential Documentation

### For Developers
- **[README.md](README.md)** - Project overview and setup
- **[AGENTS.md](AGENTS.md)** - Project memory for AI agents
- **[docs/architecture.md](docs/architecture.md)** - System architecture

### For Operations
- **[docs/runbooks/](docs/runbooks/)** - Operational procedures
- **[docs/decisions/](docs/decisions/)** - Architectural decisions

## 🎯 Common Tasks

### Push Changes to GitHub
See: **[docs/READY_TO_PUSH.md](docs/READY_TO_PUSH.md)** or **[PUSH_NOW.txt](PUSH_NOW.txt)**

### Repository Cleanup Info
- **[docs/CLEANUP_COMPLETE.md](docs/CLEANUP_COMPLETE.md)** - What was cleaned up
- **[docs/DOCUMENTATION_RESTRUCTURE.md](docs/DOCUMENTATION_RESTRUCTURE.md)** - Restructure details
- **[docs/PUSH_GUIDE.md](docs/PUSH_GUIDE.md)** - Complete push guide

### Security
- **[docs/SECURITY_FIX_ENV_FILES.md](docs/SECURITY_FIX_ENV_FILES.md)** - ENV security fix

## 📁 Repository Structure

```
sparkstage/
├── 📄 README.md                    # Project overview
├── 📄 AGENTS.md                    # AI agent context
├── 📄 QUICK_START.md               # This file
├── 📄 PUSH_NOW.txt                 # Quick push commands
│
├── 📁 frontend/                    # Vite + React + TypeScript
│   ├── src/pages/                 # Route pages
│   ├── src/components/            # UI components
│   ├── src/hooks/                 # React hooks
│   └── src/lib/                   # Utilities
│
├── 📁 supabase/                    # Backend
│   ├── migrations/                # Database schema
│   └── functions/                 # Edge Functions
│
├── 📁 docs/                        # Documentation
│   ├── architecture.md            # System architecture
│   ├── runbooks/                  # How-to guides
│   ├── decisions/                 # Design decisions
│   ├── archive/                   # Historical docs
│   ├── CLEANUP_COMPLETE.md        # Cleanup summary
│   ├── DOCUMENTATION_RESTRUCTURE.md
│   ├── PUSH_GUIDE.md
│   ├── READY_TO_PUSH.md
│   └── SECURITY_FIX_ENV_FILES.md
│
├── 📁 scripts/                     # Utility scripts
│   ├── test-scripts/              # Test scripts
│   ├── debug-scripts/             # Debug tools
│   ├── utility-scripts/           # Utilities
│   └── sql-archive/               # SQL scripts
│
├── 📁 assets/                      # Images & static files
├── 📁 config/                      # Service configs
├── 📁 logs/                        # Build logs
└── 📁 templates/                   # Email templates
```

## 🔧 Development Commands

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Run linter
npm run lint

# Deploy database migrations
npm run supabase:db:push

# Start Supabase functions locally
npm run supabase:functions:serve
```

## 🔐 Environment Setup

1. Copy example files:
   ```bash
   cp .env.production.example .env.local
   cp .env.r2-migration.example .env.r2-migration
   ```

2. Fill in your credentials (never commit these!)

3. See `.env.*.example` files for required variables

## 📚 More Documentation

### Active Documentation
- `/docs/runbooks/` - Operational guides
- `/docs/decisions/` - Architecture decisions
- `/docs/architecture.md` - System overview

### Historical/Archive
- `/docs/archive/` - Completed features, migrations
  - `r2-migration/` - R2 migration docs
  - `shipping/` - Shipping integration
  - `stock-opname/` - Stock management
  - `migrations/` - Data migrations
  - `deployment/` - Deployment guides
  - `features/` - Feature documentation

## 🆘 Need Help?

- Check `/docs/runbooks/` for specific procedures
- See `AGENTS.md` for project context
- Review `/docs/architecture.md` for system design
- Ask team members or check Git history

## 🚀 Ready to Push?

Quick commands in **[PUSH_NOW.txt](PUSH_NOW.txt)**

Detailed guide in **[docs/READY_TO_PUSH.md](docs/READY_TO_PUSH.md)**

---

**Welcome aboard!** 🎉
