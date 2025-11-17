# Design Document

## Overview

This design document outlines the architecture and implementation approach for transforming WalrusBox into a hackathon-winning application. The design focuses on maintaining the existing solid foundation while adding innovative features that showcase the unique advantages of Sui blockchain and Walrus decentralized storage.

### Design Principles

1. **Performance First**: All features must maintain 60 FPS and sub-second response times
2. **Progressive Enhancement**: Core functionality works offline, enhanced features require connectivity
3. **User-Centric**: Every feature solves a real user problem
4. **Demo-Ready**: Features designed to showcase capabilities effectively
5. **Production Quality**: Code quality and testing suitable for production deployment

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     React Frontend (Vite)                    │
│  ┌────────────┬────────────┬────────────┬─────────────────┐ │
│  │ UI Layer   │ State Mgmt │ Services   │ Workers         │ │
│  │ Components │ TanStack   │ Business   │ Background      │ │
│  │ Pages      │ Query      │ Logic      │ Processing      │ │
│  └────────────┴────────────┴────────────┴─────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
              ▼               ▼               ▼
    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
    │ Sui          │  │ Walrus       │  │ IndexedDB    │
    │ Blockchain   │  │ Storage      │  │ Local Cache  │
    │ - Metadata   │  │ - Blobs      │  │ - Offline    │
    │ - Access     │  │ - Files      │  │ - Queue      │
    └──────────────┘  └──────────────┘  └──────────────┘
```

### Component Architecture

The application follows a layered architecture with clear separation of concerns:

**Presentation Layer**: React components with Framer Motion animations
**State Management**: TanStack Query for server state, React Context for UI state
**Business Logic**: Service layer with TypeScript interfaces
**Data Layer**: Sui blockchain, Walrus storage, IndexedDB cache
**Background Processing**: Web Workers for encryption and heavy computations

## Components and Interfaces

### 1. Performance Optimization Components

#### Virtual List Component

**Purpose**: Render large file lists efficiently using virtualization

**Interface**:
```typescript
interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
}
```

**Implementation Strategy**:
- Use `react-window` or custom implementation with IntersectionObserver
- Render only visible items plus overscan buffer
- Maintain scroll position during updates
- Support dynamic item heights with measurement cache

#### Code Splitting Strategy

**Approach**: Route-based code splitting with React.lazy()
- Split by page: Home, Dashboard, FileView, SharePage, Analytics
- Split heavy components: 3D animations, file preview, QR generator
- Preload critical routes on hover
- Show loading skeleton during chunk load

#### Asset Optimization

**Images**: Use WebP format with fallbacks, lazy load below fold
**Fonts**: Subset fonts, preload critical fonts
**Icons**: Use SVG sprites, inline critical icons
**Bundle**: Tree-shake unused code, minify production builds

### 2. Advanced File Management

#### Folder Structure Design

**Data Model**:
```typescript
interface FolderObject {
  id: string;
  name: string;
  parentId: string | null;
  path: string; // e.g., "/Documents/Projects"
  owner: address;
  createdAt: u64;
  color?: string; // Optional folder color
}

interface FileObject {
  // ... existing fields
  folderId: string | null; // Reference to parent folder
  path: string; // Full path for display
}
```

**Smart Contract Extension**:
- Add `FolderRegistry` shared object similar to `FileRegistry`
- Add `create_folder`, `move_file`, `delete_folder` functions
- Implement recursive folder operations with gas optimization
- Store folder hierarchy as adjacency list for efficient queries

#### Drag and Drop System

**Implementation**:
- Use HTML5 Drag and Drop API with React DnD library
- Support file-to-folder, folder-to-folder, multi-select drag
- Show drop zones with visual feedback
- Validate drop targets before allowing drop
- Batch blockchain transactions for multi-file moves

#### Bulk Operations Manager

**Service Interface**:
```typescript
interface BulkOperationService {
  moveFiles(fileIds: string[], targetFolderId: string): Promise<BatchResult>;
  deleteFiles(fileIds: string[]): Promise<BatchResult>;
  shareFiles(fileIds: string[], options: ShareOptions): Promise<ShareLink[]>;
  updateVisibility(fileIds: string[], visibility: 'public' | 'private'): Promise<BatchResult>;
}

