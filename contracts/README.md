# WalrusBox Sui Move Contract

This directory contains the Sui Move smart contract for WalrusBox file management.

## Contract Overview

The `walrusbox` module provides on-chain metadata storage and access control for encrypted files stored on Walrus decentralized storage.

### Key Components

- **FileObject**: Stores file metadata including Walrus hash, owner, visibility, and allowed addresses
- **FileRegistry**: Shared registry mapping file IDs to FileObject IDs

## Building the Contract

```bash
# From the contracts directory
sui move build
```

## Deploying the Contract

### Testnet Deployment

```bash
# Ensure you have a testnet account with SUI tokens
sui client switch --env testnet

# Publish the contract
sui client publish --gas-budget 100000000 --network testnet
```

### Mainnet Deployment

```bash
# Switch to mainnet
sui client switch --env mainnet

# Publish the contract
sui client publish --gas-budget 100000000 --network mainnet
```

**Important:** After publishing, save:
- Package ID → Set as `VITE_PACKAGE_ID` in frontend `.env`
- Registry Object ID → Set as `VITE_REGISTRY_ID` in frontend `.env`

## Contract Functions

### create_file
Creates a new FileObject and registers it in the FileRegistry.

**Parameters:**
- `registry`: Mutable reference to FileRegistry
- `file_id`: Unique file identifier (vector<u8>)
- `walrus_object_hash`: Walrus storage hash (vector<u8>)

**Access:** Public entry function

### set_visibility
Updates file visibility (public/private).

**Parameters:**
- `file_object`: Mutable reference to FileObject
- `visibility`: 0 for private, 1 for public

**Access:** Owner only

### add_allowed_address
Adds an address to the allowed list for a private file.

**Parameters:**
- `file_object`: Mutable reference to FileObject
- `allowed_address`: Address to grant access

**Access:** Owner only

### remove_allowed_address
Removes an address from the allowed list.

**Parameters:**
- `file_object`: Mutable reference to FileObject
- `allowed_address`: Address to revoke access

**Access:** Owner only

### verify_access
Checks if a requester has access to a file.

**Parameters:**
- `file_object`: Reference to FileObject
- `requester_address`: Address to check

**Returns:** `bool` - true if access granted

**Access:** Public view function

### get_file_metadata
Returns file metadata (read-only).

**Returns:** Tuple of (file_id, walrus_object_hash, owner, visibility, created_at)

**Access:** Public view function

## Testing

```bash
# Run Move unit tests
sui move test

# Test specific function
sui move test --filter verify_access
```

## Contract Structure

```
contracts/
├── Move.toml          # Package configuration
└── sources/
    └── walrusbox.move # Main contract module
```

## Error Codes

- `E_NOT_OWNER` (0): Caller is not the file owner
- `E_NOT_AUTHORIZED` (1): Caller is not authorized
- `E_INVALID_VISIBILITY` (2): Invalid visibility value
- `E_ADDRESS_ALREADY_ALLOWED` (3): Address already in allowed list
- `E_ADDRESS_NOT_ALLOWED` (4): Address not in allowed list
- `E_FILE_NOT_FOUND` (5): File not found in registry

## Security Considerations

1. **Ownership**: Only file owners can modify access control
2. **Visibility**: Public files are accessible to everyone
3. **Private Files**: Only owner and allowed addresses can access
4. **Registry**: Shared object, accessible to all for lookups

## Integration

After deployment, update frontend environment variables:

```env
VITE_PACKAGE_ID=0x<YOUR_PACKAGE_ID>
VITE_REGISTRY_ID=0x<YOUR_REGISTRY_ID>
```

See `../INTEGRATION.md` for complete integration instructions.

