# Configuration Files

Additional configuration files for various services and integrations.

## Contents

### Cloudflare R2 CORS Configuration
- `r2-cors.json` - CORS policy for R2 bucket

## R2 CORS Configuration

The `r2-cors.json` file defines Cross-Origin Resource Sharing (CORS) rules for the Cloudflare R2 bucket.

### Usage

Apply CORS configuration to R2 bucket:

```bash
# Using wrangler
wrangler r2 bucket cors put sparkstage-public-assets --config r2-cors.json

# Or manually via Cloudflare dashboard
```

### CORS Policy

Allows:
- Origins: `https://sparkstage55.com`, `https://www.sparkstage55.com`
- Methods: `GET`, `PUT`, `POST`, `DELETE`
- Headers: `Content-Type`, `Authorization`

## Note

This folder contains **service-specific configurations** that don't fit in the root directory or other standard config locations.

For main application configs, see:
- Root-level config files (`.env`, `vite.config.ts`, etc.)
- `/supabase/config.toml` - Supabase configuration
- `/frontend/` configs - Frontend-specific settings
