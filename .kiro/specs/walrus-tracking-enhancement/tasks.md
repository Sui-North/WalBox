# Implementation Plan

## Overview

This implementation plan breaks down the Walrus tracking enhancement into discrete, manageable coding tasks. Each task builds incrementally and focuses on implementing specific features from the design document. The plan prioritizes core tracking functionality first, then adds analytics, content-specific features, and advanced capabilities.

## Task List

- [ ] 1. Core Blob Tracking Infrastructure
  - [x] 1.1 Create BlobMetadata TypeScript interfaces
    - Define BlobMetadata, WalrusUploadResponse, ImageMetadata, VideoMetadata, AudioMetadata interfaces
    - Create ContentTypeCategory type
    - Add VerificationResult and VerificationReport interfaces
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [x] 1.2 Implement IndexedDB tracking database
    - Create database schema with 'blobs' and 'analytics_cache' stores
    - Add indexes for blobId, fileId, contentType, uploadedAt, status, contentHash, expiresAt
    - Implement database initialization and migration logic
    - Add error handling for IndexedDB unavailability
    - _Requirements: 1.1, 1.2, 1.3_

  - [x] 1.3 Build BlobTrackingService
    - Implement trackBlob() to store metadata in IndexedDB
    - Implement getBlobMetadata() to retrieve by blob ID
    - Implement getAllBlobs() to fetch all tracked blobs
    - Implement updateBlobMetadata() for partial updates
    - Implement deleteBlobMetadata() to remove tracking data
    - Add query methods: getBlobsByContentType(), getBlobsByStatus(), getBlobsByDateRange()
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [x] 1.4 Integrate tracking with existing StorageService
    - Modify uploadToWalrus() to capture Walrus response details
    - Extract blob ID, storage cost, encoded size, transaction digest from response
    - Call BlobTrackingService.trackBlob() after successful upload
    - Store aggregator URL and Walrus Scan URL
    - Handle both newlyCreated and alreadyCertified responses
    - _Requirements: 1.1, 1.2, 1.3, 1.5, 5.1, 5.2, 5.3_

  - [ ]* 1.5 Write unit tests for tracking service
    - Test CRUD operations on blob metadata
    - Test IndexedDB indexes and queries
    - Test error handling and fallback to localStorage
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ] 2. Content Type Detection and Categorization
  - [x] 2.1 Implement content type categorization
    - Create categorizeContentType() function to map MIME types to categories
    - Support image, video, audio, document, archive, other categories
    - Handle edge cases and unknown MIME types
    - _Requirements: 2.1, 2.2_

  - [x] 2.2 Build ImageProcessor for image metadata extraction
    - Implement extractMetadata() to get image dimensions
    - Detect image format (JPEG, PNG, GIF, WebP, etc.)
    - Check for alpha channel presence
    - Extract EXIF data (camera, date taken, GPS location, orientation)
    - Handle errors gracefully for corrupted images
    - _Requirements: 2.4, 11.1, 11.2, 11.5_

  - [x] 2.3 Build VideoProcessor for video metadata extraction
    - Implement extractMetadata() to get video duration
    - Extract video dimensions and calculate resolution (720p, 1080p, 4K)
    - Detect video codec (approximate from container)
    - Calculate bitrate from file size and duration
    - Handle errors gracefully for corrupted videos
    - _Requirements: 2.5, 12.1, 12.2, 12.3, 12.5_

  - [x] 2.4 Integrate content processors with upload flow
    - Call ImageProcessor for image uploads
    - Call VideoProcessor for video uploads
    - Store extracted metadata in BlobMetadata
    - Show metadata extraction progress in UI
    - _Requirements: 2.1, 2.4, 2.5_

  - [ ]* 2.5 Write tests for content processors
    - Test image metadata extraction with various formats
    - Test video metadata extraction
    - Test error handling for corrupted files
    - _Requirements: 2.4, 2.5, 11.1, 11.2, 12.1, 12.2_

