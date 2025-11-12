# Wallet Connection Setup Guide

## Overview

WalrusBox now includes **full wallet integration** using the official **@mysten/dapp-kit**, a standardized Sui dApp toolkit that supports all major Sui wallets:

- ✅ Sui Wallet
- ✅ Nautilus
- ✅ Suiet
- ✅ OKX Wallet
- ✅ And more...

## Quick Start

### 1. **Environment Variables**

Create a `.env` file in the root directory (or update from `.env.example`):

```env
# Sui Configuration
VITE_SUI_RPC_URL=https://fullnode.testnet.sui.io

# Smart Contract Configuration (after publishing)
VITE_PACKAGE_ID=<your_package_id_after_publishing>
VITE_REGISTRY_ID=<your_registry_object_id>

# Walrus Storage Endpoint
VITE_WALRUS_ENDPOINT=https://walrus-testnet.example.com

# Application Settings
VITE_APP_NAME=WalrusBox
VITE_APP_ENV=development
```

### 2. **Install Dependencies**

```bash
npm install
```

This installs the new wallet dependencies:
- `@mysten/dapp-kit` - Official Sui wallet provider
- `@tanstack/react-query` - State management for queries

### 3. **Run Development Server**

```bash
npm run dev
```

Visit `http://localhost:8081` and click **"Connect Wallet"** button.

## Architecture

### Components & Hooks

#### **New: useWallet() Hook** (`src/hooks/useWallet.ts`)
Modern React hook for wallet interactions:

```typescript
import { useWallet } from '@/hooks/useWallet';

export function MyComponent() {
  const { account, address, isConnected, executeTransaction, suiClient } = useWallet();
  
  // Use in your component
  if (!isConnected) return <div>Connect wallet first</div>;
  
  return <div>Connected: {address}</div>;
}
```

**Available methods:**
- `account` - Current account object
- `address` - Wallet address (string)
- `isConnected` - Boolean connection status
- `formatAddress(addr)` - Format address for display
- `executeTransaction(tx, options)` - Sign & execute transaction
- `suiClient` - SUI RPC client instance

#### **Enhanced: WalletConnectButton** (`src/components/WalletConnectButton.tsx`)
- Automatically detects available wallets
- Shows connect/disconnect UI
- Supports both dApp Kit and legacy wallet service
- Styled with gradient and glass effects

#### **Legacy: walletService** (`src/services/wallet.ts`)
For backwards compatibility with existing code:

```typescript
import { walletService } from '@/services/wallet';

// Connect
const address = await walletService.connect();

// Get state
const state = walletService.getState();

// Sign transaction
const digest = await walletService.signAndExecuteTransactionBlock(tx);

// Disconnect
await walletService.disconnect();
```

### Providers Setup (`src/main.tsx`)

```typescript
import { QueryClientProvider } from '@tanstack/react-query';
import { SuiClientProvider, WalletProvider } from '@mysten/dapp-kit';
import { getFullnodeUrl } from '@mysten/sui/client';

const queryClient = new QueryClient();
const networks = {
  testnet: { url: getFullnodeUrl('testnet') },
  mainnet: { url: getFullnodeUrl('mainnet') },
};

// Wrap your app with these providers:
<QueryClientProvider client={queryClient}>
  <SuiClientProvider networks={networks} defaultNetwork="testnet">
    <WalletProvider>
      <App />
    </WalletProvider>
  </SuiClientProvider>
</QueryClientProvider>
```

## Usage Examples

### Example 1: Basic Connection Status

```typescript
import { useWallet } from '@/hooks/useWallet';

export function WalletStatus() {
  const { address, isConnected, formatAddress } = useWallet();
  
  return (
    <div>
      {isConnected ? (
        <p>Connected to: {formatAddress(address!)}</p>
      ) : (
        <p>Wallet not connected</p>
      )}
    </div>
  );
}
```

### Example 2: Execute Transaction

```typescript
import { useWallet } from '@/hooks/useWallet';
import { Transaction } from '@mysten/sui/transactions';

export function TransactionExample() {
  const { executeTransaction, address } = useWallet();
  
  const handleTransaction = async () => {
    try {
      const tx = new Transaction();
      // Build your transaction...
      
      const digest = await executeTransaction(tx);
      console.log('Transaction successful:', digest);
    } catch (error) {
      console.error('Transaction failed:', error);
    }
  };
  
  return <button onClick={handleTransaction}>Execute TX</button>;
}
```

### Example 3: Query SUI Balance

