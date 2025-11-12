# WalrusBox Integration Guide

This guide provides step-by-step instructions for integrating the Web3 backend with Sui Move smart contracts, Walrus storage, Seal encryption, and Nautilus wallet.

## Prerequisites

1. **Sui CLI** - Install from [Sui Documentation](https://docs.sui.io/build/install)
2. **Node.js 16+** or **Bun**
3. **Nautilus Wallet** - Browser extension installed
4. **Sui Testnet/Devnet Account** - For testing

## Step 1: Install Dependencies

```bash
npm install
# or
bun install
```

This will install:
- `@mysten/sui` - Sui SDK for contract interaction (replaces @mysten/sui.js)
- Note: Encryption uses Web Crypto API (built-in, no package needed)
- Note: Storage uses fetch API (built-in, no package needed)
- Note: Wallet uses standard Sui wallet interface (injected by browser extensions)

## Step 2: Deploy Sui Move Contract

### 2.1 Build the Contract

```bash
cd contracts
sui move build
```

This compiles the Move contract and generates build artifacts.

### 2.2 Publish the Contract

```bash
# For testnet
sui client publish --gas-budget 100000000 --network testnet

# For devnet
sui client publish --gas-budget 100000000 --network devnet
```

**Important:** Save the output values:
- `Package ID` - Set as `VITE_PACKAGE_ID` in `.env`
- `Registry Object ID` - Set as `VITE_REGISTRY_ID` in `.env`

### 2.3 Verify Contract Deployment

```bash
sui client object <REGISTRY_ID> --network testnet
```

## Step 3: Configure Environment Variables

Create a `.env` file in the project root:

```env
# Sui Network Configuration
VITE_SUI_NETWORK=testnet
VITE_SUI_RPC_URL=https://fullnode.testnet.sui.io:443
VITE_PACKAGE_ID=0xYOUR_PACKAGE_ID
VITE_REGISTRY_ID=0xYOUR_REGISTRY_ID

# Walrus Storage Configuration
VITE_WALRUS_ENDPOINT=https://walrus-api.example.com

# Optional: Custom RPC endpoint
# VITE_SUI_RPC_URL=https://your-custom-rpc-endpoint.com
```

**Note:** Replace `YOUR_PACKAGE_ID` and `YOUR_REGISTRY_ID` with values from Step 2.2.

## Step 4: Update Frontend Components

### 4.1 Update File Upload Flow

The file upload process now follows this sequence:

1. **Encrypt** file client-side using Seal
2. **Upload** encrypted blob to Walrus
3. **Create** FileObject on Sui blockchain
4. **Store** encryption key metadata (client-side only)

Example integration in `FileUploadArea.tsx`:

```typescript
const handleUpload = async () => {
  if (!selectedFile || !walletAddress) return;

  setIsUploading(true);
  setUploadProgress(10);

  try {
    // Step 1: Encrypt file
    const encryptedBlob = await encryptionService.encrypt(selectedFile);
    setUploadProgress(30);

    // Step 2: Upload to Walrus
    const walrusHash = await storageService.uploadToWalrus(
      encryptedBlob,
      selectedFile.name
    );
    setUploadProgress(60);

    // Step 3: Create file on-chain
    const fileId = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await filesService.createFile(
      walletService.signAndExecuteTransactionBlock,
      fileId,
      walrusHash
    );
    setUploadProgress(100);

    toast({
      title: "File Uploaded Successfully",
      description: `${selectedFile.name} has been encrypted and stored.`,
    });

    navigate('/dashboard');
  } catch (error) {
    toast({
      title: "Upload Failed",
      description: error instanceof Error ? error.message : "Could not upload file",
      variant: "destructive",
    });
  } finally {
    setIsUploading(false);
    setUploadProgress(0);
  }
};
```

### 4.2 Update File List Display

Update `Dashboard.tsx` to fetch files from Sui:

```typescript
const [files, setFiles] = useState<FileMetadata[]>([]);
const { address } = walletService.getState();

useEffect(() => {
  if (address) {
    filesService.getAllFiles(address).then(setFiles);
  }
}, [address]);
```

### 4.3 Update Wallet Connection

Update `WalletConnectButton.tsx` to use Nautilus:

```typescript
const handleConnect = async () => {
  try {
    const address = await walletService.connect();
    // Wallet state is automatically updated
  } catch (error) {
    console.error('Connection failed:', error);
  }
};
```

## Step 5: Testing the Integration

### 5.1 Test Wallet Connection

1. Start the dev server: `npm run dev`
2. Navigate to the dashboard
3. Click "Connect Wallet"
4. Approve connection in Nautilus
5. Verify address is displayed

### 5.2 Test File Upload

1. Select a small test file (image or document)
2. Click upload
3. Approve transaction in Nautilus
4. Verify file appears in the file list
5. Check Sui explorer for the FileObject: `https://suiexplorer.com/object/<OBJECT_ID>`

### 5.3 Test File Access Control

1. Upload a private file
2. Add an allowed address using `filesService.addAllowedAddress()`
3. Verify access using `filesService.verifyAccess()`
4. Test removing access with `filesService.removeAllowedAddress()`

### 5.4 Test File Download

1. Click on a file in the list
2. Verify decryption key is available (stored client-side)
3. Download and decrypt the file
4. Verify file integrity

## Step 6: Production Deployment

### 6.1 Contract Deployment

For mainnet deployment:

```bash
sui client publish --gas-budget 100000000 --network mainnet
```

**Important:** Update `.env` with mainnet values:
- `VITE_SUI_NETWORK=mainnet`
- `VITE_SUI_RPC_URL=https://fullnode.mainnet.sui.io:443`

### 6.2 Frontend Build

```bash
npm run build
```

Deploy the `dist/` folder to your hosting provider.

### 6.3 Environment Variables

Ensure production environment variables are set:
- Sui network and RPC URL
- Package and Registry IDs
- Walrus endpoint

## Architecture Overview

### Data Flow

```
User Uploads File
    ↓
[Seal] Client-side Encryption
    ↓
[Walrus] Upload Encrypted Blob → Returns Hash
    ↓
[Sui Contract] Create FileObject with Hash
    ↓
[Frontend] Store Encryption Key (sessionStorage)
```

### Access Control Flow

```
User Requests File
    ↓
[Frontend] Check Wallet Connection
    ↓
[Sui Contract] verify_access(requester_address)
    ↓
[Contract Logic]
    - Owner? → Allow
    - Public? → Allow
    - Private + Allowed? → Allow
    - Otherwise → Deny
    ↓
[Walrus] Download Encrypted Blob
    ↓
[Seal] Client-side Decryption
    ↓
[Frontend] Display File
```

## Security Considerations

1. **Encryption Keys**: Never stored on backend, only in browser sessionStorage
2. **Private Keys**: All signing happens client-side via Nautilus
3. **Access Control**: Enforced on-chain via Sui smart contract
4. **File Storage**: Encrypted files stored on Walrus, metadata on Sui

## Troubleshooting

### Contract Not Found

- Verify `VITE_PACKAGE_ID` is correct
- Check network matches (testnet/mainnet)
- Ensure contract was published successfully

### Wallet Connection Fails

- Verify Nautilus extension is installed
- Check browser console for errors
- Ensure wallet is unlocked

### File Upload Fails

- Check Walrus endpoint is accessible
- Verify Sui transaction has sufficient gas
- Check browser console for detailed errors

### File Download Fails

- Verify encryption key exists in sessionStorage
- Check file object exists on-chain
- Ensure user has access permissions

## API Reference

### Files Service

- `getAllFiles(ownerAddress)` - Get all files owned by address
- `getFile(objectId)` - Get file by object ID
- `createFile(signer, fileId, walrusHash)` - Create new file on-chain
- `setVisibility(signer, objectId, visibility)` - Update file visibility
- `addAllowedAddress(signer, objectId, address)` - Grant access
- `removeAllowedAddress(signer, objectId, address)` - Revoke access
- `verifyAccess(objectId, requesterAddress)` - Check access permissions

### Storage Service

- `uploadToWalrus(blob, fileName)` - Upload encrypted file
- `downloadFromWalrus(objectHash)` - Download encrypted file
- `deleteFromWalrus(objectHash)` - Delete file from storage

### Encryption Service

- `encrypt(file)` - Encrypt file client-side
- `decrypt(blob, keyId)` - Decrypt file using stored key
- `generateKeyId()` - Generate new key identifier
- `storeKeyMetadata(keyId, metadata)` - Store key metadata
- `removeKey(keyId)` - Remove encryption key

### Wallet Service

- `connect()` - Connect to Nautilus wallet
- `disconnect()` - Disconnect wallet
- `getState()` - Get current wallet state
- `signAndExecuteTransactionBlock(tx, options)` - Sign and execute transaction
- `signMessage(message)` - Sign arbitrary message
- `isInstalled()` - Check if wallet is installed
- `isConnected()` - Check if wallet is connected

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review Sui Move contract logs
3. Check browser console for errors
4. Verify environment variables are set correctly

---

**WalrusBox** - Secure, Decentralized File Management for Web3

