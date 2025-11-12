// Wallet Service - Standard Sui wallet interface
// Supports all Sui-compatible wallets including Slush, Nautilus, Sui Wallet, Suiet, etc.

import { Transaction } from '@mysten/sui/transactions';

// Wallet state interface
export interface WalletState {
  connected: boolean;
  address: string | null;
  chain?: string;
  walletName?: string;
}

// Global wallet state (for use outside React components)
let globalWalletState: WalletState = {
  connected: false,
  address: null,
  chain: 'sui',
  walletName: null,
};

// Current wallet instance
let currentWallet: any = null;
let currentWalletName: string | null = null;

// Listeners for wallet state changes
const stateListeners: Set<(state: WalletState) => void> = new Set();

// Update global wallet state and notify listeners
function updateWalletState(state: WalletState) {
  globalWalletState = { ...state };
  stateListeners.forEach(listener => listener(globalWalletState));
  
  // Persist to localStorage
  if (state.connected && state.address) {
    localStorage.setItem('wallet_connected', 'true');
    localStorage.setItem('wallet_address', state.address);
    if (state.walletName) {
      localStorage.setItem('wallet_name', state.walletName);
    }
  } else {
    localStorage.removeItem('wallet_connected');
    localStorage.removeItem('wallet_address');
    localStorage.removeItem('wallet_name');
  }
}

// Detect all available Sui wallets
function detectWallets(): Array<{ name: string; wallet: any }> {
  if (typeof window === 'undefined') return [];
  
  const wallets: Array<{ name: string; wallet: any }> = [];
  const win = window as any;
  
  // Debug: Log what's available
  console.log('[Wallet Detection] Checking for wallets...');
  console.log('[Wallet Detection] window.slushWallet:', !!win.slushWallet);
  console.log('[Wallet Detection] window.suiWallet:', !!win.suiWallet);
  console.log('[Wallet Detection] window.nautilus:', !!win.nautilus);
  console.log('[Wallet Detection] window.suiet:', !!win.suiet);
  console.log('[Wallet Detection] window.wallet:', !!win.wallet);
  
  // Check for Slush wallet (priority - user requested)
  if (win.slushWallet) {
    console.log('[Wallet Detection] Found Slush wallet');
    wallets.push({ name: 'Slush', wallet: win.slushWallet });
  }
  
  // Check for standard Sui wallet interface (Sui Wallet Standard)
  if (win.suiWallet) {
    console.log('[Wallet Detection] Found Sui Wallet');
    wallets.push({ name: 'Sui Wallet', wallet: win.suiWallet });
  }
  
  // Check for Nautilus
  if (win.nautilus) {
    console.log('[Wallet Detection] Found Nautilus');
    wallets.push({ name: 'Nautilus', wallet: win.nautilus });
  }
  
  // Check for Suiet
  if (win.suiet) {
    console.log('[Wallet Detection] Found Suiet');
    wallets.push({ name: 'Suiet', wallet: win.suiet });
  }
  
  // Check for Sui Wallet (alternative name)
  if (win['sui-wallet']) {
    console.log('[Wallet Detection] Found Sui Wallet (alt)');
    wallets.push({ name: 'Sui Wallet', wallet: win['sui-wallet'] });
  }
  
  // Check for Wallet Standard interface
  if (win.wallet && win.wallet.standard === 'sui') {
    console.log('[Wallet Detection] Found Wallet Standard');
    wallets.push({ name: 'Wallet Standard', wallet: win.wallet });
  }
  
  // Check for any wallet with getAccounts method (generic detection)
  if (win.wallet && typeof win.wallet.getAccounts === 'function') {
    const existing = wallets.find(w => w.wallet === win.wallet);
    if (!existing) {
      console.log('[Wallet Detection] Found Generic Sui Wallet');
      wallets.push({ name: 'Generic Sui Wallet', wallet: win.wallet });
    }
  }
  
  console.log(`[Wallet Detection] Found ${wallets.length} wallet(s):`, wallets.map(w => w.name));
  
  return wallets;
}