```typescript
import { useWallet } from '@/hooks/useWallet';
import { useEffect, useState } from 'react';

export function BalanceDisplay() {
  const { address, suiClient } = useWallet();
  const [balance, setBalance] = useState<string>('0');
  
  useEffect(() => {
    if (address) {
      suiClient.getBalance({ owner: address }).then(bal => {
        const suiBalance = (Number(bal.totalBalance) / 1e9).toFixed(3);
        setBalance(suiBalance);
      });
    }
  }, [address, suiClient]);
  
  return <div>SUI Balance: {balance}</div>;
}
```

## Integration with Existing Services

### Using with filesService

```typescript
import { useWallet } from '@/hooks/useWallet';
import { filesService } from '@/services/files';

export function FileUpload() {
  const { address, executeTransaction } = useWallet();
  
  const handleUpload = async (fileData: any) => {
    if (!address) {
      alert('Connect wallet first');
      return;
    }
    
    // Create transaction via filesService
    const tx = filesService.createFileTransaction(fileData, address);
    
    // Execute with wallet
    const digest = await executeTransaction(tx);
    console.log('File recorded on-chain:', digest);
  };
  
  return <button onClick={() => handleUpload({})}>Upload</button>;
}
```

## Testing Wallet Connection

1. **Install a Sui wallet extension:**
   - [Sui Wallet](https://chrome.google.com/webstore) (Chrome/Brave)
   - [Nautilus](https://nautilus.tech/) (Chrome/Firefox)
   - [Suiet](https://suiet.app/) (Chrome/Brave)

2. **Create a test account** in your wallet (testnet network)

3. **Get test SUI** from [Sui faucet](https://testnet-faucet.sui.io/)

4. **Visit your app** and click **"Connect Wallet"**

5. **Approve the connection** in your wallet extension

## Troubleshooting

### "No Wallet Found" Error
- ✅ Ensure you have a Sui wallet extension installed
- ✅ Check that extension is enabled for your domain
- ✅ Refresh the page after installing extension
- ✅ Try a different wallet (Sui Wallet, Nautilus, etc.)

### "Wallet not connected" Error
- ✅ Click the wallet connect button and approve in extension
- ✅ Check that `useWallet()` is called within `<WalletProvider>`
- ✅ Verify account is not locked in wallet extension

### Transaction Signing Fails
- ✅ Ensure wallet account has sufficient SUI gas (get from faucet)
- ✅ Check `VITE_PACKAGE_ID` and `VITE_REGISTRY_ID` are correct
- ✅ Verify RPC URL is accessible: `VITE_SUI_RPC_URL`

### "Account locked in background" Error
- ✅ Unlock your wallet in the extension
- ✅ Reload the page and try again

## Advanced Configuration

### Switch Networks

```typescript
import { useSuiClientContext } from '@mysten/dapp-kit';

export function NetworkSwitcher() {
  const { selectNetwork } = useSuiClientContext();
  
  return (
    <>
      <button onClick={() => selectNetwork('testnet')}>Testnet</button>
      <button onClick={() => selectNetwork('mainnet')}>Mainnet</button>
    </>
  );
}
```

### Custom Wallet Selection

```typescript
import { useWallet } from '@/hooks/useWallet';
import { walletService } from '@/services/wallet';

export function WalletSelector() {
  const availableWallets = walletService.getAvailableWallets();
  
  const handleSelectWallet = async (walletName: string) => {
    const address = await walletService.connect(walletName);
    console.log('Connected to', walletName, ':', address);
  };
  
  return (
    <>
      {availableWallets.map(wallet => (
        <button key={wallet} onClick={() => handleSelectWallet(wallet)}>
          Connect {wallet}
        </button>
      ))}
    </>
  );
}
```

## Deployment

Before deploying to production:

1. **Update environment variables** for mainnet:
   ```env
   VITE_SUI_RPC_URL=https://fullnode.mainnet.sui.io
   VITE_PACKAGE_ID=<mainnet_package_id>
   ```

2. **Deploy Move contract** to mainnet:
   ```bash
   sui client publish --gas-budget 100000000 --network mainnet
   ```

3. **Test all wallet connections** in production

4. **Monitor wallet events** for connection issues

## Resources

- [Sui Documentation](https://docs.sui.io)
- [dApp Kit Documentation](https://sdk.mysten.dev/dapp-kit)
- [Sui Wallet Adapters](https://github.com/MystenLabs/sui/tree/main/sdk/wallet-adapter)
- [WalrusBox Integration Guide](./INTEGRATION.md)

## Support

For issues or questions:
- Check this guide's Troubleshooting section
- Review [Sui Discord](https://discord.gg/sui)
- See [INTEGRATION.md](./INTEGRATION.md) for contract integration

---

**Version**: 1.0  
**Last Updated**: November 12, 2025
