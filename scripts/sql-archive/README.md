# SQL Scripts Archive

This folder contains archived SQL scripts that were previously in the project root.

## Contents

### Test & Debug Scripts
- `test_*.sql` - Testing queries for various features
- `check_*.sql` - Database verification queries
- `debug_*.sql` - Debug queries for troubleshooting
- `verify_*.sql` - Verification scripts

### Migration Scripts
- `migrate_*.sql` - Data migration scripts
- `cleanup_migration.sql` - Migration cleanup
- `rollback_*.sql` - Rollback scripts

### Setup & Configuration
- `assign_*.sql` - Role assignment scripts
- `activate_*.sql` - Feature activation scripts
- `insert_*.sql` - Data insertion scripts
- `fonnte-migration-essential.sql` - WhatsApp/Fonnte setup

### Maintenance & Analysis
- `audit_*.sql` - Audit and revenue analysis
- `find_*.sql` - Search queries
- `fix_*.sql` - Bug fix queries
- `temp_schema.sql` - Temporary schema for testing

## Usage

These scripts are kept for reference and historical purposes.

**⚠️ Important:**
- Always review scripts before running them
- Most are for testing or one-time migrations
- Use with caution on production databases
- Prefer creating new migration files in `supabase/migrations/` for schema changes

## Active SQL Scripts

For actively maintained SQL:
- Database migrations: `/supabase/migrations/`
- Active utility scripts: `/scripts/` (root level, non-archived)
