# 🚀 SparkStage US - Commands to Run in `sparkstageus` Folder

## 📍 IMPORTANT: Copy File Ini ke Folder `sparkstageus`

```powershell
copy C:\SparkDoku\sparkstage\SPARKSTAGEUS_SETUP_COMMANDS.md C:\SparkDoku\sparkstageus\SETUP_CHECKLIST.md
```

---

## ✅ Command Sequence - Jalankan di `C:\SparkDoku\sparkstageus`

### Step 1: Navigate to US Folder
```powershell
cd C:\SparkDoku\sparkstageus
```

### Step 2: Clean Git & Initialize
```powershell
Remove-Item -Recurse -Force .git
git init
git branch -M main
```

### Step 3: Install Dependencies
```powershell
npm install
cd frontend
npm install
npm install @stripe/stripe-js@^2.4.0 @stripe/react-stripe-js@^2.4.0
cd ..
```

### Step 4: Setup Environment
```powershell
copy .env.us-example .env.local
notepad .env.local
```
**Edit dengan Stripe credentials!**

### Step 5: Create US Supabase Project
Go to: https://supabase.com/dashboard
- New Project
- Name: sparkstage-us
- Region: **US West (Oregon)**
- Get credentials

### Step 6: Link to US Project
```powershell
supabase link --project-ref [US-PROJECT-REF]
```

### Step 7: Update Migrations
```powershell
# Edit migration files
cd supabase\migrations
# Replace doku_* with stripe_* columns
cd ..\..
```

### Step 8: Push Migrations
```powershell
npm run supabase:db:push
```

### Step 9: Set Secrets
```powershell
supabase secrets set STRIPE_SECRET_KEY=sk_test_xxxxx
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxxxx
supabase secrets set PUBLIC_APP_URL=http://localhost:5174
supabase secrets set APP_ALLOWED_ORIGINS=http://localhost:5174
```

### Step 10: Update Dev Port
```powershell
notepad vite.config.ts
```
Add: `server: { port: 5174 }`

### Step 11: Start Dev Server
```powershell
npm run dev
```

Open: http://localhost:5174

---

## 🎯 Quick Copy-Paste Commands

```powershell
# All-in-one setup (run from sparkstageus folder)
cd C:\SparkDoku\sparkstageus
Remove-Item -Recurse -Force .git
git init
npm install
cd frontend && npm install && npm install @stripe/stripe-js @stripe/react-stripe-js && cd ..
copy .env.us-example .env.local
notepad .env.local
```

Then manually:
1. Create US Supabase project
2. Edit `.env.local` dengan credentials
3. `supabase link --project-ref [US-REF]`
4. Edit migrations (doku → stripe)
5. `npm run supabase:db:push`
6. Set secrets
7. `npm run dev`

---

## 📚 Dokumentasi Lengkap

Baca ini untuk detail:
- `.agents\skills\sparkstage-us-builder\SEPARATE_FOLDER_SETUP.md`
- `.agents\skills\sparkstage-us-builder\QUICKSTART_ID.md`
- `.agents\skills\sparkstage-us-builder\QUICK_COMMANDS.md`