interface BatchResult {
  successful: string[];
  failed: Array<{ id: string; error: string }>;
  totalGasCost: number;
}
```

**Implementation**:
- Use Sui programmable transactions to batch operations
- Show progress modal with individual operation status
- Allow cancellation of pending operations
- Retry failed operations with exponential backoff
- Optimize gas by grouping similar operations

#### Advanced Search System

**Architecture**:
- Client-side search using Fuse.js for fuzzy matching
- Index files in memory for instant search
- Support search operators: `type:pdf`, `size:>10mb`, `date:2024`
- Debounce search input (300ms) to reduce re-renders
- Highlight matching terms in results

**Search Index Structure**:
```typescript
interface SearchIndex {
  files: Map<string, FileSearchEntry>;
  folders: Map<string, FolderSearchEntry>;
  tags: Map<string, string[]>; // tag -> fileIds
}
```

### 3. Enhanced Sharing System

#### Enhanced Share Link Model

**Extended Data Structure**:
```typescript
interface EnhancedShareLink extends ShareLink {
  permissions: {
    canView: boolean;
    canDownload: boolean;
    canShare: boolean;
  };
  accessLog: AccessLogEntry[];
  qrCode: string; // Base64 encoded QR code
  shortUrl?: string; // Optional short URL
  password?: string; // Optional password hash
}

interface AccessLogEntry {
  timestamp: Date;
  walletAddress?: string;
  ipHash: string; // Hashed IP for privacy
  action: 'view' | 'download' | 'denied';
  userAgent: string;
}
```

**QR Code Generation**:
- Use `qrcode.react` library (already installed)
- Generate QR code on share link creation
- Include error correction level H (30% recovery)
- Embed logo in center for branding
- Support download as PNG/SVG

#### Permission System

**Implementation**:
- Store permissions in share link metadata
- Validate permissions on every access attempt
- Show permission-appropriate UI (hide download if view-only)
- Log permission violations for security audit
- Allow owner to update permissions without regenerating link

### 4. Analytics Dashboard

#### Data Collection Service

**Analytics Data Model**:
```typescript
interface AnalyticsData {
  storage: {
    totalBytes: number;
    fileCount: number;
    folderCount: number;
    byType: Record<string, number>; // MIME type -> bytes
  };
  activity: {
    uploads: TimeSeriesData[];
    downloads: TimeSeriesData[];
    shares: TimeSeriesData[];
  };
  costs: {
    totalSpent: number; // in SUI
    storageEpochs: number;
    transactionFees: number;
    projectedMonthly: number;
  };
  sharing: {
    totalLinks: number;
    activeLinks: number;
    totalAccesses: number;
    topFiles: Array<{ fileId: string; accessCount: number }>;
  };
}
```

**Data Collection Strategy**:
- Track events in localStorage with timestamps
- Aggregate data on-demand for dashboard display
- Query blockchain for transaction history and costs
- Calculate storage costs based on Walrus pricing
- Cache analytics data with 5-minute TTL

#### Visualization Components

**Charts**: Use Recharts library (already installed)
- Line chart for activity timeline (uploads/downloads over time)
- Pie chart for storage distribution by file type
- Bar chart for top shared files
- Area chart for cost trends

**Real-time Updates**: Use TanStack Query with polling
- Refresh analytics every 30 seconds when dashboard is active
- Show loading skeleton during refresh
- Animate chart transitions for smooth updates

### 5. Offline Support and Sync

#### Offline Detection

**Implementation**:
```typescript
interface NetworkStatus {
  isOnline: boolean;
  lastOnline: Date;
  connectionType: 'wifi' | '4g' | 'slow-2g' | 'unknown';
}
```

**Strategy**:
- Listen to `online`/`offline` events
- Ping Sui RPC endpoint every 30 seconds
- Show persistent banner when offline
- Disable blockchain-dependent features gracefully
- Cache last known state for offline viewing

#### Operation Queue System

**Queue Data Structure**:
```typescript
interface QueuedOperation {
  id: string;
  type: 'upload' | 'delete' | 'share' | 'update';
  payload: any;
  createdAt: Date;
  retryCount: number;
  status: 'pending' | 'processing' | 'failed';
  error?: string;
}
```

**Queue Processing**:
- Store queue in IndexedDB for persistence
- Process queue when connection restored
- Show queue status in UI with progress
- Allow manual retry or cancellation
- Implement exponential backoff for failures

#### Sync Conflict Resolution

**Conflict Detection**:
- Compare local timestamp with blockchain timestamp
- Detect if file was modified on another device
- Show conflict resolution UI with both versions

**Resolution Strategies**:
- Keep local version
- Keep remote version
- Keep both (create new version)
- Manual merge (for metadata conflicts)

### 6. File Versioning System

#### Version Data Model

**Smart Contract Extension**:
```typescript
// Move contract structure
struct FileVersion has key, store {
  id: UID,
  file_id: String,
  version_number: u64,
  walrus_object_hash: vector<u8>,
  created_at: u64,
  size: u64,
  checksum: vector<u8>,
  parent_version: Option<ID>,
}

