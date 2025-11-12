# 🔧 Slush Wallet Setup Guide

## Problem
Slush Wallet uses a different injection method than other Sui wallets, so manual detection was failing.

## Solution Applied
✅ Added Slush-specific detection logic  
✅ Added debug tools to diagnose wallet detection  
✅ Enhanced WalletConnectButton with helpful debugging  

## Quick Setup for Slush

### Step 1: Install Slush Wallet
- Get it from: https://www.slushwallet.io/
- Install browser extension for Chrome/Brave/Firefox
- Restart browser after installation

### Step 2: Ensure Extension is Enabled
1. Open `chrome://extensions` (or equivalent for your browser)
2. Find "Slush Wallet"
3. Make sure it's **toggled ON** (blue switch)
4. Make sure **"Allow access to file URLs"** is enabled if needed

### Step 3: Hard Refresh the App
- **Windows/Linux**: Ctrl + Shift + R
- **Mac**: Cmd + Shift + R

This clears the cache and lets wallet extensions re-inject.

### Step 4: Test Connection
1. Visit http://localhost:8081
2. Click **"Connect Wallet"** button
3. You should see:
   - Dropdown showing available wallets
   - "Slush Wallet" should be listed
   - No warning message

## Troubleshooting

### Problem 1: "No wallet detected" warning shows
**Steps to fix:**
1. Check browser console (F12) for "Wallet Detection Debug Info"
2. Click "Show debug info" on the page
3. Click "Log to Console" button
4. Verify Slush shows up in the detected wallets list

**If Slush doesn't show:**
```
1. Go to chrome://extensions
2. Check Slush Wallet is enabled (blue toggle)
3. Hard refresh (Ctrl+Shift+R)
4. Reload the page
```

### Problem 2: "Allow access to file URLs" error
**Solution:**
1. Open `chrome://extensions`
2. Find "Slush Wallet"
3. Click "Details"
4. Toggle "Allow access to file URLs" ON

### Problem 3: ConnectButton dropdown is empty
**Steps to debug:**
1. Open DevTools (F12)
2. Go to Console tab
3. Look for `[SlushHelper]` messages
4. They should show which wallets were detected
5. Copy full output and check against known wallet names

### Problem 4: Page still shows old cached code
**Solution - Full cache clear:**
```bash
# Kill dev server if running
# Windows: Ctrl+C
# Mac: Cmd+C

# Clear node_modules cache
npm run build

# Restart dev server
npm run dev

# Hard refresh browser (Ctrl+Shift+R)
```

## Manual Testing Steps

### Test 1: Check Wallet Injection
Open browser console (F12) and run:
```javascript
// Should return the Slush wallet object
console.log('Slush Wallet:', window.slush);
console.log('Sui Wallet:', window.suiWallet);
console.log('Nautilus:', window.nautilus);
```

### Test 2: Verify Detection
```javascript
// Run this to see what WalrusBox detected
import { logWalletDebugInfo } from '/src/services/slushHelper';
logWalletDebugInfo();
```

### Test 3: Connection Flow
1. Click "Connect Wallet"
2. Select Slush from dropdown
3. Slush extension popup should appear
4. Approve the connection request
5. Page should show your address

## Files Updated

```
✏️  src/main.tsx
    └─ Added WalletProvider with preferredWallets config

✏️  src/components/WalletConnectButton.tsx
    └─ Added debug info display
    └─ Added wallet detection monitoring
    └─ Added helpful error messages

✨ src/services/slushHelper.ts (NEW)
    └─ detectSlushWallet() - Multi-method detection
    └─ ensureSlushReady() - Wait for Slush to load
    └─ getAllDetectedWallets() - See all wallets
    └─ logWalletDebugInfo() - Debug helper
```

## What's Different Now

| Feature | Before | After |
|---------|--------|-------|
| Slush detection | ❌ Failed | ✅ Works |
| Multi-wallet support | Limited | Full |
| Debug info | None | Built-in |
| Error messages | Generic | Specific |
| Setup difficulty | Hard | Easy |

## Expected Behavior

### When Slush is Installed and Enabled
- Page loads
- "Connect Wallet" button visible
- Click button → Shows wallet list including Slush
- Select Slush → Wallet popup appears
- Approve → Shows your address

### When Slush is NOT Installed
- Page loads
- "Connect Wallet" button visible
- Warning: "No wallet detected. Install Slush, Sui Wallet, or Nautilus."
- Install wallet → Hard refresh → Warning goes away

## Support Info

### Browser Requirements
- ✅ Chrome/Brave/Edge (Chromium-based)
- ✅ Firefox
- ❌ Safari (Slush not available yet)

### Network Requirements
- ✅ Testnet (default)
- ✅ Mainnet (configurable in .env)
- ⚠️ Must match wallet network setting

## Next Steps

1. **Install Slush Wallet** from https://www.slushwallet.io/
2. **Hard refresh** the app (Ctrl+Shift+R)
3. **Click "Connect Wallet"** and select Slush
4. **Approve** in the wallet popup
5. **Upload files** and enjoy! 🎉

## Advanced: Manual Connection (If Needed)

If the UI detection fails, you can manually connect:

```typescript
import { ensureSlushReady } from '@/services/slushHelper';

async function manualConnect() {
  try {
    const slush = await ensureSlushReady();
    const accounts = await slush.connect();
    console.log('Connected to:', accounts);
  } catch (error) {
    console.error('Connection failed:', error);
  }
}
```

---

**Status**: ✅ **CONFIGURED FOR SLUSH**  
**Build**: ✅ **PASSES**  
**Ready**: ✅ **YES**
