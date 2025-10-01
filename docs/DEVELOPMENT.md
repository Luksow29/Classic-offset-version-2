# Development Workflow Guide

## Quick Start Commands

### 🏠 Local Development (Recommended for development)
```bash
npm run dev:local        # Start with local Supabase
npm run supabase:start   # Start local Supabase services
npm run supabase:status  # Check local services status
```

### ☁️ Remote Development (For testing/demo)
```bash
npm run dev:remote       # Start with remote Supabase
```

### 🛠️ Supabase Management
```bash
npm run supabase:stop    # Stop local Supabase
npm run supabase:reset   # Reset local database (fresh start)
```

## When to Use What?

### 🏠 **Use Local Supabase when:**
- ✅ Building new features
- ✅ Testing database changes
- ✅ Working offline
- ✅ Safe experimentation
- ✅ Fast development iteration

### ☁️ **Use Remote Supabase when:**
- ✅ Demoing to clients
- ✅ Testing with team
- ✅ Production-like testing
- ✅ Sharing work with others

## Development Flow

```
1. Feature Development → Local Supabase
2. Testing → Local Supabase
3. Demo/Review → Remote Supabase
4. Production → Remote Supabase
```

## Quick Access URLs

### Local Development:
- **App**: http://localhost:5173/
- **Supabase Studio**: http://127.0.0.1:55323
- **Database**: postgresql://postgres:postgres@127.0.0.1:54328/postgres

### Remote:
- **App**: http://localhost:5173/ (with remote backend)
- **Supabase Dashboard**: https://supabase.com/dashboard/project/ytnsjmbhgwcuwmnflncl

## Tips:
- Always commit your changes before switching environments
- Use local for daily development
- Test on remote before deploying
- Keep both environments in sync with migrations
