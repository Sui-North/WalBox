# 🔍 Wallet Not Injecting - Troubleshooting Guide

## Current Status
✗ **Wallets not injecting into window object**

Console shows:
```
- window.slush: NOT FOUND
- window.suiWallet: NOT FOUND  
- window.nautilus: NOT FOUND
```

This means browser extensions are either:
1. ❌ Not installed
2. ❌ Not enabled
3. ❌ Missing permissions for this domain
4. ❌ Having injection issues

## Step 1: Verify Extension is Installed

### Chrome/Brave/Edge:
1. Go to `chrome://extensions`
2. **Search for "Slush"** in the search box
3. If not found → **Install from Chrome Web Store**
4. If found → Check next steps

### Firefox:
1. Go to `about:addons`
2. Search for "Slush"
3. If not found → Install from Firefox Add-ons
4. If found → Check next steps

## Step 2: Verify Extension is ENABLED

1. Open `chrome://extensions` (or `about:addons` for Firefox)
2. Find "Slush Wallet"
3. **Make sure the toggle is BLUE (ON)**
4. If it's gray → Click to enable it
5. **Hard refresh** the app (Ctrl+Shift+R)

## Step 3: Check Extension Permissions

### Chrome/Brave:
1. Go to `chrome://extensions`
2. Click "Details" on Slush Wallet
3. Scroll down to "Site access"
4. Change to **"On all sites"** or add localhost specifically
5. Check **"Allow access to file URLs"** (if needed)
6. Hard refresh the app

### Firefox:
1. Go to `about:addons`
2. Click Slush Wallet → Extensions tab
3. Click "Permissions"
4. Grant all necessary permissions
5. Hard refresh the app

## Step 4: Manual Extension Check

Open browser console (F12) and run:

```javascript
// Check if ANY wallet is injecting
console.log('=== Window Object Check ===');
console.log('window.slush:', !!window.slush);
console.log('window.suiWallet:', !!window.suiWallet);
console.log('window.nautilus:', !!window.nautilus);
console.log('window.suiet:', !!window.suiet);
console.log('window.okxwallet:', !!window.okxwallet);

// Check for Sui Wallet standard
console.log('\n=== Sui Wallet Standard ===');
console.log('window.__SLUSH__:', !!window.__SLUSH__);

// List ALL window keys containing 'wallet' or 'slush'
console.log('\n=== All Wallet-related Keys ===');
const walletKeys = Object.keys(window).filter(k => 
  k.toLowerCase().includes('wallet') || 
  k.toLowerCase().includes('slush')
);
console.log('Found keys:', walletKeys);
```

**If this returns all `false` values → Extension not injecting properly**

## Step 5: Fix Injection Issues

### Option A: Reinstall Extension
1. Go to `chrome://extensions`
2. Click the trash icon on Slush Wallet
3. Confirm removal
4. Visit https://www.slushwallet.io/
5. Click "Install"
6. Complete installation
7. Hard refresh app (Ctrl+Shift+R)

### Option B: Reset Browser Cache
1. Close the app tab
2. Press `Ctrl+Shift+Delete` (or `Cmd+Shift+Delete` on Mac)
3. Select "Cookies and other site data"
4. Select "All time"
5. Click "Clear data"
6. Reopen the app
7. Hard refresh (Ctrl+Shift+R)

### Option C: Check Dev Server Port
The extension might be whitelisted for specific ports:

1. Open browser console
2. Check the app URL (should show in address bar)
3. If it's `localhost:8080` but you're on `localhost:8081` → Extension might not work
4. Possible solutions:
   - Add localhost:* to extension permissions
   - Or restart dev server to use port 8080

```bash
# Kill current dev server (Ctrl+C)
# Then restart
npm run dev
```

## Step 6: Test Other Wallets

Don't just test Slush - try installing and testing other wallets to see if ANY of them inject:

**Recommended test wallets:**
- ✅ Sui Wallet (official) - https://chromewebstore.google.com/detail/sui-wallet/...
- ✅ Nautilus - https://chromewebstore.google.com/detail/nautilus/...
- ✅ OKX Wallet - Has Sui support

If OTHER wallets also don't inject:
- → **Browser/extension issue** (not app code)
- → Try different browser (Chrome vs Firefox)
- → Try incognito/private mode

If OTHER wallets DO inject but Slush doesn't:
- → **Slush extension issue** (reinstall it)

## Step 7: Verify App is Using dApp Kit

Run this in console to confirm our app is properly set up:

```javascript
// Check if React Query is working
console.log('window.__REACT_QUERY_DEVTOOLS_PANEL__:', 
  !!window.__REACT_QUERY_DEVTOOLS_PANEL__);

// Check for dApp Kit
console.log('Document ready state:', document.readyState);
console.log('App loaded:', !!document.querySelector('[data-react-root]'));
```

## Common Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| Extension installed but not showing | Needs reload | Hard refresh: Ctrl+Shift+R |
| Extension shows but can't connect | Missing permissions | Add to Site access in extension |
| Works in Chrome but not Firefox | Browser differences | Install on Firefox too |
| Works sometimes but not always | Cache issues | Clear site data + hard refresh |
| Works on other sites but not here | Port/localhost issue | Check app URL matches extension whitelist |

## Advanced Debugging

If nothing works, test with a different localhost port:

```bash
# Stop current dev server (Ctrl+C)

# Try specific port
npm run dev -- --port 5173

# Or
vite --port 5173
```

Then visit `http://localhost:5173` and try connecting.

## Verification Checklist

- [ ] Extension installed (visible in chrome://extensions)
- [ ] Extension enabled (blue toggle)
- [ ] Site permissions granted (localhost allowed)
- [ ] File URL access enabled (if needed)
- [ ] Browser console shows wallet injection (`window.slush`, etc.)
- [ ] App shows wallet in "Connect Wallet" dropdown
- [ ] Can select wallet and connect

## If ALL Else Fails

1. **Try different browser**: Open in Firefox/Chrome/Brave
2. **Try incognito mode**: Ctrl+Shift+N (Chrome) or Ctrl+Shift+P (Firefox)
3. **Contact Slush support**: https://www.slushwallet.io/support
4. **Check extension changelog**: Version compatibility issues?
5. **Test on testnet only**: Different network setting?

## Success Criteria

Once working, you should see:
```
✅ Console shows: window.slush: Object
✅ Dropdown shows wallet list
✅ Can click wallet and approve connection
✅ Address shows in button after connection
✅ File upload works with signed transactions
```

---

**Status**: 🔴 **Wallets not injecting - Follow steps above**  
**Next**: Verify extension installation and permissions  
**Then**: Hard refresh and check console output