struct VersionHistory has key {
  id: UID,
  file_id: String,
  versions: vector<ID>, // Ordered list of version IDs
  current_version: ID,
}
```

**Frontend Interface**:
```typescript
interface FileVersion {
  id: string;
  versionNumber: number;
  blobId: string;
  createdAt: Date;
  size: number;
  isCurrent: boolean;
}
```

**Version Management**:
- Automatically create version on file update
- Link versions in chronological order
- Store version metadata on-chain
- Keep all blob references for restoration
- Implement version pruning to reduce costs

#### Version UI Components

**Version History Modal**:
- Timeline view of all versions
- Show size and date for each version
- Preview differences between versions
- One-click restore to any version
- Bulk delete old versions

### 7. Enhanced Security Features

#### Password Protection Layer

**Implementation**:
```typescript
interface PasswordProtectedFile {
  fileId: string;
  passwordHash: string; // PBKDF2 hash
  salt: string;
  iterations: number;
}
```

**Password Flow**:
1. User sets password for file
2. Derive key using PBKDF2 (100,000 iterations)
3. Store hash and salt in localStorage
4. Require password before decryption
5. Cache password in session for convenience

**Security Considerations**:
- Never store plaintext passwords
- Use Web Crypto API for key derivation
- Implement rate limiting on password attempts
- Clear password cache on session end

#### File Expiration System

**Smart Contract Function**:
```move
public entry fun set_expiration(
  file_object: &mut FileObject,
  expiration_timestamp: u64,
  ctx: &TxContext
)
```

**Expiration Handling**:
- Store expiration timestamp on-chain
- Check expiration before allowing access
- Schedule automatic deletion using cron job or manual trigger
- Notify owner before expiration (24 hours warning)
- Allow extension of expiration date

#### Two-Factor Download

**Implementation**:
- Require wallet signature for each download
- Generate challenge message with timestamp
- Verify signature before serving file
- Log all download attempts with signatures
- Implement rate limiting (max 10 downloads/minute)

### 8. Collaborative Features

#### Collaborator Management

**Data Model**:
```typescript
interface Collaborator {
  walletAddress: string;
  permissions: {
    canView: boolean;
    canDownload: boolean;
    canShare: boolean;
    canDelete: boolean;
    canManageCollaborators: boolean;
  };
  addedAt: Date;
  addedBy: string;
  lastAccess?: Date;
}

