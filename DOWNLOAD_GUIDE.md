# 📥 File Download Guide

## How to Download Your Uploaded Files

### From the Dashboard:

1. **Navigate to Dashboard** (`/dashboard`)
2. **Find your file** in the file list
3. **Click the Eye icon** (👁️) to view the file
4. **Click "Download File"** button

### What Happens Behind the Scenes:

#### For Encrypted Files (Seal):
```
1. Check localStorage for encryption key: seal_key_{fileId}
2. Get Seal metadata: seal_metadata_{fileId}
3. Download encrypted chunks from Walrus
4. Reassemble chunks
5. Decrypt using AES-256-GCM
6. Verify integrity (optional)
7. Present decrypted file to browser
8. Browser downloads the file
```

#### For Unencrypted Files (Legacy):
```
1. Get blob ID from localStorage
2. Download from Walrus
3. Present file to browser
4. Browser downloads the file
```

## Download Methods:

### Method 1: Through UI (Recommended)

**Steps:**
1. Go to your dashboard
2. Click on any file row
3. Click "Download File" button
4. File downloads automatically

### Method 2: Direct Blob Access (Advanced)

If you have the blob ID, you can download directly from Walrus:

```bash
# Download encrypted blob (you'll need to decrypt it)
curl https://aggregator.walrus-testnet.walrus.space/v1/YOUR_BLOB_ID -o encrypted_file.bin
```

**Note:** This downloads the ENCRYPTED file. You need the encryption key to decrypt it.

### Method 3: Using Browser Console (Debug)

```javascript
// Get your latest file
const files = JSON.parse(localStorage.getItem('walrusbox_local_files') || '[]');
const file = files[files.length - 1];

// Get encryption key
const sealKey = localStorage.getItem(`seal_key_${file.id}`);

// Get metadata
const metadata = JSON.parse(localStorage.getItem(`seal_metadata_${file.id}`));

console.log('File:', file.name);
console.log('Blob ID:', metadata.blobId);
console.log('Encrypted:', !!sealKey);
console.log('Walrus URL:', metadata.aggregatorUrl);
```

## Troubleshooting:

### "Could not load file"

**Possible causes:**
1. **Encryption key missing** - The file was uploaded but the key wasn't saved
2. **Blob not found on Walrus** - The blob expired or was deleted
3. **Corrupted chunks** - One or more chunks failed integrity check

**Solutions:**
- Check if encryption key exists: `localStorage.getItem('seal_key_{fileId}')`
- Verify blob on Walrus: Visit `https://walrus-testnet-explorer.walrus.space/blob/{blobId}`
- Try re-uploading the file

### "Decryption failed"

**Possible causes:**
1. **Wrong encryption key** - Key doesn't match the encrypted data
2. **Corrupted data** - File was modified or corrupted during storage

**Solutions:**
- Verify the encryption key is correct
- Check file integrity using the "Verify" button in dashboard
- Re-upload the file if corrupted

### Download is slow

**Possible causes:**
1. **Large file** - Downloading and decrypting takes time
2. **Multiple chunks** - Each chunk needs to be downloaded separately
3. **Network issues** - Slow connection to Walrus nodes

**Solutions:**
- Be patient - large files take time
- Check your internet connection
- Try again later if Walrus network is congested

## File Storage Locations:

### Encrypted Data:
- **Walrus Network** - Distributed across storage nodes
- **Blob ID** - Unique identifier for retrieval
- **Chunks** - Large files split into multiple blobs

### Encryption Keys:
- **Browser localStorage** - `seal_key_{fileId}`
- **⚠️ Important:** Keys are only stored locally!
- **Backup:** Export keys before clearing browser data

### Metadata:
- **Sui Blockchain** - FileObject with file info
- **Browser localStorage** - Local copy for quick access
- **Seal Metadata** - Chunk info, encryption details

## Security Notes:

### ✅ What's Encrypted:
- File content (AES-256-GCM)
- File chunks (if split)
- Stored on Walrus

### ❌ What's NOT Encrypted:
- File name (stored locally)
- File size (stored locally)
- Upload timestamp (on-chain)
- Blob IDs (public on Walrus)

### 🔑 Encryption Key Management:

**Important:**
- Keys are stored in browser localStorage
- Clearing browser data = losing access to files
- No key recovery mechanism (by design)
- Export keys before switching browsers

**Best Practices:**
1. Backup encryption keys regularly
2. Don't clear browser data without exporting keys
3. Use the same browser/device for access
4. Consider implementing key backup to cloud (future feature)

## API Reference:

### Download Encrypted File:

```typescript
import { sealStorageService } from '@/services/seal/sealStorage';

// Get metadata
const metadata: SealFileMetadata = JSON.parse(
  localStorage.getItem(`seal_metadata_${fileId}`)
);

// Get encryption key
const encryptionKey = localStorage.getItem(`seal_key_${fileId}`);

// Download and decrypt
const blob = await sealStorageService.downloadFile(
  metadata,
  {
    decrypt: true,
    encryptionKey: encryptionKey!,
    verifyIntegrity: true,
    onProgress: (progress) => {
      console.log(`${progress.stage}: ${progress.percentage}%`);
    }
  }
);

// Create download link
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = metadata.fileName;
a.click();
URL.revokeObjectURL(url);
```

### Download Unencrypted File:

```typescript
import { storageService } from '@/services/storage';

// Download blob
const blob = await storageService.getBlob(fileId);

// Create download link
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = fileName;
a.click();
URL.revokeObjectURL(url);
```

## Performance Tips:

1. **Large Files:** Download may take several minutes
2. **Multiple Chunks:** Each chunk is downloaded separately
3. **Decryption:** CPU-intensive for large files
4. **Browser Memory:** Large files may cause memory issues

## Future Enhancements:

- [ ] Progress bar for downloads
- [ ] Resume interrupted downloads
- [ ] Batch download multiple files
- [ ] Export encryption keys
- [ ] Cloud backup for keys
- [ ] Streaming decryption for large files
- [ ] Download history
- [ ] Bandwidth optimization

## Support:

If you encounter issues:
1. Check browser console for errors
2. Verify file exists in dashboard
3. Check Walrus explorer for blob status
4. Verify encryption key exists in localStorage
5. Try re-uploading the file

---

**Remember:** Your encryption keys are stored locally. Back them up before clearing browser data!
