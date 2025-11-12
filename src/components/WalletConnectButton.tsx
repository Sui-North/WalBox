import { useCurrentAccount, useDisconnectWallet, ConnectButton } from '@mysten/dapp-kit';
import { Button } from '@/components/ui/button';
import { Wallet, LogOut, ChevronDown, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { logWalletDebugInfo, getAllDetectedWallets } from '@/services/slushHelper';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Alert,
  AlertDescription,
} from '@/components/ui/alert';

/**
 * WalletConnectButton component using @mysten/dapp-kit
 * Enhanced with Slush Wallet detection debugging
 */
export const WalletConnectButton = () => {
  const account = useCurrentAccount();
  const { mutate: disconnect } = useDisconnectWallet();
  const [walletsDetected, setWalletsDetected] = useState<string[]>([]);
  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    // Check for wallets on component mount
    const checkWallets = () => {
      console.log('[WalletConnectButton] Checking for wallets...');
      const { detected } = getAllDetectedWallets();
      setWalletsDetected(detected);
      
      if (detected.length === 0) {
        console.warn('[WalletConnectButton] ⚠️ No wallets detected!');
        logWalletDebugInfo();
      } else {
        console.log('[WalletConnectButton] ✓ Wallets found:', detected);
      }
    };

    // Check immediately
    checkWallets();
    
    // Check again after delays (wallet extensions may inject after page load)
    const timer1 = setTimeout(checkWallets, 500);
    const timer2 = setTimeout(checkWallets, 1500);
    const timer3 = setTimeout(checkWallets, 3000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  const formatAddress = (addr: string) => {
    if (!addr || addr.length <= 10) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const handleDisconnect = () => {
    disconnect();
    toast({
      title: "Wallet Disconnected",
    });
  };

  // If connected, show connected address with disconnect option
  if (account?.address) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            className="gap-2 glass-effect border-primary/30 hover:border-primary/60 hover:shadow-glow-sm transition-all duration-300"
          >
            <Wallet className="h-4 w-4" />
            <span className="font-medium">
              {formatAddress(account.address)}
            </span>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="glass-effect border-primary/20">
          <DropdownMenuItem 
            onClick={handleDisconnect} 
            className="cursor-pointer gap-2 text-red-500 hover:text-red-600"
          >
            <LogOut className="h-4 w-4" />
            Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Not connected - show warning if no wallets detected
  return (
    <div className="flex flex-col items-end gap-2">
      {walletsDetected.length === 0 && (
        <Alert className="bg-yellow-50 border-yellow-200 mb-2 max-w-xs">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800 text-xs">
            No wallet detected. Install Slush, Sui Wallet, or Nautilus.
            <button 
              onClick={() => setShowDebug(!showDebug)}
              className="block mt-1 text-yellow-700 underline hover:text-yellow-900 text-xs"
            >
              {showDebug ? 'Hide' : 'Show'} debug info
            </button>
          </AlertDescription>
        </Alert>
      )}
      
      {showDebug && (
        <div className="text-xs bg-gray-100 p-2 rounded max-w-xs mb-2 max-h-40 overflow-auto border border-gray-300">
          <p className="font-bold mb-1">Detected Wallets:</p>
          <p>{walletsDetected.length > 0 ? walletsDetected.join(', ') : 'None'}</p>
          <button 
            onClick={() => {
              logWalletDebugInfo();
              console.log('Debug info logged to console - open DevTools (F12) to see');
              toast({
                title: "Debug Info Logged",
                description: "Check browser console (F12) for details",
              });
            }}
            className="mt-2 text-blue-600 hover:text-blue-800 underline"
          >
            Log to Console
          </button>
        </div>
      )}

      <div className="[&>button]:bg-gradient-primary [&>button]:hover:shadow-glow [&>button]:transition-all [&>button]:duration-300 [&>button]:hover:scale-105 [&>button]:font-medium [&>button]:px-4 [&>button]:py-2 [&>button]:rounded-md [&>button]:gap-2 [&>button]:flex [&>button]:items-center">
        <ConnectButton />
      </div>
    </div>
  );
};
