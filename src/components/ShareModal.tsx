import { useState } from 'react';
import { Share2, Copy, Check, Clock, Users, Trash2, ExternalLink, QrCode, Wallet, Plus, X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { shareService } from '@/services/share';
import { LocalFileMetadata } from '@/services/localFiles';
import { toast } from '@/hooks/use-toast';

interface ShareModalProps {
  file: LocalFileMetadata;
  onClose: () => void;
  onUpdate: () => void;
}

export function ShareModal({ file, onClose, onUpdate }: ShareModalProps) {
  const [expiresInHours, setExpiresInHours] = useState(24);
  const [maxAccess, setMaxAccess] = useState<number | undefined>(undefined);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [shareLinks, setShareLinks] = useState(shareService.getFileShareLinks(file.id));
  const [showQR, setShowQR] = useState<string | null>(null);
  const [allowedWallets, setAllowedWallets] = useState<string[]>([]);
  const [walletInput, setWalletInput] = useState('');

  const handleAddWallet = () => {
    const trimmed = walletInput.trim();
    if (!trimmed) return;
    
    // Basic validation for Sui address format (0x followed by 64 hex chars)
    if (!trimmed.match(/^0x[a-fA-F0-9]{64}$/)) {
      toast({
        title: 'Invalid Address',
        description: 'Please enter a valid Sui wallet address (0x...)',
        variant: 'destructive',
      });
      return;
    }
    
    if (allowedWallets.includes(trimmed)) {
      toast({
        title: 'Duplicate Address',
        description: 'This wallet address is already added',
        variant: 'destructive',
      });
      return;
    }
    
    setAllowedWallets([...allowedWallets, trimmed]);
    setWalletInput('');
  };

  const handleRemoveWallet = (address: string) => {
    setAllowedWallets(allowedWallets.filter(w => w !== address));
  };

  const handleGenerateLink = () => {
    try {
      const link = shareService.generateShareLink(
        file.id, 
        expiresInHours, 
        maxAccess,
        allowedWallets.length > 0 ? allowedWallets : undefined
      );
      setShareLinks(shareService.getFileShareLinks(file.id));
      
      // Reset form
      setAllowedWallets([]);
      setWalletInput('');
      
      toast({
        title: 'Share Link Created',
        description: allowedWallets.length > 0 
          ? `Link restricted to ${allowedWallets.length} wallet(s)`
          : 'Your shareable link has been generated',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate share link',
        variant: 'destructive',
      });
    }
  };

  const handleCopyLink = async (token: string) => {
    try {
      await shareService.copyShareLink(token);
      setCopiedToken(token);
      
      toast({
        title: 'Link Copied',
        description: 'Share link copied to clipboard',
      });

      setTimeout(() => setCopiedToken(null), 2000);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to copy link',
        variant: 'destructive',
      });
    }
  };

  const handleRevokeLink = (token: string) => {
    shareService.revokeShareLink(token);
    setShareLinks(shareService.getFileShareLinks(file.id));
    
    toast({
      title: 'Link Revoked',
      description: 'Share link has been revoked',
    });
  };

  const formatExpiryDate = (date: Date) => {
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''}`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
    return 'Expired';
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl glass-effect border-primary/20">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-primary" />
            Share File
          </DialogTitle>
          <DialogDescription>
            Create a shareable link for <span className="font-semibold">{file.name}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Generate New Link */}
          <div className="space-y-4 p-4 rounded-lg bg-primary/5 border border-primary/20">
            <h4 className="font-semibold">Generate New Link</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expires">Expires In (hours)</Label>
                <Input
                  id="expires"
                  type="number"
                  min="1"
                  max="720"
                  value={expiresInHours}
                  onChange={(e) => setExpiresInHours(parseInt(e.target.value) || 24)}
                  className="glass-effect"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxAccess">Max Access (optional)</Label>
                <Input
                  id="maxAccess"
                  type="number"
                  min="1"
                  placeholder="Unlimited"
                  value={maxAccess || ''}
                  onChange={(e) => setMaxAccess(e.target.value ? parseInt(e.target.value) : undefined)}
                  className="glass-effect"
                />
              </div>
            </div>

            {/* Wallet Access Control */}
            <div className="space-y-2">
              <Label htmlFor="walletAddress" className="flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                Restrict to Specific Wallets (optional)
              </Label>
              <div className="flex gap-2">
                <Input
                  id="walletAddress"
                  type="text"
                  placeholder="0x..."
                  value={walletInput}
                  onChange={(e) => setWalletInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddWallet()}
                  className="glass-effect font-mono text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleAddWallet}
                  disabled={!walletInput.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              {allowedWallets.length > 0 && (
                <div className="space-y-1 mt-2">
                  {allowedWallets.map((wallet) => (
                    <div
                      key={wallet}
                      className="flex items-center justify-between p-2 rounded bg-primary/5 border border-primary/10"
                    >
                      <span className="text-xs font-mono truncate flex-1">{wallet}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 flex-shrink-0"
                        onClick={() => handleRemoveWallet(wallet)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  <p className="text-xs text-muted-foreground mt-2">
                    Only these {allowedWallets.length} wallet(s) can access this link
                  </p>
                </div>
              )}
            </div>

            <Button 
              onClick={handleGenerateLink}
              className="w-full bg-gradient-primary hover:shadow-glow"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Generate Share Link
            </Button>
          </div>

          {/* Existing Links */}
          {shareLinks.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold">Active Share Links</h4>
              
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {shareLinks.map((link) => {
                  const isExpired = new Date() > link.expiresAt;
                  const stats = shareService.getShareLinkStats(link.token);
                  
                  return (
                    <div
                      key={link.token}
                      className="p-3 rounded-lg glass-effect border border-primary/10 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <Input
                            value={shareService.getShareLinkURL(link.token)}
                            readOnly
                            className="text-sm font-mono"
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleCopyLink(link.token)}
                            className="flex-shrink-0"
                            title="Copy link"
                          >
                            {copiedToken === link.token ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setShowQR(showQR === link.token ? null : link.token)}
                            className="flex-shrink-0"
                            title="Show QR code"
                          >
                            <QrCode className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleRevokeLink(link.token)}
                            className="flex-shrink-0 hover:bg-destructive/10"
                            title="Revoke link"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* QR Code */}
                      {showQR === link.token && (
                        <div className="flex justify-center p-4 bg-white rounded-lg">
                          <QRCodeSVG
                            value={shareService.getShareLinkURL(link.token)}
                            size={200}
                            level="H"
                            includeMargin={true}
                          />
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                        <Badge variant={isExpired ? 'destructive' : 'secondary'} className="gap-1">
                          <Clock className="h-3 w-3" />
                          {isExpired ? 'Expired' : `Expires in ${formatExpiryDate(link.expiresAt)}`}
                        </Badge>
                        
                        <Badge variant="secondary" className="gap-1">
                          <Users className="h-3 w-3" />
                          {stats?.accessCount || 0} access{stats?.maxAccess ? ` / ${stats.maxAccess}` : 'es'}
                        </Badge>

                        {link.requireWallet && link.allowedWallets && (
                          <Badge variant="default" className="gap-1">
                            <Wallet className="h-3 w-3" />
                            {link.allowedWallets.length} wallet(s)
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {shareLinks.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <ExternalLink className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No active share links</p>
              <p className="text-sm">Generate a link to share this file</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
