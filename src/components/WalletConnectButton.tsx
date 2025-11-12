import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Wallet, ChevronDown } from 'lucide-react';
import { walletService } from '@/services/wallet';
import { toast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export const WalletConnectButton = () => {
  const [walletState, setWalletState] = useState(walletService.getState());
  const [isConnecting, setIsConnecting] = useState(false);
  const [availableWallets, setAvailableWallets] = useState<string[]>([]);

  useEffect(() => {
    // Get available wallets (with a small delay to ensure wallet extensions are loaded)
    const checkWallets = () => {
      const wallets = walletService.getAvailableWallets();
      console.log('[WalletConnectButton] Available wallets:', wallets);
      setAvailableWallets(wallets);
    };
    
    // Check immediately
    checkWallets();
    
    // Also check after a short delay (wallet extensions might load asynchronously)
    const timeout = setTimeout(checkWallets, 500);
    
    // Set initial state
    setWalletState(walletService.getState());

    // Listen for wallet state changes
    const unsubscribe = walletService.onStateChange((state) => {
      console.log('[WalletConnectButton] Wallet state changed:', state);
      setWalletState(state);
    });

    return () => {
      clearTimeout(timeout);
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const handleConnect = async (walletName?: string) => {
    console.log('[WalletConnectButton] handleConnect called', walletName);
    setIsConnecting(true);
    try {
      console.log('[WalletConnectButton] Calling walletService.connect...');
      const address = await walletService.connect(walletName);
      console.log('[WalletConnectButton] Connection successful, address:', address);
      const walletName_ = walletService.getWalletName();
      setWalletState({ connected: true, address, walletName: walletName_ || undefined });
      toast({
        title: "Wallet Connected",
        description: `Connected to ${walletName_ || 'wallet'} (${walletService.formatAddress(address)})`,
      });
    } catch (error: any) {
      console.error('[WalletConnectButton] Connection error:', error);
      const errorMessage = error?.message || 'Could not connect to wallet';
      toast({
        title: "Connection Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    await walletService.disconnect();
    setWalletState({ connected: false, address: null, walletName: undefined });
    toast({
      title: "Wallet Disconnected",
    });
  };

  if (walletState.connected && walletState.address) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            className="gap-2 glass-effect border-primary/30 hover:border-primary/60 hover:shadow-glow-sm transition-all duration-300"
          >
            <Wallet className="h-4 w-4" />
            <span className="font-medium">
              {walletState.walletName ? `${walletState.walletName}: ` : ''}
              {walletService.formatAddress(walletState.address)}
            </span>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="glass-effect border-primary/20">
          <DropdownMenuItem onClick={handleDisconnect} className="cursor-pointer">
            Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // If multiple wallets available, show dropdown
  if (availableWallets.length > 1) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            disabled={isConnecting}
            className="group relative gap-2 bg-gradient-primary hover:shadow-glow transition-all duration-300 hover:scale-105 font-medium overflow-hidden"
          >
            <span className="relative z-10 flex items-center gap-2">
              <Wallet className="h-4 w-4 transition-transform group-hover:rotate-12" />
              {isConnecting ? 'Connecting...' : 'Connect Wallet'}
              <ChevronDown className="h-4 w-4" />
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="glass-effect border-primary/20">
          {availableWallets.map((walletName) => (
            <DropdownMenuItem
              key={walletName}
              onClick={() => handleConnect(walletName)}
              className="cursor-pointer"
              disabled={isConnecting}
            >
              {walletName}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Single wallet or no wallet detected
  return (
    <Button 
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('[WalletConnectButton] Button clicked, availableWallets:', availableWallets);
        handleConnect();
      }}
      disabled={isConnecting}
      className="group relative gap-2 bg-gradient-primary hover:shadow-glow transition-all duration-300 hover:scale-105 font-medium overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <span className="relative z-10 flex items-center gap-2">
        <Wallet className="h-4 w-4 transition-transform group-hover:rotate-12" />
        {isConnecting 
          ? 'Connecting...' 
          : availableWallets.length === 0 
            ? 'No Wallet Found' 
            : 'Connect Wallet'}
      </span>
      <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </Button>
  );
};
