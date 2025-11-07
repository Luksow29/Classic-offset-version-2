# 🚀 **Complete Deployment Guide: Local AI + Netlify**

## 📋 **Current Configuration Status**

✅ **Environment Files Configured**
- `.env` - Development configuration
- `.env.remote` - Production configuration with public IP
- `.env.local` - Local development backup

✅ **Network Information**
- **Your Public IP**: `185.90.88.244`
- **Local LM Studio**: `192.168.3.25:1234`
- **Models Available**: `qwen/qwen3-vl-4b`, `text-embedding-nomic-embed-text-v1.5`

## 🎯 **Two Deployment Options**

### **Option 1: Public IP + Port Forwarding** (Recommended - Most Reliable)

#### **Router Setup Required:**
1. **Access Router Admin Panel**:
   - Open browser: `http://192.168.1.1` or `http://192.168.0.1`
   - Login with admin credentials

2. **Configure Port Forwarding**:
   ```
   Service Name: LM Studio
   External Port: 1234
   Internal IP: 192.168.3.25
   Internal Port: 1234
   Protocol: TCP
   Status: Enabled
   ```

3. **LM Studio CORS Setup**:
   - Open LM Studio → Settings → Network
   - Enable CORS: ✅
   - Allowed Origins: `*` (or specific domains)
   - Restart LM Studio

4. **Deploy**:
   ```bash
   npm run build:remote
   # Upload dist/ folder to Netlify
   # App will connect to: http://185.90.88.244:1234
   ```

### **Option 2: Cloudflare Tunnel** (Alternative - Less Stable)

1. **Start Tunnel**:
   ```bash
   cloudflared tunnel --url http://192.168.3.25:1234
   # Keep this running - note the generated URL
   ```

2. **Update Configuration**:
   ```bash
   # Edit .env.remote
   VITE_LM_STUDIO_BASE_URL=https://your-generated-url.trycloudflare.com
   ```

3. **Deploy**:
   ```bash
   npm run build:remote
   # Upload to Netlify
   ```

## 🔧 **Build Commands**

```bash
# Development (local LM Studio)
npm run dev

# Remote build (public IP method)
npm run build:remote

# Local build
npm run build:local

# Preview remote build locally
npm run preview:remote
```

## ✅ **Testing Checklist**

### **Before Deployment:**
- [ ] LM Studio running on `192.168.3.25:1234`
- [ ] CORS enabled in LM Studio
- [ ] Router port forwarding configured (Option 1)
- [ ] Or tunnel running (Option 2)

### **Test Local Access:**
```bash
# Test from your machine
curl -s http://192.168.3.25:1234/v1/models | jq .

# Test public access (if port forwarding setup)
curl -s http://185.90.88.244:1234/v1/models | jq .
```

### **After Deployment:**
- [ ] Build completed without errors
- [ ] Netlify deployment successful
- [ ] Remote app can connect to LM Studio
- [ ] Local AI features working

## 🚨 **Troubleshooting**

### **Connection Refused**
```bash
# Check if LM Studio is running
curl -s http://192.168.3.25:1234/v1/models

# Check public access (if port forwarding)
curl -s http://185.90.88.244:1234/v1/models

# Check router logs for blocked connections
```

### **CORS Errors**
- Verify CORS enabled in LM Studio
- Check allowed origins setting
- Restart LM Studio after changes

### **Build Errors**
```bash
# Check environment variables
npm run build:remote 2>&1 | grep -i error

# Verify config files exist
ls -la .env*
```

## 📊 **Environment Status**

The app shows real-time environment status:
- 🟢 **Connected**: LM Studio accessible
- 🔴 **Disconnected**: Connection failed
- 🌍 **Netlify**: Remote deployment detected
- 🏠 **Local**: Development environment

## 🔒 **Security Notes**

1. **Port Forwarding**: Only forward port 1234, keep other ports closed
2. **Router Security**: Use strong admin passwords
3. **LM Studio**: Consider IP whitelist instead of wildcard CORS
4. **Monitoring**: Check router logs periodically

## 📞 **Quick Support**

**Current Setup Status:**
- ✅ Environment files configured
- ✅ Public IP detected: `185.90.88.244`
- ✅ LM Studio running locally
- ⏳ **Next Step**: Router port forwarding setup

**Need Help With:**
- Router configuration for your specific model
- Alternative deployment methods
- Network troubleshooting
- Advanced security setup

The Local AI RAG system is ready for deployment with proper network configuration! 🎉
