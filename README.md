# WalrusBox

<div align="center">

![WalrusBox Logo](https://img.shields.io/badge/WalrusBox-Decentralized%20Storage-0ea5e9?style=for-the-badge)

**A Modern, Secure, and Decentralized File Storage Platform Built on Sui Blockchain**

[![Sui Network](https://img.shields.io/badge/Sui-Testnet-4da2ff?style=flat-square)](https://sui.io)
[![React](https://img.shields.io/badge/React-18.3.1-61dafb?style=flat-square&logo=react)](https://reactjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-3178c6?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

[Features](#-features) • [Demo](#-demo) • [Installation](#-installation) • [Usage](#-usage) • [Architecture](#-architecture) • [Documentation](#-documentation)

</div>

---

## 📖 Overview

WalrusBox is a **Web3-enabled file management system** that combines the security of client-side encryption with the transparency and accessibility of blockchain technology. Built on the Sui blockchain, it enables users to securely store, manage, and share encrypted files in a fully decentralized environment.

### Why WalrusBox?

- 🔐 **End-to-End Encryption** - Files are encrypted locally before upload using AES-256-GCM
- 🌐 **Decentralized Storage** - Leverages Walrus (Sui's storage solution) with IndexedDB fallback
- ⛓️ **Blockchain Metadata** - File ownership and access control stored immutably on Sui
- 💼 **Multi-Wallet Support** - Compatible with Sui Wallet, Nautilus, Slush, Suiet, and more
- 🎨 **Modern UI/UX** - Beautiful, responsive interface with glassmorphism design
- 🔄 **Auto-Fallback** - Seamless degradation to local storage when needed

---

## ✨ Features

### Core Functionality

- **🔐 Client-Side Encryption**
  - AES-256-GCM encryption
  - Keys never leave your browser
  - Secure against network interception

- **💼 Wallet Integration**
  - Official Mysten Labs dApp Kit
  - Auto-connect functionality
  - Multiple wallet support
  - Transaction signing

- **📁 File Management**
  - Upload with drag & drop
  - Real-time progress tracking
  - File list with metadata
  - Download and delete operations

- **🔗 Blockchain Integration**
  - On-chain file metadata
  - Ownership verification
  - Access control lists
  - Immutable audit trail

- **🎨 User Experience**
  - Responsive design (mobile, tablet, desktop)
  - Dark theme with glassmorphism
  - Toast notifications
  - Loading states and error handling

### Advanced Features

- **Access Control**
  - Public/private file visibility
  - Granular permission management
  - Address-based access lists
  - Owner-only operations

- **Storage Flexibility**
  - Walrus decentralized storage
  - IndexedDB local fallback
  - Automatic mode detection
  - Seamless switching

- **Developer Experience**
  - Full TypeScript support
  - Comprehensive error handling
  - Detailed console logging
  - Hot module replacement

---

## 🚀 Demo

### Live Application

```bash
# Development server
npm run dev
# Access at: http://localhost:8080
```

### Screenshots

**Dashboard**
- Modern file management interface
- Real-time upload progress
- File list with actions

**Wallet Connection**
- One-click wallet integration
- Multiple wallet support
- Auto-reconnect functionality

---

## 🛠️ Technology Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.3.1 | UI framework |
| TypeScript | 5.8.3 | Type safety |
| Vite | 5.4.19 | Build tool |
| Tailwind CSS | 3.4.17 | Styling |
| shadcn/ui | Latest | Component library |
| React Router | 6.30.1 | Routing |
| TanStack Query | 5.83.0 | State management |

### Blockchain

| Technology | Version | Purpose |
|------------|---------|---------|
| @mysten/dapp-kit | 0.13.2 | Wallet integration |
| @mysten/sui | 1.44.0 | Sui SDK |
| Sui Move | 2024 | Smart contracts |

### Storage & Security

| Technology | Purpose |
|------------|---------|
| Web Crypto API | AES-256-GCM encryption |
| IndexedDB | Local storage fallback |
| Walrus | Decentralized storage |
| SessionStorage | Encryption key management |

---

## 📦 Installation

### Prerequisites

- **Node.js** 16+ or **Bun**
- **npm**, **yarn**, or **bun** package manager
- **Sui Wallet** extension (Sui Wallet, Nautilus, Slush, or Suiet)
- **Git** for cloning the repository

### Quick Start

```bash
# Clone the repository
git clone <repository-url>
cd walrusbox

# Install dependencies
npm install
# or
bun install

# Configure environment variables
cp .env.example .env
# Edit .env with your configuration

# Start development server
npm run dev
# or
bun dev
```

### Environment Configuration

Create a `.env` file in the project root:

```env
# Sui Network Configuration
VITE_SUI_NETWORK=testnet
VITE_SUI_RPC_URL=https://fullnode.testnet.sui.io:443

# Smart Contract Configuration
VITE_PACKAGE_ID=0x386cf5f10e6dc8639fcc494123439e333e738280a8f249b638cb7b84328a8885
VITE_REGISTRY_ID=0x97bcf633e416c1bed96725d3872d255a4481686a66d38a589c42220aae16f366

# Walrus Storage Configuration
# Mock mode (for local testing):
VITE_WALRUS_ENDPOINT=https://walrus-api.example.com
# Production mode (when ready):
# VITE_WALRUS_ENDPOINT=https://publisher.walrus-testnet.walrus.space
```

---

## 🎮 Usage

### 1. Install Wallet Extension

Choose one of the supported wallets:

- [Sui Wallet](https://chrome.google.com/webstore) (Recommended)
- [Nautilus Wallet](https://nautilus.tech/)
- [Slush Wallet](https://slush.app/)
- [Suiet Wallet](https://suiet.app/)

### 2. Get Testnet SUI

1. Open your wallet
2. Switch to **Testnet** network
3. Visit [Sui Testnet Faucet](https://testnet-faucet.sui.io/)
4. Request test tokens

### 3. Connect Wallet

1. Open the application
2. Click **"Connect Wallet"** button
3. Select your wallet from the modal
4. Approve the connection
5. Your address will be displayed

### 4. Upload Files

1. Navigate to **Dashboard**
2. Click **"Upload"** tab
3. Drag & drop files or click to browse
4. Click **"Upload & Encrypt File"**
5. Approve the transaction in your wallet
6. Wait for confirmation

### 5. Manage Files

- **View Files**: Click **"My Files"** tab
- **Download**: Click on a file to download
- **Delete**: Use the delete button
- **Share**: Generate secure share links (coming soon)

---

## 🏗️ Architecture

### System Overview

```
┌─────────────────────────────────────────────────┐
│                  User Browser                    │
│  ┌────────────────────────────────────────────┐ │
│  │         React Frontend (Vite)              │ │
│  │  - Wallet Integration (dApp Kit)           │ │
│  │  - File Upload UI                          │ │
│  │  - Encryption Service (AES-256)            │ │
│  └──────────┬──────────────────┬──────────────┘ │
│             │                  │                 │
└─────────────┼──────────────────┼─────────────────┘
              │                  │
              ▼                  ▼
    ┌──────────────────┐  ┌──────────────┐
    │  Sui Blockchain  │  │   Storage    │
    │  - FileRegistry  │  │  - Walrus    │
    │  - FileObject    │  │  - IndexedDB │
    │  - Access Control│  │  (Fallback)  │
    └──────────────────┘  └──────────────┘
```

### Data Flow

**Upload Flow:**
```
File Selection → Encryption (AES-256) → Storage Upload → 
Blockchain Transaction → UI Update → Success
```

**Download Flow:**
```
File Selection → Blockchain Verification → Storage Download → 
Decryption → File Download → Success
```

### Smart Contract

**Location:** `contracts/sources/walrusbox.move`

**Key Components:**

- **FileObject**: Stores file metadata
  - `file_id`: Unique identifier
  - `walrus_object_hash`: Storage reference
  - `owner`: File owner address
  - `visibility`: Public/private flag
  - `allowed_addresses`: Access control list

- **FileRegistry**: Shared registry
  - Maps file IDs to FileObject IDs
  - Enables file discovery
  - Maintains ownership records

**Functions:**

- `create_file`: Create new file metadata
- `set_visibility`: Update file visibility
- `add_allowed_address`: Grant access
- `remove_allowed_address`: Revoke access
- `verify_access`: Check permissions

---

## 📂 Project Structure

```
walrusbox/
├── contracts/                 # Sui Move smart contracts
│   ├── sources/
│   │   └── walrusbox.move    # Main contract
│   ├── Move.toml             # Contract configuration
│   └── README.md             # Contract documentation
│
├── src/
│   ├── components/           # React components
│   │   ├── ui/              # shadcn/ui components
│   │   ├── FileUploadArea.tsx
│   │   ├── FileListTable.tsx
│   │   ├── WalletConnectButton.tsx
│   │   └── StorageModeBanner.tsx
│   │
│   ├── pages/               # Page components
│   │   ├── Home.tsx
│   │   ├── Dashboard.tsx
│   │   ├── FileView.tsx
│   │   └── NotFound.tsx
│   │
│   ├── services/            # Business logic
│   │   ├── encryption.ts   # AES-256 encryption
│   │   ├── storage.ts      # Walrus/IndexedDB
│   │   ├── files.ts        # Blockchain integration
│   │   └── slushHelper.ts  # Wallet detection
│   │
│   ├── hooks/              # Custom React hooks
│   │   ├── useWallet.ts   # Wallet integration
│   │   └── use-toast.ts   # Notifications
│   │
│   ├── lib/                # Utility functions
│   ├── App.tsx             # Root component
│   └── main.tsx            # Entry point
│
├── public/                 # Static assets
├── .env                    # Environment variables
├── .env.example           # Environment template
├── package.json           # Dependencies
├── vite.config.ts         # Vite configuration
├── tailwind.config.ts     # Tailwind configuration
└── README.md              # This file
```

---

## 🔧 Development

### Available Scripts

```bash
# Development
npm run dev              # Start dev server with hot reload
npm run build            # Build for production
npm run build:dev        # Build for development
npm run preview          # Preview production build
npm run lint             # Run ESLint

# Smart Contract
cd contracts
sui move build           # Build contract
sui move test            # Run tests
sui client publish       # Deploy to network
```

### Development Workflow

1. **Start Development Server**
   ```bash
   npm run dev
   ```

2. **Make Changes**
   - Edit files in `src/`
   - Hot reload updates automatically

3. **Test Changes**
   - Upload files
   - Check console logs
   - Verify transactions

4. **Build for Production**
   ```bash
   npm run build
   ```

### Code Quality

- **TypeScript**: Full type safety
- **ESLint**: Code quality checks
- **Prettier**: Code formatting (via IDE)
- **Git Hooks**: Pre-commit checks (optional)

---

## 🧪 Testing

### Manual Testing

See [TESTING_CHECKLIST.md](./TESTING_CHECKLIST.md) for comprehensive testing guide.

**Quick Test:**

1. Connect wallet
2. Upload a file
3. Verify in list
4. Download file
5. Delete file

### Browser Compatibility

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | 90+ | ✅ Fully supported |
| Firefox | 88+ | ✅ Fully supported |
| Safari | 14+ | ✅ Supported |
| Edge | 90+ | ✅ Fully supported |

### Network Requirements

- **Testnet**: For development and testing
- **Mainnet**: For production deployment
- **HTTPS**: Required for Web Crypto API (encryption)
- **Localhost**: Works without HTTPS

---

## 📚 Documentation

### User Guides

- [Quick Start Guide](./QUICK_START.md) - Get started in 5 minutes
- [Testing Checklist](./TESTING_CHECKLIST.md) - 29-point test guide
- [Wallet Setup](./WALLET_CONNECTION_SUMMARY.md) - Wallet configuration

### Developer Guides

- [Wallet Integration](./WALLET_CONNECTION_AUDIT.md) - Technical audit
- [Walrus Storage](./WALRUS_STORAGE_GUIDE.md) - Storage implementation
- [Smart Contract](./contracts/README.md) - Contract documentation
- [BCS Serialization](./BCS_SERIALIZATION_FIX.md) - Transaction encoding

### Technical Documentation

- [System Status](./SYSTEM_STATUS.md) - System health report
- [Architecture](./FINAL_REPORT.md) - Complete system overview
- [API Reference](./WALRUS_API_IMPLEMENTATION.md) - Walrus API guide

---

## 🔐 Security

### Encryption

- **Algorithm**: AES-256-GCM
- **Key Generation**: Web Crypto API
- **Key Storage**: SessionStorage (client-side only)
- **IV**: Random 12-byte initialization vector

### Best Practices

1. **Never expose private keys**
   - All keys stored client-side
   - No server-side key storage
   - Keys cleared on session end

2. **Verify transactions**
   - Always review transaction details
   - Check gas costs
   - Verify recipient addresses

3. **Use HTTPS in production**
   - Required for Web Crypto API
   - Protects against MITM attacks
   - Ensures secure connections

4. **Regular audits**
   - Review smart contract code
   - Monitor transaction patterns
   - Update dependencies regularly

### Security Considerations

- Files encrypted before upload
- Blockchain provides immutable audit trail
- Access control enforced on-chain
- No centralized point of failure

---

## 🚀 Deployment

### Prerequisites

- Domain with HTTPS
- Sui wallet with SUI tokens
- Deployed smart contract
- Configured environment variables

### Build for Production

```bash
# Build optimized bundle
npm run build

# Output in dist/ directory
# Deploy to your hosting provider
```

### Hosting Options

- **Vercel**: Recommended for React apps
- **Netlify**: Easy deployment
- **AWS S3 + CloudFront**: Scalable solution
- **IPFS**: Decentralized hosting

### Post-Deployment

1. Verify HTTPS is enabled
2. Test wallet connection
3. Upload test file
4. Monitor gas costs
5. Set up analytics

---

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

### How to Contribute

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
4. **Run tests and linting**
   ```bash
   npm run lint
   ```
5. **Commit your changes**
   ```bash
   git commit -m 'Add amazing feature'
   ```
6. **Push to your branch**
   ```bash
   git push origin feature/amazing-feature
   ```
7. **Open a Pull Request**

### Code Standards

- Follow TypeScript best practices
- Use existing component patterns
- Add comments for complex logic
- Update documentation as needed
- Ensure all tests pass

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

### Built With

- [Sui Blockchain](https://sui.io/) - Layer 1 blockchain
- [Mysten Labs](https://mystenlabs.com/) - Sui SDK and tools
- [Walrus](https://docs.walrus.site/) - Decentralized storage
- [shadcn/ui](https://ui.shadcn.com/) - Component library
- [Tailwind CSS](https://tailwindcss.com/) - Styling framework

### Special Thanks

- Sui Foundation for blockchain infrastructure
- Mysten Labs for excellent developer tools
- Open source community for inspiration

---

## 📞 Support

### Getting Help

- **Documentation**: Check the [docs](./QUICK_START.md)
- **Issues**: Open a [GitHub issue](https://github.com/your-repo/issues)
- **Discord**: Join the [Sui Discord](https://discord.gg/sui)
- **Twitter**: Follow [@SuiNetwork](https://twitter.com/SuiNetwork)

### Common Issues

See [Troubleshooting Guide](./ENCRYPTION_FIX_COMPLETE.md#troubleshooting) for solutions to common problems.

---

## 🗺️ Roadmap

### Current Version (v1.0)

- ✅ Wallet integration
- ✅ File upload/download
- ✅ Client-side encryption
- ✅ Blockchain metadata
- ✅ Access control

### Upcoming Features

- 🔄 File sharing with links
- 🔄 Folder organization
- 🔄 File versioning
- 🔄 Collaborative features
- 🔄 Mobile app

### Future Plans

- Advanced encryption options
- Multi-chain support
- Decentralized identity
- NFT integration
- Enterprise features

---

## 📊 Stats

- **Smart Contract**: Deployed on Sui Testnet
- **Package ID**: `0x386cf5f10e6dc8639fcc494123439e333e738280a8f249b638cb7b84328a8885`
- **Network**: Sui Testnet
- **Status**: Production Ready

---

<div align="center">

**Built with ❤️ for the Web3 community**

[⬆ Back to Top](#walrusbox)

</div>
