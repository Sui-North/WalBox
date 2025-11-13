/**
 * Slush Wallet Helper
 * Provides utility functions for detecting and working with Slush Wallet
 * Slush uses a different injection method than other Sui wallets
 */

/**
 * Detect Slush Wallet using multiple methods
 * Slush wallet may inject at different global variables
 */
export async function detectSlushWallet() {
  console.log('[SlushHelper] Attempting to detect Slush Wallet...');
  
  // Try multiple detection methods
  const detectionMethods = [
    { name: 'window.slush', fn: () => (window as any).slush },
    { name: 'window.__SLUSH__', fn: () => (window as any).__SLUSH__ },
    { name: 'window.slushWallet', fn: () => (window as any).slushWallet },
    { name: 'window.suiWallet (Slush)', fn: () => (window as any).suiWallet },
  ];

  for (const method of detectionMethods) {
    try {
      const wallet = method.fn();
      if (wallet && wallet.connect) {
        console.log(`[SlushHelper] ✓ Found Slush Wallet at: ${method.name}`);
        return wallet;
      }
    } catch (e) {
      console.log(`[SlushHelper] ${method.name} not available`);
      // Continue to next method
    }
  }

  console.warn('[SlushHelper] ✗ Slush Wallet not found');
  return null;
}

/**
 * Ensure Slush Wallet is ready
 * Waits up to 3 seconds for Slush to inject
 */
export async function ensureSlushReady() {
  console.log('[SlushHelper] Waiting for Slush Wallet to be ready...');
  
  // Wait for wallet to be ready (up to 3 seconds, check every 100ms)
  for (let i = 0; i < 30; i++) {
    const wallet = await detectSlushWallet();
    if (wallet) {
      console.log('[SlushHelper] ✓ Slush Wallet is ready');
      return wallet;
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.error('[SlushHelper] ✗ Slush Wallet not ready after 3 seconds');
  throw new Error('Slush Wallet not ready. Please ensure it is installed and enabled.');
}

/**
 * Get all detected Sui wallets
 * Returns an object with information about each detected wallet
 */
export function getAllDetectedWallets() {
  const wallets: Record<string, { detected: boolean; type: string }> = {
    slush: { detected: !!( window as any).slush, type: 'Slush Wallet' },
    suiWallet: { detected: !!(window as any).suiWallet, type: 'Sui Wallet' },
    nautilus: { detected: !!(window as any).nautilus, type: 'Nautilus' },
    suiet: { detected: !!(window as any).suiet, type: 'Suiet' },
    okx: { detected: !!(window as any).okxwallet, type: 'OKX Wallet' },
  };
  
  const detected = Object.entries(wallets)
    .filter(([_, info]) => info.detected)
    .map(([key, info]) => info.type);
  
  return { wallets, detected };
}

/**
 * Log detailed wallet detection info for debugging
 */
export function logWalletDebugInfo() {
  console.group('[SlushHelper] Wallet Detection Debug Info');
  
  const { detected } = getAllDetectedWallets();
  
  console.log('Detected Wallets:', detected.length > 0 ? detected : 'None');
  console.log('Window keys containing wallet/slush:', 
    Object.keys(window).filter(k => 
      k.toLowerCase().includes('wallet') || 
      k.toLowerCase().includes('slush')
    )
  );
  console.log('Slush specific checks:');
  console.log('  - window.slush:', (window as any).slush ? '✓ Found' : '✗ Not found');
  console.log('  - window.__SLUSH__:', (window as any).__SLUSH__ ? '✓ Found' : '✗ Not found');
  console.log('  - window.suiWallet:', (window as any).suiWallet ? '✓ Found' : '✗ Not found');
  
  console.groupEnd();
}
