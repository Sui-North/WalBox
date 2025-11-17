# Vercel Blank Page Troubleshooting Guide

## Current Issue

The deployed site at https://wal-box.vercel.app shows a blank page with the error:
```
ui-T57JS5mJ.js:1 Uncaught TypeError: Cannot read properties of undefined (reading 'useLayoutEffect')
```

This indicates React is still being loaded multiple times despite our fixes.

## Why This Is Happening

The code fixes are in place locally, but Vercel needs to:
1. Pull the latest code
2. Rebuild with the new configuration
3. Clear any cached builds
4. Deploy the new version

## Step-by-Step Fix

### Step 1: Verify Local Build Works

First, confirm the fix works locally:

```bash
# Clean build
rm -rf dist node_modules/.vite
npm run build

# Test the production build
npm run preview
```

Visit http://localhost:8080 and verify:
- ✅ Page loads without blank screen
- ✅ No React errors in console
- ✅ App functions correctly

### Step 2: Force Vercel Redeploy

#### Option A: Via Vercel Dashboard (Recommended)

1. Go to https://vercel.com/dashboard
2. Select your project (wal-box)
3. Go to "Deployments" tab
4. Click the three dots (•••) on the latest deployment
5. Click "Redeploy"
6. Check "Use existing Build Cache" is **UNCHECKED**
7. Click "Redeploy"

#### Option B: Via Git Push

```bash
# Make a small change to force rebuild
echo "" >> README.md
git add README.md
git commit -m "Force Vercel rebuild - fix React duplicate instance"
git push origin main
```

#### Option C: Via Vercel CLI

```bash
# Install Vercel CLI if not installed
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

### Step 3: Clear Vercel Build Cache

In Vercel Dashboard:
1. Go to Project Settings
2. Scroll to "Build & Development Settings"
3. Click "Clear Build Cache"
4. Trigger a new deployment

### Step 4: Verify Environment Variables

In Vercel Dashboard → Settings → Environment Variables, ensure these are set:

```
VITE_APP_URL=https://wal-box.vercel.app
VITE_SUI_NETWORK=testnet
VITE_SUI_RPC_URL=https://fullnode.testnet.sui.io:443
VITE_PACKAGE_ID=0x00628889acf68531d55826be91d54d9518d8c6843cfcb6e7d1bd9a691367cdcd
VITE_REGISTRY_ID=0xa2d83098a4d2af212c311781a172b3d27f75c4ec1718bdb98b69e00eddb33911
VITE_FOLDER_REGISTRY_ID=0x3a13ca2fadfe77dcfa0aa7b5d2f723d8660fff1cc0f72bbdcddc51ac74c85a87
VITE_WALRUS_ENDPOINT=https://publisher.walrus-testnet.walrus.space
VITE_APP_NAME=WalrusBox
VITE_APP_ENV=production
```

**Important**: After adding/changing environment variables, you MUST redeploy!

### Step 5: Check Build Logs

In Vercel Dashboard:
1. Go to "Deployments"
2. Click on the latest deployment
3. Check the "Building" logs for errors
4. Look for:
   - ✅ "Build completed successfully"
   - ❌ Any error messages
   - ⚠️ Warnings about dependencies

### Step 6: Verify Deployment

After redeployment:
1. Visit https://wal-box.vercel.app
2. Hard refresh: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
3. Open DevTools Console (F12)
4. Check for errors

## Common Issues & Solutions

### Issue 1: Old Build Cached

**Symptoms**: Changes not appearing, old errors persist

**Solution**:
```bash
# In Vercel Dashboard
Settings → Clear Build Cache → Redeploy
```

### Issue 2: Environment Variables Not Set

**Symptoms**: App loads but features don't work

**Solution**:
- Add all environment variables in Vercel Dashboard
- Redeploy after adding variables

### Issue 3: Node Modules Cache

**Symptoms**: Build succeeds but runtime errors

**Solution**:
```bash
# Locally
rm -rf node_modules package-lock.json
npm install
npm run build

# Then push and redeploy
```

### Issue 4: React Still Duplicated

**Symptoms**: Same useLayoutEffect error

**Solution**:
1. Verify `src/App.tsx` doesn't have duplicate providers
2. Verify `vite.config.ts` has `dedupe: ['react', 'react-dom']`
3. Clear Vercel cache and redeploy

### Issue 5: Browser Cache

**Symptoms**: Works for others but not for you

**Solution**:
- Hard refresh: `Ctrl+Shift+R`
- Clear browser cache
- Try incognito/private mode
- Try different browser

## Verification Checklist

After redeployment, verify:

- [ ] Page loads (not blank)
- [ ] No console errors
- [ ] Home page displays
- [ ] Can navigate to dashboard
- [ ] Wallet connect button works
- [ ] Theme toggle works
- [ ] No React duplicate instance errors

## Quick Fix Commands

Run these in order:

```bash
# 1. Clean local build
rm -rf dist node_modules/.vite

# 2. Fresh install
npm install

# 3. Build locally to verify
npm run build

# 4. Test production build
npm run preview

# 5. If local works, force Vercel rebuild
git commit --allow-empty -m "Trigger Vercel rebuild"
git push origin main
```

## Expected Build Output

Your build should show:
```
✓ built in ~11s
dist/index.html                    2.30 kB
dist/assets/react-vendor-*.js    138.62 kB  ← React in separate chunk
dist/assets/vendor-*.js          497.26 kB
```

## Still Not Working?

If the issue persists after trying all steps:

### 1. Check Vercel Deployment Logs

Look for specific errors in the build or runtime logs.

### 2. Compare Local vs Production

- Does it work locally? → Deployment issue
- Doesn't work locally? → Code issue

### 3. Rollback

In Vercel Dashboard:
1. Go to Deployments
2. Find a working deployment
3. Click "Promote to Production"

### 4. Contact Support

Provide:
- Deployment URL
- Build logs
- Console errors
- Steps you've tried

## Prevention

To avoid this in the future:

1. **Always test locally first**:
   ```bash
   npm run build && npm run preview
   ```

2. **Use Vercel CLI for testing**:
   ```bash
   vercel dev  # Test with Vercel environment
   ```

3. **Monitor deployments**:
   - Check build logs after each deploy
   - Test immediately after deployment
   - Keep an eye on error tracking

4. **Version control**:
   - Tag working versions
   - Document breaking changes
   - Keep deployment notes

## S