- [ ] 3. Storage Cost Tracking and Analytics
  - [ ] 3.1 Enhance cost tracking in upload flow
    - Parse storage cost from Walrus response
    - Store cost in SUI tokens with blob metadata
    - Track storage epochs and calculate expiration date
    - Store upload epoch and expiration epoch
    - _Requirements: 3.1, 3.4, 4.1, 4.4_

  - [ ] 3.2 Build WalrusAnalyticsService
    - Implement generateAnalytics() to aggregate all metrics
    - Implement calculateSummary() for total blobs, storage, costs
    - Implement groupByContentType() for content distribution
    - Implement groupBySizeRange() for size distribution
    - Implement calculateUploadTrend() for timeline data
    - Implement getTopFiles() for largest files ranking
    - Implement projectCosts() for cost projections
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 6.1, 6.2, 6.3, 6.4, 6.5_

  - [ ] 3.3 Implement analytics caching
    - Cache analytics results in IndexedDB with TTL
    - Set 5-minute cache expiration
    - Invalidate cache on new uploads or deletions
    - _Requirements: 6.1, 6.2_

  - [ ]* 3.4 Write tests for analytics service
    - Test summary calculations
    - Test grouping by content type and size
    - Test cost projections
    - Test caching behavior
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 6.1, 6.2, 6.3_

- [ ] 4. Blob Lifecycle Management
  - [ ] 4.1 Implement blob status tracking
    - Add status field to BlobMetadata ('active', 'expiring', 'expired')
    - Calculate status based on expiration date
    - Update status when querying blobs
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [ ] 4.2 Build expiration warning system
    - Check for blobs expiring within 7 days
    - Check for blobs expiring within 1 day
    - Create notification system for expiration warnings
    - Display warnings in Dashboard and file details
    - _Requirements: 4.2, 4.4_

  - [ ] 4.3 Add expiration indicators to UI
    - Show "Expiring Soon" badge for blobs within 7 days
    - Show "Expires Tomorrow" badge for blobs within 1 day
    - Show "Expired" badge for expired blobs
    - Display remaining time in file details
    - _Requirements: 4.2, 4.3, 4.4_

  - [ ]* 4.4 Write tests for lifecycle management
    - Test status calculation
    - Test expiration detection
    - Test warning generation
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ] 5. Walrus Analytics Dashboard
  - [ ] 5.1 Create WalrusAnalyticsDashboard component
    - Build dashboard layout with summary cards
    - Display total blobs, storage used, total cost
    - Show active, expiring, and expired blob counts
    - Add refresh button to regenerate analytics
    - _Requirements: 6.1, 6.2_

  - [ ] 5.2 Add content type distribution chart
    - Use Recharts PieChart for content type breakdown
    - Show percentage and absolute values
    - Add color coding for each content type
    - Make chart interactive with tooltips
    - _Requirements: 6.3_

  - [ ] 5.3 Add upload trend timeline chart
    - Use Recharts LineChart for upload activity over time
    - Show daily/weekly/monthly aggregation options
    - Display upload count and storage added
    - _Requirements: 6.5_

  - [ ] 5.4 Add top files list
    - Display ranked list of largest files
    - Show file name, size, and percentage of total storage
    - Add links to file details
    - _Requirements: 6.4_

  - [ ] 5.5 Add cost projection cards
    - Display current monthly cost estimate
    - Show projected monthly cost with growth
    - Display average cost per blob and per GB
    - _Requirements: 3.4, 3.5, 6.1_

  - [ ]* 5.6 Write tests for dashboard components
    - Test chart rendering with mock data
    - Test summary calculations display
    - Test interactive elements
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 6. Blob Details and Walrus Integration
  - [ ] 6.1 Create BlobDetailsPanel component
    - Display comprehensive blob metadata
    - Show blob ID, file name, sizes (original, encrypted, encoded)
    - Display content type and MIME type
    - Show upload date and expiration date
    - Display storage cost and epochs
    - _Requirements: 1.4, 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ] 6.2 Add Walrus network links
    - Add "View on Walrus Scan" button with external link icon
    - Add "View on Aggregator" button
    - Open links in new tab
    - Display URLs as copyable text
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ] 6.3 Add content-specific metadata display
    - Show image dimensions and format for images
    - Show video duration and resolution for videos
    - Display EXIF data for images if available
    - Show codec information for videos
    - _Requirements: 2.4, 2.5, 11.1, 11.2, 11.5, 12.1, 12.2, 12.3, 12.5_

  - [ ] 6.4 Integrate blob details into existing FileView
    - Add "Walrus Details" section to file details modal
    - Display BlobDetailsPanel component
    - Show verification status and last verified date
    - _Requirements: 15.2, 15.3_

  - [ ]* 6.5 Write tests for blob details components
    - Test metadata display
    - Test link generation
    - Test content-specific sections
    - _Requirements: 1.4, 5.1, 5.2, 5.3, 11.1, 12.1_

