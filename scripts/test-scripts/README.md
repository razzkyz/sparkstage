# Test Scripts

Collection of test and verification scripts for various features and integrations.

## Contents

### RajaOngkir / Shipping Tests
- `test-rajaongkir-subdistrict.js` - Test RajaOngkir subdistrict API
- `test-district-quick.js` - Quick district lookup test

### R2 / Storage Tests
- `test-r2-simple.mjs` - Simple R2 storage test

### Database Tests
- `test_categories.js` - Test category queries
- `test_query.js` - General query testing
- `test_query_fetch.ts` - Test query with fetch
- `test_rpc.ts` - Test RPC functions

## Usage

Most of these scripts can be run with Node.js or Deno:

```bash
# Node.js
node test-rajaongkir-subdistrict.js

# Deno
deno run --allow-net --allow-env test_rpc.ts
```

## Environment

Make sure to set up proper environment variables (`.env.local`) before running:
- Supabase credentials
- API keys (RajaOngkir, R2, etc.)

## Note

These are **development/testing scripts only** - not used in production.