// Get the first available wallet or a specific wallet by name
function getWallet(walletName?: string): { wallet: any; name: string } | null {
  const wallets = detectWallets();
  
  if (wallets.length === 0) {
    console.log('[Wallet Detection] No wallets found');
    return null;
  }
  
  // If a specific wallet name is requested, try to find it
  if (walletName) {
    const found = wallets.find(w => w.name.toLowerCase() === walletName.toLowerCase());
    if (found) {
      console.log(`[Wallet Detection] Selected wallet: ${found.name}`);
      return found;
    }
    console.log(`[Wallet Detection] Requested wallet "${walletName}" not found, using first available`);
  }
  
  // Return the first available wallet
  console.log(`[Wallet Detection] Using wallet: ${wallets[0].name}`);
  return wallets[0];
}

export const walletService = {
  /**
   * Get list of available wallets
   * @returns Array of wallet names
   */
  getAvailableWallets: (): string[] => {
    return detectWallets().map(w => w.name);
  },

  /**
   * Connect to wallet (works with any Sui-compatible wallet)
   * @param walletName - Optional: specific wallet name to connect to
   * @returns Connected wallet address
   */
  connect: async (walletName?: string): Promise<string> => {
    try {
      console.log('[Wallet Connect] Starting connection...', walletName ? `(requested: ${walletName})` : '');
      
      const walletInfo = getWallet(walletName);
      
      if (!walletInfo) {
        const availableWallets = detectWallets().map(w => w.name);
        if (availableWallets.length > 0) {
          throw new Error(
            `No Sui wallet found. Available wallets: ${availableWallets.join(', ')}. Please install a Sui wallet extension.`
          );
        }
        throw new Error(
          'No Sui wallet found. Please install a Sui wallet extension like Slush, Nautilus, Sui Wallet, or Suiet.'
        );
      }

      currentWallet = walletInfo.wallet;
      currentWalletName = walletInfo.name;

      console.log(`[Wallet Connect] Attempting to connect to ${currentWalletName}...`);
      console.log('[Wallet Connect] Wallet object:', currentWallet);

      // Try different connection methods based on wallet type
      let accounts: any[] = [];
      let address: string | null = null;

      // Method 1: Standard Sui wallet interface - getAccounts (check if already connected)
      if (currentWallet.getAccounts && typeof currentWallet.getAccounts === 'function') {
        try {
          console.log('[Wallet Connect] Trying getAccounts()...');
          accounts = await currentWallet.getAccounts();
          console.log('[Wallet Connect] getAccounts result:', accounts);
          if (accounts && accounts.length > 0) {
            address = accounts[0].address;
            console.log('[Wallet Connect] Got address from getAccounts:', address);
          }
        } catch (e) {
          console.log('[Wallet Connect] getAccounts failed:', e);
        }
      }

      // Method 2: Request permissions (for wallets that require explicit permission)
      if (!address && currentWallet.requestPermissions && typeof currentWallet.requestPermissions === 'function') {
        try {
          console.log('[Wallet Connect] Trying requestPermissions()...');
          const result = await currentWallet.requestPermissions({
            permissions: ['viewAccount', 'suggestTransactions'],
          });
          console.log('[Wallet Connect] requestPermissions result:', result);
          
          if (result && result.accounts && result.accounts.length > 0) {
            address = result.accounts[0].address;
            console.log('[Wallet Connect] Got address from requestPermissions:', address);
          } else if (result && Array.isArray(result) && result.length > 0) {
            address = result[0].accounts?.[0]?.address || result[0]?.address;
            console.log('[Wallet Connect] Got address from requestPermissions (array):', address);
          } else if (result && typeof result === 'object') {
            // Some wallets return the address directly in the result
            address = result.address || result.account?.address;
            console.log('[Wallet Connect] Got address from requestPermissions (object):', address);
          }
        } catch (permError: any) {
          console.log('[Wallet Connect] requestPermissions failed:', permError);
          // Some wallets don't use requestPermissions, continue to next method
        }
      }

      // Method 3: Direct connection (for wallets like Slush)
      if (!address && currentWallet.connect && typeof currentWallet.connect === 'function') {
        try {
          console.log('[Wallet Connect] Trying connect()...');
          const result = await currentWallet.connect();
          console.log('[Wallet Connect] connect() result:', result);
          
          if (result && result.accounts && result.accounts.length > 0) {
            address = result.accounts[0].address;
            console.log('[Wallet Connect] Got address from connect (accounts):', address);
          } else if (typeof result === 'string') {
            address = result;
            console.log('[Wallet Connect] Got address from connect (string):', address);
          } else if (result && result.address) {
            address = result.address;
            console.log('[Wallet Connect] Got address from connect (address):', address);
          }
        } catch (connectError: any) {
          console.log('[Wallet Connect] connect() failed:', connectError);
        }
      }

      // Method 4: Check if already connected (retry getAccounts after potential connection)
      if (!address && currentWallet.getAccounts && typeof currentWallet.getAccounts === 'function') {
        try {
          console.log('[Wallet Connect] Retrying getAccounts()...');
          accounts = await currentWallet.getAccounts();
          console.log('[Wallet Connect] getAccounts retry result:', accounts);
          if (accounts && accounts.length > 0) {
            address = accounts[0].address;
            console.log('[Wallet Connect] Got address from getAccounts retry:', address);
          }
        } catch (e) {
          console.log('[Wallet Connect] getAccounts retry failed:', e);
        }
      }
      
      if (!address) {
        const errorMsg = `Could not get wallet address from ${currentWalletName}. Please ensure the wallet is unlocked and try again.`;
        console.error('[Wallet Connect] Connection failed:', errorMsg);
        console.error('[Wallet Connect] Wallet methods available:', {
          getAccounts: typeof currentWallet.getAccounts,
          requestPermissions: typeof currentWallet.requestPermissions,
          connect: typeof currentWallet.connect,
          hasOn: typeof currentWallet.on,
        });
        throw new Error(errorMsg);
      }

      console.log('[Wallet Connect] Successfully connected! Address:', address);

      updateWalletState({
        connected: true,
        address,
        chain: 'sui',
        walletName: currentWalletName,
      });
      
      return address;
    } catch (error: any) {
      console.error('[Wallet Connect] Connection error:', error);
      currentWallet = null;
      currentWalletName = null;
      throw error;
    }
  },

  /**
   * Disconnect from wallet
   */
  disconnect: async (): Promise<void> => {
    try {
      if (currentWallet && currentWallet.disconnect) {
        await currentWallet.disconnect();
      }
    } catch (error) {
      console.error('Wallet disconnection error:', error);
    } finally {
      currentWallet = null;
      currentWalletName = null;
      updateWalletState({
        connected: false,
        address: null,
        chain: 'sui',
        walletName: null,
      });
    }
  },

  /**
   * Get current wallet state
   * @returns WalletState object
   */
  getState: (): WalletState => {
    // Try to get from localStorage first
    const stored = localStorage.getItem('wallet_connected');
    const storedAddress = localStorage.getItem('wallet_address');
    const storedWalletName = localStorage.getItem('wallet_name');
    
    if (stored === 'true' && storedAddress) {
      return {
        connected: true,
        address: storedAddress,
        chain: 'sui',
        walletName: storedWalletName || undefined,
      };
    }
    
    return globalWalletState;
  },

  /**
   * Get connected address (async, checks actual wallet state)
   * @returns Current address or null
   */
  getAddress: async (): Promise<string | null> => {
    try {
      if (!currentWallet) {
        const walletInfo = getWallet();
        if (!walletInfo) return null;
        currentWallet = walletInfo.wallet;
        currentWalletName = walletInfo.name;
      }

      if (!currentWallet.getAccounts) return null;

      const accounts = await currentWallet.getAccounts();
      const address = accounts && accounts.length > 0 ? accounts[0].address : null;
      
      if (address) {
        updateWalletState({
          connected: true,
          address,
          chain: 'sui',
          walletName: currentWalletName || undefined,
        });
      }
      
      return address;
    } catch (error) {
      console.error('Error getting wallet address:', error);
      return null;
    }
  },

  /**
   * Sign and execute a transaction block
   * @param transactionBlock - Sui transaction block
   * @param options - Transaction options
   * @returns Transaction digest
   */
  signAndExecuteTransactionBlock: async (
    transactionBlock: Transaction,
    options?: any
  ): Promise<string> => {
    try {
      if (!currentWallet) {
        throw new Error('Wallet is not connected');
      }

      // Get the current account
      let accounts: any[] = [];
      if (currentWallet.getAccounts) {
        accounts = await currentWallet.getAccounts();
      }
      
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts available');
      }

      // Use wallet's signAndExecuteTransactionBlock method
      // Different wallets may have slightly different APIs
      let result: any;
      
      if (currentWallet.signAndExecuteTransactionBlock) {
        // Standard interface
        result = await currentWallet.signAndExecuteTransactionBlock({
          transaction: transactionBlock,
          account: accounts[0],
          options: options || {
            showEffects: true,
            showEvents: true,
          },
        });
      } else if (currentWallet.signAndExecuteTransaction) {
        // Alternative method name
        result = await currentWallet.signAndExecuteTransaction({
          transaction: transactionBlock,
          account: accounts[0],
          options: options || {
            showEffects: true,
            showEvents: true,
          },
        });
      } else {
        throw new Error('Wallet does not support transaction signing');
      }

      return result.digest || result.transactionDigest || result.hash;
    } catch (error) {
      console.error('Transaction signing error:', error);
      throw error;
    }
  },

  /**
   * Get transaction signer function for use with files service
   * @returns Signer function compatible with filesService
   */
  getSigner: () => {
    return async (tx: Transaction, options?: any): Promise<string> => {
      return walletService.signAndExecuteTransactionBlock(tx, options);
    };
  },

  /**
   * Sign a message (for authentication or verification)
   * @param message - Message to sign
   * @returns Signature
   */
  signMessage: async (message: string | Uint8Array): Promise<string> => {
    try {
      if (!currentWallet) {
        throw new Error('Wallet is not connected');
      }

      const messageBytes = typeof message === 'string' 
        ? new TextEncoder().encode(message) 
        : message;

      let result: any;
      
      if (currentWallet.signMessage) {
        result = await currentWallet.signMessage({
          message: messageBytes,
        });
      } else if (currentWallet.signPersonalMessage) {
        result = await currentWallet.signPersonalMessage({
          message: messageBytes,
        });
      } else {
        throw new Error('Wallet does not support message signing');
      }

      return result.signature || result.signatureBytes || result;
    } catch (error) {
      console.error('Message signing error:', error);
      throw error;
    }
  },

  /**
   * Check if wallet is installed
   * @param walletName - Optional: specific wallet name to check
   * @returns true if a Sui wallet is installed
   */
  isInstalled: (walletName?: string): boolean => {
    return getWallet(walletName) !== null;
  },

  /**
   * Check if wallet is connected
   * @returns true if wallet is connected
   */
  isConnected: (): boolean => {
    const state = walletService.getState();
    return state.connected && state.address !== null;
  },

  /**
   * Get current wallet name
   * @returns Wallet name or null
   */
  getWalletName: (): string | null => {
    return currentWalletName || globalWalletState.walletName || null;
  },

  /**
   * Format address for display (truncated)
   * @param address - Full Sui address
   * @returns Formatted address string
   */
  formatAddress: (address: string): string => {
    if (!address || address.length <= 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  },

  /**
   * Listen for wallet connection/disconnection events
   * @param callback - Callback function for state changes
   * @returns Unsubscribe function
   */
  onStateChange: (callback: (state: WalletState) => void): (() => void) => {
    stateListeners.add(callback);
    
    // Call immediately with current state
    callback(walletService.getState());
    
    // Return unsubscribe function
    return () => {
      stateListeners.delete(callback);
    };
  },
};

// Initialize from localStorage on load
if (typeof window !== 'undefined') {
  const stored = localStorage.getItem('wallet_connected');
  const storedAddress = localStorage.getItem('wallet_address');
  const storedWalletName = localStorage.getItem('wallet_name');
  
  if (stored === 'true' && storedAddress) {
    globalWalletState = {
      connected: true,
      address: storedAddress,
      chain: 'sui',
      walletName: storedWalletName || undefined,
    };
    
    // Try to reconnect to the wallet
    const walletInfo = getWallet(storedWalletName || undefined);
    if (walletInfo) {
      currentWallet = walletInfo.wallet;
      currentWalletName = walletInfo.name;
    }
  }
  
  // Listen for wallet events
  window.addEventListener('sui:wallet:change', () => {
    walletService.getAddress().then(address => {
      if (!address) {
        walletService.disconnect();
      }
    });
  });
}