- [ ] 7. Blob Verification System
  - [ ] 7.1 Build BlobVerificationService
    - Implement verifyBlob() using HEAD request to aggregator
    - Measure response time
    - Update verification status in metadata
    - Handle verification failures gracefully
    - _Requirements: 7.1, 7.2, 7.3_

  - [ ] 7.2 Implement batch verification
    - Implement verifyAllBlobs() with progress tracking
    - Add rate limiting (100ms between requests)
    - Generate VerificationReport with results
    - Allow cancellation of batch verification
    - _Requirements: 7.1, 7.2, 9.1, 9.2_

  - [ ] 7.3 Add verification UI components
    - Add "Verify" button to blob details
    - Show verification status indicator (verified/failed/pending)
    - Display last verified timestamp
    - Show response time for successful verifications
    - _Requirements: 7.1, 7.2, 7.3_

  - [ ] 7.4 Implement automatic health checks
    - Add option to enable periodic verification
    - Schedule daily or weekly health checks
    - Store health check results
    - Notify user of failures
    - _Requirements: 7.4, 7.5_

  - [ ]* 7.5 Write tests for verification service
    - Test single blob verification
    - Test batch verification
    - Test rate limiting
    - Test error handling
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [ ] 8. Duplicate Detection System
  - [ ] 8.1 Build ContentHashService
    - Implement calculateHash() using Web Crypto API SHA-256
    - Handle large files efficiently with streaming
    - Cache hashes for uploaded files
    - _Requirements: 8.1, 8.2_

  - [ ] 8.2 Integrate duplicate detection with upload
    - Calculate content hash before upload
    - Query IndexedDB for existing blobs with same hash
    - Show duplicate detection modal if found
    - Offer options: upload new, reuse existing, view duplicates
    - _Requirements: 8.1, 8.2, 8.3, 8.5_

  - [ ] 8.3 Implement blob reuse functionality
    - Allow creating new FileObject with existing blob ID
    - Increment reuseCount on existing blob metadata
    - Skip Walrus upload when reusing
    - Update UI to show reuse savings
    - _Requirements: 8.3, 8.4_

  - [ ] 8.4 Create duplicate files viewer
    - Show all files sharing the same blob ID
    - Display reuse count in analytics
    - Calculate storage savings from deduplication
    - _Requirements: 8.4, 8.5_

  - [ ]* 8.5 Write tests for duplicate detection
    - Test hash calculation
    - Test duplicate finding
    - Test reuse logic
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [ ] 9. Advanced Search and Filtering
  - [ ] 9.1 Implement blob search functionality
    - Add search by filename, blob ID, content type
    - Support date range filtering
    - Implement fuzzy matching for filenames
    - Highlight matching terms in results
    - _Requirements: 10.1, 10.5_

  - [ ] 9.2 Add size range filters
    - Create filter options: < 1MB, 1-10MB, 10-100MB, > 100MB
    - Allow multiple size range selection
    - Update results in real-time
    - _Requirements: 10.2_

  - [ ] 9.3 Add status filters
    - Filter by active, expiring soon, expired
    - Show count for each status category
    - Allow combining with other filters
    - _Requirements: 10.3_

  - [ ] 9.4 Add cost range filters
    - Filter by storage cost ranges
    - Show cost distribution histogram
    - _Requirements: 10.4_

  - [ ] 9.5 Create SearchAndFilterPanel component
    - Build comprehensive filter UI
    - Show active filters with clear buttons
    - Display result count
    - Add "Clear All Filters" button
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

  - [ ]* 9.6 Write tests for search and filtering
    - Test search functionality
    - Test filter combinations
    - Test result accuracy
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [ ] 10. Storage Optimization Recommendations
  - [ ] 10.1 Build StorageOptimizationService
    - Implement analyzeStorage() to generate recommendations
    - Detect large uncompressed images
    - Find duplicate files
    - Identify expired blobs for cleanup
    - Detect expiring blobs needing extension
    - _Requirements: 13.1, 13.2, 13.3, 13.4_

  - [ ] 10.2 Create OptimizationRecommendations component
    - Display list of recommendations sorted by priority
    - Show potential savings for each recommendation
    - Add action buttons to apply recommendations
    - Show affected blob count
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

  - [ ] 10.3 Implement recommendation actions
    - Add "Apply" button for each recommendation
    - Show confirmation modal before applying
    - Display progress for batch operations
    - Update analytics after applying
    - _Requirements: 13.5_

  - [ ]* 10.4 Write tests for optimization service
    - Test recommendation generation
    - Test savings calculations
    - Test recommendation prioritization
    - _Requirements: 13.1, 13.2, 13.3, 13.4_

