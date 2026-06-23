# 📦 Safe Push Guide - Repository Cleanup

## Status Summary

✅ **Safe to push:**
- Documentation reorganization (71+ files moved)
- SQL scripts cleanup (32+ files moved)
- Test/utility scripts organized
- Assets organized (images, logs, configs)
- `.env.r2-upload` removed from Git tracking
- `.gitignore` updated to protect all `.env` files

⚠️ **Security fix included:**
- `.env.r2-upload` containing R2 credentials removed from Git

## Pre-Push Checklist

### 1. Verify No Credentials Will Be Pushed ✅

```bash
# Check what .env files are staged
git status | grep ".env"

# Should only see:
# D  .env.r2-upload (deleted)
# A  .env.r2-upload.example (new, safe)
# M  .gitignore (modified)
```

### 2. Verify .gitignore Is Working ✅

```bash
# Test that actual .env files are ignored
git check-ignore .env .env.local .env.r2-upload

# All should return: .gitignore:XX:.env...
```

### 3. Check Staged Changes

```bash
git status
```

Expected changes:
- ✅ Many `D` (deleted) - old docs moved to archive
- ✅ Many `A` (added) - new folder structure with READMEs
- ✅ `M` (modified) - AGENTS.md, .gitignore, adminMenu.ts
- ✅ `D` .env.r2-upload - removed from tracking
- ✅ `A` .env.r2-upload.example - safe template added

## Step-by-Step Push Instructions

### Step 1: Stage All Changes

```bash
# Add all changes (safe because .gitignore protects .env files)
git add .
```

### Step 2: Create Comprehensive Commit

```bash
git commit -m "refactor: major repository cleanup and security fix

SECURITY FIX:
- Remove .env.r2-upload from Git tracking (contained R2 credentials)
- Update .gitignore to protect ALL .env files
- Add .env.r2-upload.example with placeholders

DOCUMENTATION CLEANUP:
- Move 71 .md files to docs/archive/ (categorized)
  - r2-migration/ (19 files)
  - shipping/ (16 files)
  - stock-opname/ (13 files)
  - migrations/ (9 files)
  - deployment/ (5 files)
  - features/ (9 files)
- Add README.md for each archive section

SCRIPT ORGANIZATION:
- Move 32 SQL scripts to scripts/sql-archive/
- Move test scripts to scripts/test-scripts/ (8 files)
- Move debug scripts to scripts/debug-scripts/ (7 files)
- Move utility scripts to scripts/utility-scripts/ (6 files)
- Add README.md for each script folder

ASSET ORGANIZATION:
- Move images to assets/test-images/ and assets/screenshots/
- Move logs to logs/ folder
- Move configs to config/ folder
- Move templates to templates/ folder

UI CHANGES:
- Remove 'E-Commerce & Retail Classification' heading from product form
- Disable retail products menu in admin sidebar
- Disable all dressing room menu items except 'Dressing Room Manager'

REPO MAP UPDATE:
- Update AGENTS.md with new folder structure
- Keep only essential files in root
- Create comprehensive documentation guides

Result: Clean, organized repository ready for production"
```

### Step 3: Verify Commit

```bash
# Review what will be pushed
git log -1 --stat

# Check no .env files (except .example) are included
git show --name-only | grep ".env"
# Should only show: .env.r2-upload.example (safe)
```

### Step 4: Push to Remote

```bash
# Push to main branch
git push origin main

# Or if you're on a different branch
git push origin <your-branch-name>
```

### Step 5: Verify on GitHub

After pushing, check GitHub:
1. Go to repository on GitHub
2. Verify folder structure is correct
3. **CRITICAL:** Check that `.env.r2-upload` is NOT visible
4. Verify only `.env.*.example` files are visible

## Post-Push Actions

### 1. Rotate R2 Credentials (URGENT!) 🔴

Since `.env.r2-upload` was previously committed:

```bash
# 1. Go to Cloudflare Dashboard
https://dash.cloudflare.com → R2 → Settings → API Tokens

# 2. Delete old token with Access Key ID:
06ba5bc801b1617527e7ca0fa6c44e0b

# 3. Create new R2 API token

# 4. Update local .env.r2-upload with new credentials

# 5. Update Supabase Edge Function secrets
supabase secrets set R2_ACCESS_KEY_ID=new_key_here
supabase secrets set R2_SECRET_ACCESS_KEY=new_secret_here
```

### 2. Monitor for Issues

After pushing:
- ✅ Check CI/CD pipeline (if any)
- ✅ Verify build still works: `npm run build`
- ✅ Test locally: `npm run dev`
- ✅ Check for any broken imports/paths

### 3. Team Communication

Notify team members:
```
📢 Repository Cleanup Complete

Changes:
- Docs reorganized into docs/archive/
- Scripts moved to organized folders
- .env files now properly protected
- UI: Disabled some admin menu items

Action Required:
- Pull latest changes: git pull
- Verify your local .env files are intact
- Rotate R2 credentials if you have access

Questions? See PUSH_GUIDE.md
```

## Troubleshooting

### If Git Shows Untracked .env Files

```bash
# This is NORMAL and GOOD!
# Untracked .env files stay local (not pushed)
? .env
? .env.local
? .env.r2-upload
? .env.r2-migration
```

### If .env Files Are Staged

```bash
# Remove from staging (keep local)
git reset .env .env.local .env.r2-upload
```

### If Push Is Rejected

```bash
# Pull latest changes first
git pull origin main --rebase

# Resolve any conflicts
# Then push again
git push origin main
```

## Quick Command Summary

```bash
# 1. Final verification
git status
git check-ignore .env .env.local .env.r2-upload

# 2. Stage and commit
git add .
git commit -m "refactor: major repository cleanup and security fix [see commit body]"

# 3. Push
git push origin main

# 4. Verify on GitHub
# Check .env files are not visible

# 5. URGENT: Rotate R2 credentials
# See Post-Push Actions above
```

## Files Protected by .gitignore

✅ These will NEVER be pushed:
- `.env`
- `.env.local`
- `.env.r2-upload`
- `.env.r2-migration`
- `.env.*` (any .env.something)

✅ These WILL be pushed (safe templates):
- `.env.production.example`
- `.env.r2-migration.example`
- `.env.r2-upload.example`
- `.env.us-example`

---

**Ready to push?** Follow the steps above! ✨

**Priority after push:** 🔴 Rotate R2 credentials immediately
