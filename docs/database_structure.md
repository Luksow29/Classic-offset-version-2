# Database Structure Documentation (Classic Offset)

## Schema: public

### Tables
- customers
- orders
- payments
- materials
- staff
- ... (மற்ற business tables)

### Views
- order_summary_with_dues
- all_order_summary

### Functions
- approve_order_request
- get_dashboard_metrics
- get_financial_summary
- ... (மற்ற custom business logic functions)

### Privileges
- Roles: postgres, anon, authenticated, service_role
- Privileges: All roles have access to tables, functions, sequences

---

**Reference:**
- Full schema: `schema_dump.sql`
- Sample data: `sample_data.sql`

இந்த structure-ஐ future reference, teamwork, debugging, migration, backup, documentation ஆகியவற்றிற்கு பயன்படுத்தலாம்.