- [ ] 11. Content-Specific Features
  - [ ] 11.1 Create ImageGallery component
    - Display grid of image thumbnails
    - Load thumbnails from Walrus aggregator
    - Show image dimensions on hover
    - Support lightbox view for full-size images
    - _Requirements: 2.2, 11.4_

  - [ ] 11.2 Add image analytics section
    - Display total images count
    - Show total image storage
    - Calculate average image size
    - Show format distribution (JPEG, PNG, WebP, etc.)
    - _Requirements: 11.3_

  - [ ] 11.3 Create VideoGallery component
    - Display grid of video thumbnails
    - Show duration overlay on thumbnails
    - Display resolution badge (720p, 1080p, etc.)
    - Support video preview on click
    - _Requirements: 2.3, 12.4_

  - [ ] 11.4 Add video analytics section
    - Display total videos count
    - Show total video storage
    - Calculate total duration across all videos
    - Show resolution distribution
    - _Requirements: 12.4_

  - [ ]* 11.5 Write tests for content galleries
    - Test image gallery rendering
    - Test video gallery rendering
    - Test analytics calculations
    - _Requirements: 11.3, 11.4, 12.4_

- [ ] 12. Export and Reporting
  - [ ] 12.1 Build ReportGeneratorService
    - Implement generateCSV() for blob metadata export
    - Implement generateJSON() for structured export
    - Include all tracked fields in exports
    - Format data for readability
    - _Requirements: 14.1, 14.2, 14.3_

  - [ ] 12.2 Create export UI
    - Add "Export" button to analytics dashboard
    - Show export format options (CSV, JSON)
    - Allow selecting date range for export
    - Trigger download of generated file
    - _Requirements: 14.1, 14.3, 9.3_

  - [ ] 12.3 Implement comprehensive report generation
    - Include summary statistics in report
    - Add charts as data tables in CSV
    - Include cost analysis section
    - Add storage trends data
    - _Requirements: 14.2, 14.5_

  - [ ]* 12.4 Write tests for report generation
    - Test CSV format correctness
    - Test JSON structure
    - Test data completeness
    - _Requirements: 14.1, 14.2, 14.3_

