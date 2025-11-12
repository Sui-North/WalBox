# 🎯 Wallet Connection - Quick Reference

## 🚀 Quick Start (5 Minutes)

### Step 1: Install Wallet Extension
Pick ONE:
- 🦆 [Sui Wallet](https://chrome.google.com/webstore) (Chrome/Brave)
- 🐚 [Nautilus](https://nautilus.tech/) (Chrome/Firefox)
- 🎯 [Suiet](https://suiet.app/) (Chrome/Brave)

### Step 2: Setup Environment
```bash
cp .env.example .env
# VITE_SUI_RPC_URL=https://fullnode.testnet.sui.io
# VITE_PACKAGE_ID=your_package_id
# VITE_WALRUS_ENDPOINT=your_storage_endpoint
```

### Step 3: Start App
```bash
npm install
npm run dev
# Open http://localhost:8081
```

### Step 4: Get Test SUI
Visit: https://testnet-faucet.sui.io
Paste your wallet address

### Step 5: Connect & Use
- Click **"Connect Wallet"** button
- Approve in wallet extension
- Done! ✅

---

## 💻 Code Examples

### Display Connected Address
```typescript
import { useWallet } from '@/hooks/useWallet';

export function UserProfile() {
  const { address, formatAddress, isConnected } = useWallet();
  
  if (!isConnected) return <div>Connect wallet first</div>;
  
  return <div>Wallet: {formatAddress(address!)}</div>;
}
```

### Execute Transaction
```typescript
import { useWallet } from '@/hooks/useWallet';
import { Transaction } from '@mysten/sui/transactions';

export function TransactionExample() {
  const { executeTransaction } = useWallet();
  
  const handleClick = async () => {
    const tx = new Transaction();
    // Build transaction...
    
    const digest = await executeTransaction(tx);
    console.log('Success:', digest);
  };
  
  return <button onClick={handleClick}>Execute TX</button>;
}
```

### Get Wallet Balance
```typescript
import { useWallet } from '@/hooks/useWallet';
import { useEffect, useState } from 'react';

export function BalanceDisplay() {
  const { address, suiClient } = useWallet();
  const [balance, setBalance] = useState('0');
  
  useEffect(() => {
    if (address) {
      suiClient.getBalance({ owner: address }).then(bal => {
        setBalance((Number(bal.totalBalance) / 1e9).toFixed(3));
      });
    }
  }, [address]);
  
  return <div>Balance: {balance} SUI</div>;
}
```

### Integration with filesService
```typescript
import { useWallet } from '@/hooks/useWallet';
import { filesService } from '@/services/files';

export function FileUpload() {
  const { address, executeTransaction } = useWallet();
  
  const handleUpload = async (file: File) => {
    if (!address) {
      alert('Connect wallet first');
      return;
    }
    
    // Create file transaction
    const tx = filesService.createFileTransaction(file, address);
    
    // Sign and execute
    const digest = await executeTransaction(tx);
    
    console.log('File recorded:', digest);
  };
  
  return <input type="file" onChange={e => handleUpload(e.target.files![0])} />;
}
```

---

## 🔧 Hook API Reference

### `useWallet()`

```typescript
const {
  account,              // Current account object { address, label, ... }
  address,              // Wallet address string (null if not connected)
  isConnected,          // Boolean - is wallet connected
  formatAddress(addr),  // Function - format address for display
  executeTransaction,   // Function - sign & execute transaction
  suiClient             // SUI RPC client - query blockchain data
} = useWallet();
```

**Methods:**

#### `formatAddress(address)`
```typescript
const formatted = formatAddress('0x1234567890abcdef...');
// Result: "0x1234...cdef"
```

#### `executeTransaction(transactionBlock, options?)`
```typescript
const digest = await executeTransaction(tx, {
  showEffects: true,
  showEvents: true,
});
// Returns: transaction digest (string)
```

#### `suiClient.getBalance(options)`
```typescript
const balance = await suiClient.getBalance({
  owner: address,
  coinType: '0x2::sui::SUI', // Optional, defaults to SUI
});
```

#### `suiClient.getObject(id)`
```typescript
const obj = await suiClient.getObject({
  id: 'object_id',
  options: { showContent: true },
});
```

---

## ⚠️ Common Issues & Fixes

| Issue | Solution |
|-------|----------|
| **"No Wallet Found"** | Install wallet extension, refresh page |
| **"Account locked"** | Unlock wallet in extension |
| **"Connection denied"** | Approve connection in wallet popup |
| **"Transaction failed"** | Check balance, try faucet, verify contract |
| **"Wrong network"** | Switch to testnet in wallet |
| **"Permission denied"** | Check extension settings for your domain |

---

## 📚 Full Documentation

For detailed information:
- **Setup Guide**: [WALLET_SETUP.md](./WALLET_SETUP.md)
- **Implementation Details**: [WALLET_IMPLEMENTATION.md](./WALLET_IMPLEMENTATION.md)
- **Integration Guide**: [INTEGRATION.md](./INTEGRATION.md)
- **Official Docs**: https://docs.sui.io

---

## 🌐 Network Configuration

### Testnet (Default)
```env
VITE_SUI_RPC_URL=https://fullnode.testnet.sui.io
```

### Mainnet
```env
VITE_SUI_RPC_URL=https://fullnode.mainnet.sui.io
```

### Devnet
```env
VITE_SUI_RPC_URL=https://fullnode.devnet.sui.io
```

---

## 🎮 Testing Checklist

- [ ] Wallet extension installed
- [ ] App loads without errors
- [ ] "Connect Wallet" button visible
- [ ] Click connects wallet (popup appears)
- [ ] Address displays after connection
- [ ] Test SUI received from faucet
- [ ] File upload transaction works
- [ ] File appears in list
- [ ] Disconnect button works

---

## 📦 What's Installed

- ✅ `@mysten/dapp-kit@^0.13.1` - Official wallet provider
- ✅ `@mysten/sui@^1.44.0` - Sui SDK
- ✅ `@tanstack/react-query@^5.83.0` - State management

---

## 🚀 Deploy Checklist

Before going live:

- [ ] Update `.env` for mainnet
- [ ] Publish Move contract to mainnet
- [ ] Update `VITE_PACKAGE_ID` and `VITE_REGISTRY_ID`
- [ ] Test all wallet connections
- [ ] Verify transaction signing
- [ ] Test file upload/download
- [ ] Run `npm run build`
- [ ] Deploy `dist/` folder

---

**Created**: November 12, 2025  
**Status**: ✅ Ready to Use
