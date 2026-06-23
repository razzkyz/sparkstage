# Debug Scripts

Collection of debugging and verification scripts for troubleshooting production issues.

## Contents

### Database Checks
- `check_actual_user_count.ts` - Verify user count in database
- `check_table_exists.js` - Check if specific tables exist
- `check-cats.ts` - Check categories structure

### Integration Checks
- `check_whatsapp.js` - Verify WhatsApp/Fonnte integration
- `check-ticket-status.js` - Check ticket order status

### Setup Debugging
- `debug-whatsapp-setup.ps1` - PowerShell script for WhatsApp setup debugging

### Analytics
- `audit_revenue.ts` - Revenue audit and analysis (moved to utility-scripts)

## Usage

### Node.js Scripts
```bash
node check_whatsapp.js
node check-ticket-status.js
```

### TypeScript/Deno Scripts
```bash
deno run --allow-net --allow-env check_actual_user_count.ts
deno run --allow-net --allow-env check-cats.ts
```

### PowerShell Scripts
```powershell
.\debug-whatsapp-setup.ps1
```

## When to Use

- **Production Issues:** Use these to debug live problems
- **Post-Deployment:** Verify integrations after deploy
- **Data Verification:** Check data integrity
- **Setup Validation:** Verify configurations are correct

## Note

These scripts often connect to **production databases** - use with caution!
