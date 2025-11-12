# Contract Deployment Information

## ✅ Contract Successfully Deployed to Sui Testnet

**Transaction Digest:** `AYSW39MSsXJ8FUpVNg8iR5oqPHk8v6ncpG76gJyNzfBG`

## 📦 Deployment Details

### Package ID
```
0x386cf5f10e6dc8639fcc494123439e333e738280a8f249b638cb7b84328a8885
```

### Registry Object ID (FileRegistry)
```
0x97bcf633e416c1bed96725d3872d255a4481686a66d38a589c42220aae16f366
```

### Upgrade Cap Object ID
```
0xd45babfc05ba0935f8d34063396d060c8708276d1ad68350ab68808157e9dae8
```
*(Keep this safe for future contract upgrades)*

## 🔧 Environment Configuration

Create a `.env` file in the project root with the following:

```env
# Sui Network Configuration
VITE_SUI_NETWORK=testnet
VITE_SUI_RPC_URL=https://fullnode.testnet.sui.io:443

# Sui Contract Configuration
VITE_PACKAGE_ID=0x386cf5f10e6dc8639fcc494123439e333e738280a8f249b638cb7b84328a8885
VITE_REGISTRY_ID=0x97bcf633e416c1bed96725d3872d255a4481686a66d38a589c42220aae16f366

# Walrus Storage Configuration
VITE_WALRUS_ENDPOINT=https://walrus-api.example.com
```

## 🔍 View on Sui Explorer

- **Package:** https://suiexplorer.com/object/0x386cf5f10e6dc8639fcc494123439e333e738280a8f249b638cb7b84328a8885?network=testnet
- **Registry:** https://suiexplorer.com/object/0x97bcf633e416c1bed96725d3872d255a4481686a66d38a589c42220aae16f366?network=testnet
- **Transaction:** https://suiexplorer.com/txblock/AYSW39MSsXJ8FUpVNg8iR5oqPHk8v6ncpG76gJyNzfBG?network=testnet

## ✅ Next Steps

1. **Create `.env` file** with the values above
2. **Start the dev server:**
   ```bash
   npm run dev
   ```
3. **Install a Sui wallet extension** (Nautilus, Sui Wallet, or Suiet)
4. **Test the integration:**
   - Connect wallet
   - Upload a test file
   - Verify file appears on-chain

## 📝 Notes

- The contract is deployed on **Sui Testnet**
- The FileRegistry is a **Shared Object** (accessible by all)
- Gas cost: ~18.76 SUI (testnet tokens)
- Contract ready for use!

---

**Deployment completed successfully!** 🎉

