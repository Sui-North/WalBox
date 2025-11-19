# WalrusBox Smart Contract Deployment

## Deployment Information

**Network:** Sui Testnet  
**Deployed:** January 19, 2025  
**Transaction Digest:** `EKaQYtdVhrwPG8Jbradj7nMhx4gTifntQk6wbHZYvWzy`

## Contract Addresses

### Package ID
```
0xc9762c833c6c03919272c9ccec4e99afa93321872f9db180ae7392d8e1b3bb0d
```

### FileRegistry (Shared Object)
```
0xab72a5da446ad813f72694b5e999ef1d69bf6e41922031e19a3af31fd11615ee
```

### FolderRegistry (Shared Object)
```
0xdd0c395cd80e5128f0d61cefc1c8ad63b5b587fb40235c513d0034dee18f0624
```

### UpgradeCap
```
0x4dcbcd2f903045a8d655817a3d73819e6ec6cf73a38dc70e69a8ff6ff82b1849
```
Owner: `0x2bfa61cc514344a041358078ae5d1aeb6712656ad0e583e11af63241e79f55c7`

## Explorer Links

- **Package:** https://testnet.suivision.xyz/package/0xc9762c833c6c03919272c9ccec4e99afa93321872f9db180ae7392d8e1b3bb0d
- **Transaction:** https://testnet.suivision.xyz/txblock/EKaQYtdVhrwPG8Jbradj7nMhx4gTifntQk6wbHZYvWzy
- **FileRegistry:** https://testnet.suivision.xyz/object/0xab72a5da446ad813f72694b5e999ef1d69bf6e41922031e19a3af31fd11615ee
- **FolderRegistry:** https://testnet.suivision.xyz/object/0xdd0c395cd80e5128f0d61cefc1c8ad63b5b587fb40235c513d0034dee18f0624

## Gas Cost

- **Storage Cost:** 26.57 SUI
- **Computation Cost:** 1.00 SUI
- **Storage Rebate:** 0.98 SUI
- **Total Cost:** ~26.59 SUI

## Environment Variables

The following environment variables have been updated in `.env`:

```env
VITE_PACKAGE_ID=0xc9762c833c6c03919272c9ccec4e99afa93321872f9db180ae7392d8e1b3bb0d
VITE_REGISTRY_ID=0xab72a5da446ad813f72694b5e999ef1d69bf6e41922031e19a3af31fd11615ee
VITE_FOLDER_REGISTRY_ID=0xdd0c395cd80e5128f0d61cefc1c8ad63b5b587fb40235c513d0034dee18f0624
```

## Verification

To verify the deployment:

```bash
# Check package exists
sui client object 0xc9762c833c6c03919272c9ccec4e99afa93321872f9db180ae7392d8e1b3bb0d

# Check FileRegistry
sui client object 0xab72a5da446ad813f72694b5e999ef1d69bf6e41922031e19a3af31fd11615ee

# Check FolderRegistry
sui client object 0xdd0c395cd80e5128f0d61cefc1c8ad63b5b587fb40235c513d0034dee18f0624
```

## Next Steps

1. ✅ Contract deployed successfully
2. ✅ Environment variables updated
3. 🔄 Restart your development server to load new environment variables
4. 🧪 Test file upload with wallet transaction
5. ✅ Files should now appear in dashboard after upload

## Testing

To test the deployment:

1. Connect your Sui wallet to the app
2. Upload a file with encryption enabled
3. Approve the wallet transaction popup
4. Verify the file appears in your dashboard
5. Check the transaction on Sui Explorer

## Troubleshooting

If uploads still fail:

1. **Clear browser cache** and reload
2. **Restart dev server** to load new env variables:
   ```bash
   # Stop current server (Ctrl+C)
   npm run dev
   ```
3. **Check wallet connection** - ensure you're on testnet
4. **Verify gas balance** - ensure you have enough SUI for transactions

## Contract Functions

The deployed contract includes:

- `create_file` - Create on-chain file metadata
- `create_folder` - Create folder structure
- `set_visibility` - Change file visibility (public/private)
- `add_allowed_address` - Grant file access to specific addresses
- `remove_allowed_address` - Revoke file access
- `verify_access` - Check if address has access to file
- `move_file` - Move file to different folder
- `delete_folder` - Delete folder

## Security Notes

- The UpgradeCap is owned by the deployer address
- FileRegistry and FolderRegistry are shared objects (accessible to all)
- Only file owners can modify file permissions
- Private files require explicit access grants
