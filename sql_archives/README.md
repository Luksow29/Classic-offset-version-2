# SQL Archives

This directory contains archived SQL scripts that were previously in the root directory. These files are organized by purpose for easy reference.

## Directory Structure

### `/debug` (2 files)
Debug scripts used for troubleshooting database issues.
- Contains: `debug_*.sql` files

### `/test` (4 files)
Test scripts used for database testing and validation.
- Contains: `test_*.sql` files

### `/fixes` (7 files)
Scripts used to fix database issues, particularly dashboard metrics.
- Contains: `fix_dashboard_*.sql`, `fix_loyalty_*.sql`, etc.

### `/chat` (6 files)
Chat system related SQL scripts including RLS policies.
- Contains: `chat_rls_*.sql` files
- Includes dev, prod, fix, and diagnostic versions

### `/check` (4 files)
Scripts for checking database structure and status.
- Contains: `check_*.sql` files
- Used for validation and inspection

### `/setup` (20 files)
Setup and initialization scripts, including step-by-step installation files.
- Contains: `step*.sql`, `create_*.sql` files
- Also includes: loyalty program upgrade, notification system setup, manual function deployments

### `/misc` (7 files)
Miscellaneous scripts including diagnostics, RLS tests, and service charge integration.
- Contains: authentication diagnostics, RLS disable tests, service charge integration files
- Various one-off scripts

## Total Files Archived: 50 SQL files

## Important Notes

1. **Active Migrations**: All current database migrations remain in `supabase/migrations/`
2. **Documentation**: Database schema documentation moved to `docs/DATABASE_PAYMENT_SCHEMA.sql`
3. **DO NOT DELETE**: These files are archived for reference, not for deletion
4. **Reference Only**: Most of these scripts were one-time fixes or debugging tools

## If You Need to Use These Files

1. Review the appropriate subdirectory based on your need
2. Check the file dates to understand the context
3. Consider if the issue still exists or was resolved
4. Test in development environment before running in production

## Cleanup Date
**Archived on:** October 1, 2025  
**Cleaned by:** GitHub Copilot Automated Cleanup

---

For questions about specific scripts, refer to git history or the project maintainer.
