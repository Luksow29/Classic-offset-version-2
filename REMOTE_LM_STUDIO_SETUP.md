# 🌐 Remote LM Studio Access Setup Guide

## 🎯 **Problem**: LM Studio + Netlify Integration

**Local Development**: ✅ LM Studio works perfectly on `http://192.168.3.25:1234`
**Netlify Deployment**: ❌ Cannot access localhost from remote servers

## ✅ **Current Status**
- **Your Public IP**: `185.90.88.244`
- **LM Studio**: Running on `192.168.3.25:1234`
- **Models Available**: `qwen/qwen3-vl-4b`, `text-embedding-nomic-embed-text-v1.5`

## 🔧 **Solution Options**

### ✅ **Current Approach: Supabase/Netlify Proxy**

The hosted app no longer hits LM Studio directly from the browser.  
Instead, we proxy every `/v1/*` request through a serverless function.

1. Deploy `supabase/functions/lm-studio-proxy`
2. Set Supabase secrets:
   - `LM_STUDIO_BASE_URL` → your tunnel / public LM Studio endpoint  
   - `LM_STUDIO_API_KEY` → optional
3. Update Netlify envs:
   ```bash
   VITE_LM_STUDIO_PROXY_URL=https://<project>.supabase.co/functions/v1/lm-studio-proxy
   ```
4. The frontend automatically switches to proxy mode when this variable is set.

> Prefer Netlify Functions? Copy the same handler logic into `/.netlify/functions/lm-studio-proxy` and set `VITE_LM_STUDIO_PROXY_URL=/.netlify/functions/lm-studio-proxy`.

### **Option 1: Public IP + Port Forwarding (Recommended)**

1. **Get Your Public IP**:
   ```bash
   curl ifconfig.me
   # Example output: 203.112.45.67
   ```

2. **Router Configuration**:
   - Access your router admin panel (usually `192.168.1.1`)
   - Navigate to **Port Forwarding** settings
   - Add new rule:
     - **External Port**: 1234
     - **Internal IP**: 192.168.3.25 (your local machine)
     - **Internal Port**: 1234
     - **Protocol**: TCP

3. **LM Studio Configuration**:
   - Open LM Studio
   - Go to **Settings → Network**
   - Enable **CORS** 
   - Allow connections from: `*` (all origins)
   - Start local server on port 1234

4. **Update Environment**:
   ```bash
   # In .env.remote (ALREADY CONFIGURED)
   VITE_LM_STUDIO_BASE_URL=http://185.90.88.244:1234
   ```

5. **Deploy**:
   ```bash
   npm run build:remote
   # Upload dist/ folder to Netlify
   ```

### **Option 2: Tunnel Service (Alternative)**

1. **Install Cloudflare Tunnel** (Free):
   ```bash
   npm install -g @cloudflare/next-on-pages
   ```

2. **Create Tunnel** (Example - ACTIVE):
   ```bash
   cloudflared tunnel --url http://192.168.3.25:1234
   # Output: https://arrival-double-customize-pools.trycloudflare.com
   ```

3. **Update Environment**:
   ```bash
   # In .env.remote (CONFIGURED ✅)
   VITE_LM_STUDIO_BASE_URL=https://arrival-double-customize-pools.trycloudflare.com
   VITE_LM_STUDIO_API_KEY=dummy-key-for-local-ai
   VITE_ENVIRONMENT=production
   VITE_DEPLOYMENT_TYPE=netlify
   ```

### **Option 3: Hybrid Mode (Fallback)**

The app automatically detects deployment environment:
- **Local**: Full LM Studio functionality
- **Remote**: Business data only, no AI processing

```typescript
// Environment detection (already implemented)
if (environmentInfo?.isNetlify && !environmentInfo?.lmStudioAvailable) {
  // Show business data without AI processing
  // Display setup instructions
}
```

## 🚀 **Live Deployment Process**

### **⚡ Recommended: Public IP Method**
```bash
# Step 1: Setup router port forwarding (see instructions above)
# External Port 1234 -> 192.168.3.25:1234

# Step 2: Enable CORS in LM Studio
# Settings → Network → CORS → Allow all origins (*)

# Step 3: Build & Deploy
npm run build:remote
# Upload dist/ folder to Netlify
# Your app connects to: http://185.90.88.244:1234
```

### **🔄 Alternative: Tunnel Method** (Less Reliable)
```bash
# Step 1: Start tunnel (keep running)
cloudflared tunnel --url http://192.168.3.25:1234
# Copy the generated URL

# Step 2: Update .env.remote with tunnel URL
# VITE_LM_STUDIO_BASE_URL=https://your-tunnel-url.trycloudflare.com

# Step 3: Build & Deploy
npm run build:remote
```

### **Step 3: Test Remote Connection**
```bash
# Test tunnel is working
curl https://arrival-double-customize-pools.trycloudflare.com/v1/models

# Should return LM Studio models list
```

## 🚀 **Available Commands**

```bash
# Local development with local LM Studio
npm run dev

# Build for remote deployment (uses .env.remote)
npm run build:remote

# Build for local testing  
npm run build:local

# Preview remote build locally
npm run preview:remote
```

## 🔒 **Security Considerations**

1. **Firewall Rules**: Only allow port 1234 if needed
2. **Router Security**: Use strong admin passwords
3. **LM Studio**: Consider IP whitelist instead of wildcard CORS
4. **Monitor Usage**: Check router logs for unusual activity

## 📋 **Testing Checklist**

### **✅ Completed Setup**
- [x] LM Studio running locally on port 1234
- [x] CORS enabled in LM Studio settings  
- [x] Cloudflare tunnel created successfully
- [x] Environment variables updated in .env.remote
- [x] Build completes without errors (8.48s)
- [x] Tunnel URL: `https://arrival-double-customize-pools.trycloudflare.com`

### **🔄 For Each Deployment**
- [ ] Start cloudflared tunnel (keep running)
- [ ] Verify tunnel is accessible
- [ ] Copy .env.remote to .env
- [ ] Run build command
- [ ] Upload dist/ to Netlify
- [ ] Test remote LM Studio connection

## 🆘 **Troubleshooting**

### **Connection Refused**
- Check if LM Studio is running
- Verify port forwarding rules
- Test public IP: `telnet YOUR_PUBLIC_IP 1234`

### **CORS Errors**
- Enable CORS in LM Studio: Settings → Network
- Allow all origins or specific domains
- Restart LM Studio after changes

### **Timeout Errors**
- Check internet connection
- Verify router doesn't block incoming connections
- Test with different port

### **Netlify Issues**
- Check build logs for environment variable errors
- Verify .env.remote is configured correctly
- Use Netlify's environment variable section

## 🎨 **Environment Status UI**

The app now shows environment status:
- 🟢 **Connected**: LM Studio accessible
- 🔴 **Disconnected**: LM Studio not available
- 🌐 **Remote**: Netlify deployment detected
- 🏠 **Local**: Development environment

## 💡 **Best Practices**

1. **Development**: Use `npm run dev` with local LM Studio
2. **Testing**: Use `npm run preview:remote` before deployment
3. **Production**: Enable port forwarding + update environment
4. **Monitoring**: Check LM Studio logs for connection attempts
5. **Backup**: Keep local development setup working

## 📞 **Support**

If you need help with:
- Router port forwarding setup
- LM Studio configuration
- Network troubleshooting
- Alternative solutions

The environment detection will guide users through the setup process automatically!
