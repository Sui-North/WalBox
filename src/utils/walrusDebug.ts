// Walrus Debug Utilities
// Helper functions to inspect and debug Walrus blob tracking

import { blobTrackingService } from '@/services/blobTracking';

/**
 * Get all tracked blobs and log their Walrus URLs
 */
export async function listAllBlobs() {
  const blobs = await blobTrackingService.getAllBlobs();
  
  console.log(`\n📦 Found ${blobs.length} tracked blobs:\n`);
  
  blobs.forEach((blob, index) => {
    console.log(`${index + 1}. ${blob.fileName}`);
    console.log(`   Blob ID: ${blob.blobId}`);
    console.log(`   🔍 Walrus Scan: ${blob.walrusScanUrl}`);
    console.log(`   🔗 Download URL: ${blob.aggregatorUrl}`);
    console.log(`   📊 Size: ${formatBytes(blob.encodedSize)}`);
    console.log(`   💰 Cost: ${blob.storageCost} SUI`);
    console.log(`   📅 Uploaded: ${blob.uploadedAt.toLocaleString()}`);
    console.log('');
  });
  
  return blobs;
}

/**
 * Get the most recent blob
 */
export async function getLatestBlob() {
  const blobs = await blobTrackingService.getAllBlobs();
  
  if (blobs.length === 0) {
    console.log('❌ No blobs found');
    return null;
  }
  
  const latest = blobs.sort((a, b) => 
    b.uploadedAt.getTime() - a.uploadedAt.getTime()
  )[0];
  
  console.log('\n🆕 Latest uploaded blob:');
  console.log(`   File: ${latest.fileName}`);
  console.log(`   Blob ID: ${latest.blobId}`);
  console.log(`   🔍 Walrus Scan: ${latest.walrusScanUrl}`);
  console.log(`   🔗 Download URL: ${latest.aggregatorUrl}`);
  console.log('');
  
  return latest;
}

/**
 * Open Walrus Scan for a blob
 */
export async function openWalrusScan(blobId: string) {
  const blob = await blobTrackingService.getBlobMetadata(blobId);
  
  if (!blob) {
    console.error(`❌ Blob ${blobId} not found`);
    return;
  }
  
  console.log(`🔍 Opening Walrus Scan for: ${blob.fileName}`);
  window.open(blob.walrusScanUrl, '_blank');
}

/**
 * Open aggregator download URL for a blob
 */
export async function openAggregator(blobId: string) {
  const blob = await blobTrackingService.getBlobMetadata(blobId);
  
  if (!blob) {
    console.error(`❌ Blob ${blobId} not found`);
    return;
  }
  
  console.log(`🔗 Opening aggregator for: ${blob.fileName}`);
  window.open(blob.aggregatorUrl, '_blank');
}

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Export to window for console access
if (typeof window !== 'undefined') {
  (window as any).walrusDebug = {
    listAllBlobs,
    getLatestBlob,
    openWalrusScan,
    openAggregator
  };
  
  console.log('💡 Walrus debug utilities loaded! Try:');
  console.log('   walrusDebug.listAllBlobs()');
  console.log('   walrusDebug.getLatestBlob()');
  console.log('   walrusDebug.openWalrusScan(blobId)');
  console.log('   walrusDebug.openAggregator(blobId)');
}