interface CollaborativeFile extends FileObject {
  collaborators: Collaborator[];
  owner: string;
}
```

**Permission Enforcement**:
- Check permissions on every operation
- Store permissions on-chain in FileObject
- Validate wallet signature for operations
- Show permission-appropriate UI
- Log all collaborator actions

#### Real-time Presence

**Implementation Strategy**:
- Use WebSocket or Server-Sent Events for real-time updates
- Show active viewers with avatar/address
- Update presence every 30 seconds
- Remove inactive users after 2 minutes
- Display "User X is viewing" indicator

**Fallback**: If real-time not available, poll every 10 seconds

#### Comment System

**Data Model**:
```typescript
interface FileComment {
  id: string;
  fileId: string;
  author: string; // wallet address
  content: string;
  createdAt: Date;
  editedAt?: Date;
  parentId?: string; // for threaded comments
}
```

**Storage Strategy**:
- Store comments on-chain for immutability
- Use Sui events for comment notifications
- Cache comments in IndexedDB for offline viewing
- Support markdown formatting in comments
- Allow editing within 5 minutes of posting

### 9. Mobile Optimization

#### Responsive Design Strategy

**Breakpoints**:
- Mobile: < 640px (single column, bottom navigation)
- Tablet: 640px - 1024px (two columns, side navigation)
- Desktop: > 1024px (multi-column, full features)

**Mobile-Specific Components**:
- Bottom navigation bar with 5 main actions
- Swipeable file cards for quick actions
- Pull-to-refresh for file list
- Touch-optimized buttons (min 44x44px)
- Collapsible sections to save space

#### Touch Gestures

**Gesture Library**: Use `react-use-gesture` or custom implementation

**Supported Gestures**:
- Swipe left: Delete file
- Swipe right: Share file
- Long press: Select multiple files
- Pinch: Zoom file preview
- Pull down: Refresh list

#### PWA Configuration

**manifest.json**:
```json
{
  "name": "WalrusBox",
  "short_name": "WalrusBox",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0f172a",
  "theme_color": "#0ea5e9",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

**Service Worker**:
- Cache static assets for offline use
- Implement background sync for uploads
- Show push notifications for shares
- Update cache on new version

### 10. Demo Mode and Presentation Features

#### Demo Mode Implementation

**Activation**: URL parameter `?demo=true` or toggle in settings

**Sample Data Generation**:
```typescript
interface DemoDataGenerator {
  generateFiles(count: number): FileMetadata[];
  generateFolders(count: number): FolderObject[];
  generateShareLinks(count: number): ShareLink[];
  generateAnalytics(): AnalyticsData;
}
```

**Demo Features**:
- Pre-populated file list with diverse file types
- Realistic file names and sizes
- Sample share links with activity
- Mock analytics with charts
- Simulated upload/download with animations

#### Process Visualization

**Upload Visualization**:
1. File selection → Show file icon with size
2. Encryption → Animated lock icon with progress
3. Walrus upload → Animated network transfer
4. Blockchain transaction → Block animation
5. Confirmation → Success checkmark

**Technology Stack Diagram**:
- Animated SVG showing data flow
- Highlight each layer as data passes through
- Show encryption at client layer
- Show storage at Walrus layer
- Show metadata at Sui layer

#### Split-Screen Demo

**Implementation**:
- Use CSS Grid for side-by-side layout
- Left: Sender perspective (creating share link)
- Right: Receiver perspective (accessing link)
- Synchronized actions between both views
- Highlight corresponding elements

**Demo Script**:
1. Sender uploads file
2. Sender creates share link with restrictions
3. Receiver opens link
4. Receiver connects wallet
5. Receiver downloads file
6. Show access log update

### 11. Integration Enhancements

#### Explorer Integration

**Sui Explorer Links**:
- FileObject: `https://suiscan.xyz/testnet/object/{objectId}`
- Transaction: `https://suiscan.xyz/testnet/tx/{txDigest}`
- Address: `https://suiscan.xyz/testnet/account/{address}`

**Walrus Scan Links**:
- Blob: `https://walrus-testnet-explorer.walrus.space/blob/{blobId}`
- Already implemented in storage service

**UI Integration**:
- Add "View on Explorer" button to file details
- Show transaction hash with explorer link after operations
- Display blob ID with Walrus Scan link
- Add explorer icons for visual recognition

#### Data Export/Import

**Export Format**:
```typescript
interface ExportData {
  version: string;
  exportedAt: Date;
  owner: string;
  files: Array<{
    fileId: string;
    objectId: string;
    blobId: string;
    fileName: string;
    metadata: FileMetadata;
  }>;
  folders: FolderObject[];
  shareLinks: ShareLink[];
}
```

**Export Implementation**:
- Generate JSON file with all metadata
- Include blockchain references
- Optionally include encryption keys (with warning)
- Download as `walrusbox-export-{date}.json`

**Import Implementation**:
- Validate JSON schema
- Check for duplicate file IDs
- Verify blockchain references exist
- Restore folder structure
- Recreate share links

### 12. Error Handling and User Feedback

#### Error Classification System

**Error Types**:
```typescript
enum ErrorType {
  NETWORK = 'network',
  BLOCKCHAIN = 'blockchain',
  STORAGE = 'storage',
  ENCRYPTION = 'encryption',
  VALIDATION = 'validation',
  PERMISSION = 'permission',
}

interface AppError {
  type: ErrorType;
  code: string;
  message: string;
  userMessage: string;
  suggestedAction: string;
  retryable: boolean;
  details?: any;
}
```

**Error Messages**:
- Technical message for logs
- User-friendly message for display
- Suggested action for resolution
- Link to documentation if applicable

#### Progress Indicators

**Upload Progress**:
- File size and upload speed
- Estimated time remaining
- Current step (encrypting/uploading/confirming)
- Percentage complete
- Cancel button

**Transaction Progress**:
- "Waiting for wallet approval"
- "Transaction submitted"
- "Confirming on blockchain" (with block count)
- "Transaction confirmed"
- Show transaction hash and explorer link

#### Toast Notification System

**Already using Sonner**, enhance with:
- Success: Green with checkmark icon
- Error: Red with X icon, show retry button
- Warning: Yellow with warning icon
- Info: Blue with info icon
- Loading: Spinner with progress text

**Notification Queue**:
- Stack multiple notifications
- Auto-dismiss after 5 seconds (except errors)
- Allow manual dismissal
- Persist important notifications

### 13. Accessibility Implementation

#### Keyboard Navigation

**Focus Management**:
- Visible focus indicators (2px outline)
- Logical tab order
- Skip to main content link
- Keyboard shortcuts with help modal

**Keyboard Shortcuts**:
- `Ctrl/Cmd + U`: Upload file
- `Ctrl/Cmd + F`: Focus search
- `Ctrl/Cmd + N`: New folder
- `Escape`: Close modal
- `Arrow keys`: Navigate file list
- `Enter`: Open selected file
- `Delete`: Delete selected file

#### ARIA Labels

**Implementation**:
```typescript
// Example component with ARIA
<button
  aria-label="Upload file"
  aria-describedby="upload-help"
  onClick={handleUpload}
>
  <UploadIcon aria-hidden="true" />
</button>
```

**Required ARIA Attributes**:
- `aria-label` for icon-only buttons
- `aria-describedby` for additional context
- `aria-live` for dynamic content updates
- `role` for custom components
- `aria-expanded` for collapsible sections

#### Color Contrast

**WCAG 2.1 AA Requirements**:
- Normal text: 4.5:1 contrast ratio
- Large text (18pt+): 3:1 contrast ratio
- UI components: 3:1 contrast ratio

**Implementation**:
- Use Tailwind's color palette with sufficient contrast
- Test with browser DevTools contrast checker
- Provide high contrast theme option
- Avoid color-only information (use icons + color)

#### Reduced Motion

**Implementation**:
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

**Framer Motion Integration**:
```typescript
const shouldReduceMotion = useReducedMotion();

<motion.div
  animate={shouldReduceMotion ? {} : { scale: 1.1 }}
  transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.3 }}
>
```

## Data Models

### Core Data Models

#### Enhanced FileObject (Smart Contract)

```move
struct FileObject has key, store {
  id: UID,
  file_id: String,
  walrus_object_hash: vector<u8>,
  owner: address,
  visibility: u8,
  allowed_addresses: vector<address>,
  created_at: u64,
  // New fields
  folder_id: Option<String>,
  file_name: String,
  file_size: u64,
  mime_type: String,
  version_history_id: Option<ID>,
  expiration_timestamp: Option<u64>,
  collaborators: vector<Collaborator>,
  tags: vector<String>,
}

struct Collaborator has store {
  address: address,
  permissions: u8, // Bitfield for permissions
  added_at: u64,
}
```

#### Frontend State Management

**TanStack Query Keys**:
```typescript
const queryKeys = {
  files: ['files'] as const,
  file: (id: string) => ['files', id] as const,
  folders: ['folders'] as const,
  analytics: ['analytics'] as const,
  shareLinks: (fileId: string) => ['shareLinks', fileId] as const,
};
```

**React Context**:
```typescript
interface AppState {
  user: {
    address: string | null;
    isConnected: boolean;
  };
  ui: {
    theme: 'light' | 'dark';
    sidebarOpen: boolean;
    selectedFiles: string[];
  };
  network: {
    isOnline: boolean;
    queuedOperations: QueuedOperation[];
  };
  demo: {
    enabled: boolean;
    data: DemoData;
  };
}
```

## Error Handling

### Error Boundary Strategy

**Component-Level Boundaries**:
- Wrap each major feature in error boundary
- Show fallback UI with retry button
- Log errors to console (or error tracking service)
- Allow partial app functionality if one feature fails

**Global Error Boundary**:
- Catch unhandled errors
- Show user-friendly error page
- Provide "Return to Home" button
- Log error details for debugging

### Retry Logic

**Exponential Backoff**:
```typescript
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await sleep(Math.pow(2, i) * 1000);
    }
  }
  throw new Error('Max retries exceeded');
}
```

## Testing Strategy

### Unit Testing

**Framework**: Vitest (fast, Vite-native)

**Coverage Targets**:
- Services: 90% coverage
- Utilities: 95% coverage
- Components: 70% coverage (focus on logic)

**Key Test Areas**:
- Encryption/decryption correctness
- File upload/download flow
- Share link generation and validation
- Permission checking
- Search and filtering logic

### Integration Testing

**Framework**: Vitest + Testing Library

**Test Scenarios**:
- Complete upload flow (encrypt → upload → blockchain)
- Complete download flow (blockchain → download → decrypt)
- Share link creation and access
- Folder operations (create, move, delete)
- Bulk operations

### E2E Testing

**Framework**: Playwright (optional, for critical paths)

**Critical User Journeys**:
1. New user onboarding
2. Upload and share file
3. Access shared file
4. Organize files in folders
5. View analytics dashboard

### Performance Testing

**Metrics to Track**:
- Time to Interactive (TTI) < 3s
- First Contentful Paint (FCP) < 1.5s
- Largest Contentful Paint (LCP) < 2.5s
- Cumulative Layout Shift (CLS) < 0.1
- File list render time < 100ms for 1000 files

**Tools**:
- Lighthouse CI for automated audits
- Chrome DevTools Performance panel
- React DevTools Profiler

## Security Considerations

### Client-Side Security

**Encryption**:
- Use Web Crypto API (FIPS 140-2 compliant)
- Never expose encryption keys
- Clear sensitive data from memory after use
- Validate all user inputs

**XSS Prevention**:
- React's built-in XSS protection
- Sanitize user-generated content (file names, comments)
- Use Content Security Policy headers
- Avoid `dangerouslySetInnerHTML`

### Blockchain Security

**Transaction Validation**:
- Verify transaction parameters before signing
- Show clear transaction preview to user
- Implement gas limit checks
- Validate smart contract addresses

**Access Control**:
- Verify wallet ownership on every operation
- Check permissions before allowing actions
- Log all access attempts
- Implement rate limiting

## Deployment Strategy

### Build Optimization

**Production Build**:
```bash
npm run build
# Output: dist/ directory
```

**Optimizations**:
- Code splitting by route
- Tree shaking unused code
- Minification and compression
- Asset optimization (images, fonts)
- Source maps for debugging

### Environment Configuration

**Environment Variables**:
```env
# Production
VITE_SUI_NETWORK=mainnet
VITE_SUI_RPC_URL=https://fullnode.mainnet.sui.io
VITE_WALRUS_ENDPOINT=https://publisher.walrus.walrus.space
VITE_PACKAGE_ID=<mainnet_package_id>
VITE_REGISTRY_ID=<mainnet_registry_id>
```

### Hosting Options

**Recommended**: Vercel or Netlify
- Automatic deployments from Git
- Edge network for fast global access
- HTTPS by default
- Environment variable management

**Alternative**: IPFS for fully decentralized hosting
- Use Fleek or Pinata for pinning
- Update DNS to point to IPFS hash
- Requires manual updates for new versions

## Performance Benchmarks

### Target Metrics

| Metric | Target | Current | Priority |
|--------|--------|---------|----------|
| Initial Load | < 2s | TBD | High |
| File Upload (10MB) | < 5s | TBD | High |
| File List Render (1000 files) | < 100ms | TBD | Medium |
| Search Response | < 50ms | TBD | Medium |
| Animation FPS | 60 FPS | 60 FPS | Low |

### Optimization Priorities

1. **Critical**: Initial load time, file operations
2. **Important**: Search, navigation, list rendering
3. **Nice to have**: Animation smoothness, transitions

## Migration Strategy

### Backward Compatibility

**Approach**: Maintain compatibility with existing data
- Support old FileObject structure
- Migrate data lazily (on access)
- Provide migration tool for bulk updates
- Keep old share links working

### Phased Rollout

**Phase 1**: Core improvements (performance, folders, search)
**Phase 2**: Advanced features (versioning, collaboration)
**Phase 3**: Polish (analytics, demo mode, accessibility)

### Testing Plan

1. Test on testnet with sample data
2. Beta test with small user group
3. Monitor for issues and gather feedback
4. Fix critical bugs before mainnet
5. Deploy to mainnet with monitoring

## Conclusion

This design provides a comprehensive roadmap for transforming WalrusBox into a hackathon-winning application. The architecture maintains the existing solid foundation while adding innovative features that showcase the unique advantages of Sui blockchain and Walrus decentralized storage.

Key differentiators:
- **Performance**: Sub-second response times, 60 FPS animations
- **Innovation**: Versioning, collaboration, offline support
- **Polish**: Accessibility, error handling, demo mode
- **Integration**: Deep Sui ecosystem integration

The implementation prioritizes features that are both technically impressive and practically useful, ensuring the application stands out in both functionality and presentation.