- [ ] 13. Integration with Existing Features
  - [ ] 13.1 Update Dashboard with Walrus stats
    - Add Walrus storage summary card
    - Display total blobs and storage used
    - Show storage cost alongside file counts
    - Add link to Walrus analytics dashboard
    - _Requirements: 15.1, 15.4_

  - [ ] 13.2 Enhance file details modal
    - Add "Walrus" tab to file details
    - Display BlobDetailsPanel in tab
    - Show verification status
    - Add quick actions (verify, view on Walrus Scan)
    - _Requirements: 15.2, 15.3_

  - [ ] 13.3 Update share functionality
    - Include Walrus Scan link in share modal
    - Show blob verification status when sharing
    - Add option to verify before sharing
    - _Requirements: 15.3_

  - [ ] 13.4 Integrate with existing Analytics page
    - Add Walrus section to Analytics page
    - Display Walrus-specific charts
    - Show cost breakdown alongside usage stats
    - _Requirements: 15.4_

  - [ ] 13.5 Update file operations to maintain tracking
    - Update blob metadata on file deletion
    - Track download count on file access
    - Update last accessed timestamp
    - _Requirements: 15.5_

  - [ ]* 13.6 Write integration tests
    - Test Dashboard integration
    - Test file details integration
    - Test analytics integration
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

- [ ] 14. Error Handling and Edge Cases
  - [ ] 14.1 Implement TrackingErrorHandler
    - Handle IndexedDB unavailability
    - Fall back to localStorage for minimal tracking
    - Log errors for debugging
    - Show user-friendly error messages
    - _Requirements: 1.1, 1.2, 1.3_

  - [ ] 14.2 Add retry logic for failed operations
    - Retry failed verifications with exponential backoff
    - Retry failed metadata extraction
    - Allow manual retry from UI
    - _Requirements: 7.3, 7.4_

  - [ ] 14.3 Handle corrupted or missing data
    - Detect and handle corrupted IndexedDB data
    - Provide data recovery options
    - Allow re-syncing from Walrus responses
    - _Requirements: 1.3, 1.4_

  - [ ]* 14.4 Write tests for error handling
    - Test IndexedDB failure scenarios
    - Test retry logic
    - Test data recovery
    - _Requirements: 1.1, 1.2, 7.3_

- [ ] 15. Performance Optimization
  - [ ] 15.1 Implement lazy loading for blob lists
    - Load blob metadata in batches
    - Implement virtual scrolling for large lists
    - Show loading skeletons during fetch
    - _Requirements: 6.1, 6.2_

  - [ ] 15.2 Add Web Worker for heavy computations
    - Move hash calculation to Web Worker
    - Process metadata extraction in worker
    - Keep UI responsive during operations
    - _Requirements: 8.1, 2.4, 2.5_

  - [ ] 15.3 Optimize IndexedDB queries
    - Use indexes for common queries
    - Batch read operations
    - Cache frequently accessed data
    - _Requirements: 1.3, 10.1_

  - [ ]* 15.4 Write performance tests
    - Benchmark metadata storage speed
    - Test analytics generation with 1000+ blobs
    - Measure search/filter performance
    - _Requirements: 1.1, 6.1, 10.1_

- [ ] 16. Documentation and Polish
  - [ ] 16.1 Add inline documentation
    - Document all service methods with JSDoc
    - Add usage examples in comments
    - Document data structures
    - _Requirements: All_

  - [ ] 16.2 Create user guide
    - Document Walrus tracking features
    - Explain analytics dashboard
    - Provide troubleshooting tips
    - _Requirements: All_

  - [ ] 16.3 Add tooltips and help text
    - Add tooltips to all Walrus-specific UI elements
    - Explain technical terms (blob ID, epochs, encoded size)
    - Provide context for metrics
    - _Requirements: 1.4, 5.1, 5.2, 6.1_

  - [ ] 16.4 Final UI polish
    - Ensure consistent styling across components
    - Add loading states for all async operations
    - Implement smooth transitions
    - Test responsive design
    - _Requirements: All_
